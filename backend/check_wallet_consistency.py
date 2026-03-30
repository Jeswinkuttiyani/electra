from blockchain import get_web3
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
w3 = get_web3()
accounts = w3.eth.accounts
print(f"Current Ganache Accounts: {accounts}")

client = MongoClient(os.getenv("MONGO_URI"))
db = client[os.getenv("DB_NAME")]
voters = db.users.find({"user_type": "voter"})

print("\nVoters in MongoDB:")
for v in voters:
    wallet = v.get("wallet_address")
    status = "VALID" if wallet in accounts else "INVALID/EXPIRED"
    print(f"Email: {v['email']}, Saved Wallet: {wallet} -> [{status}]")

client.close()
