import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://127.0.0.1:5000/api"

def sync_and_vote():
    # 1. Login as Admin
    admin_email = "jeswinkuttiyanickal@gmail.com"
    admin_pass = "admin123"
    print(f"Logging in as admin {admin_email}...")
    login_res = requests.post(f"{BASE_URL}/login", json={
        "email": admin_email,
        "password": admin_pass,
        "userType": "admin"
    })
    
    if login_res.status_code != 200:
        print(f"❌ Admin login failed: {login_res.text}")
        return
    
    admin_token = login_res.json()["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1.5. Deploy Contract
    print("Deploying contract...")
    deploy_res = requests.post(f"{BASE_URL}/blockchain/deploy", headers=admin_headers)
    print(f"Deploy result: {deploy_res.status_code} - {deploy_res.json()}")

    # 2. Sync candidates to blockchain
    print("Syncing candidates to blockchain...")
    sync_res = requests.post(f"{BASE_URL}/blockchain/add-candidates", headers=admin_headers)
    print(f"Sync result: {sync_res.status_code} - {sync_res.json()}")

    # 3. Start voting if needed
    print("Starting voting...")
    start_res = requests.post(f"{BASE_URL}/blockchain/start-voting", headers=admin_headers)
    print(f"Start voting result: {start_res.status_code} - {start_res.json()}")

    # 4. Now run the voting test again
    print("\nRunning voting test...")
    import subprocess
    subprocess.run(["python", "verify_voting_logic.py"])

if __name__ == "__main__":
    sync_and_vote()
