from blockchain import get_web3, _get_contract
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()
client = MongoClient(os.getenv('MONGO_URI'))
db = client[os.getenv('DB_NAME')]
config = db.blockchain_config.find_one({'key': 'active_contract'})

if not config:
    print("No active contract found in DB.")
else:
    addr = config['address']
    print(f"Contract Address in DB: {addr}")
    try:
        contract = _get_contract(addr)
        count = contract.functions.candidateCount().call()
        open_status = contract.functions.votingOpen().call()
        print(f"Blockchain Candidate Count: {count}")
        print(f"Blockchain Voting Open: {open_status}")
    except Exception as e:
        print(f"Error connecting to contract: {str(e)}")
client.close()
