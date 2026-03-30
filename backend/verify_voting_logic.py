import requests
import json
import os
from pymongo import MongoClient
from werkzeug.security import generate_password_hash
from dotenv import load_dotenv
import datetime

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
BASE_URL = "http://127.0.0.1:5000/api"

def verify_full_flow():
    print("=" * 60)
    print("INTEGRATION TEST: BACKEND-MANAGED VOTING")
    print("=" * 60)

    try:
        # 1. Connect to MongoDB and find a voter
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        users = db["users"]
        votes = db["votes"]
        
        # Find a voter who hasn't voted yet
        voter = users.find_one({"user_type": "voter", "has_account": True})
        if not voter:
            print("❌ No voter found with an account. Please sign up a voter first.")
            return

        voter_id = voter["voter_id"]
        print(f"Found voter ID: {voter_id}")

        # 2. Reset password to '123456' for testing
        test_pass = "123456"
        users.update_one({"_id": voter["_id"]}, {"$set": {"password": generate_password_hash(test_pass)}})
        print("✓ Reset password for test voter")

        # 3. Login via API
        login_res = requests.post(f"{BASE_URL}/login", json={
            "email": voter["email"],
            "password": test_pass,
            "userType": "voter"
        })
        
        if login_res.status_code != 200:
            print("❌ Login failed")
            return
        
        token = login_res.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("✓ Login successful")

        # 4. Check if already voted
        if votes.find_one({"voter_id": voter_id}):
            print("⚠️ Deleting old vote record...")
            votes.delete_one({"voter_id": voter_id})

        # 5. Fetch Candidates to get a valid ID
        print("Fetching candidates...")
        cand_res = requests.get(f"{BASE_URL}/blockchain/candidates", headers=headers)
        candidates = cand_res.json().get("candidates", [])
        if not candidates:
            print("❌ No candidates found")
            return
        
        target_candidate_id = candidates[0].get("id") or candidates[0].get("candidate_id")
        print(f"✓ Using candidate ID: {target_candidate_id}")

        # 6. Cast vote via backend API
        print(f"Attempting to cast vote for candidate ID {target_candidate_id}...")
        vote_payload = {"candidate_ids": [target_candidate_id]}
        print(f"Payload: {json.dumps(vote_payload)}")
        vote_res = requests.post(f"{BASE_URL}/blockchain/cast-vote", 
                                 json=vote_payload,
                                 headers=headers)
        
        print(f"Response Status: {vote_res.status_code}")
        try:
            response_json = vote_res.json()
            print(f"Response Data: {json.dumps(response_json, indent=2)}")
        except:
            print(f"Response Raw: {vote_res.text}")
            return

        if vote_res.status_code == 201 and response_json.get("success"):
            print("✅ SUCCESS! Vote cast successfully without MetaMask signature.")
            print(f"   Transaction Hash: {response_json.get('tx_hash')}")
        else:
            print(f"❌ Vote failed: {response_json.get('message')}")

    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
    finally:
        client.close()

if __name__ == "__main__":
    verify_full_flow()
