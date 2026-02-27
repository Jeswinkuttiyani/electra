import os
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()

GANACHE_URL = os.getenv("GANACHE_URL", "http://localhost:7545")

print(f"Checking connection to Ganache at: {GANACHE_URL}...")

try:
    w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
    if w3.is_connected():
        print("✅ SUCCESS: Connected to Ganache!")
        print(f"Accounts found: {w3.eth.accounts}")
        print(f"Current Block: {w3.eth.block_number}")
    else:
        print("❌ FAILED: Cannot connect to Ganache.")
        print(f"Make sure Ganache is running at {GANACHE_URL}")
except Exception as e:
    print(f"❌ ERROR: {str(e)}")
