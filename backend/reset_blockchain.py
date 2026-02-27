import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

def reset_blockchain_data():
    """Wipe blockchain-related configuration and votes from MongoDB."""
    print(f"🔄 Resetting blockchain data in database: {DB_NAME}")
    
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        
        # Collections to clear
        bc_config = db["blockchain_config"]
        votes = db["votes"]
        
        # Delete stale contract info
        conf_result = bc_config.delete_many({})
        print(f"  ✓ Cleared blockchain_config: {conf_result.deleted_count} items removed.")
        
        # Delete all blockchain votes
        vote_result = votes.delete_many({})
        print(f"  ✓ Cleared votes: {vote_result.deleted_count} items removed.")
        
        print("\n✅ Blockchain data reset successfully!")
        client.close()
        
    except Exception as e:
        print(f"❌ Error resetting blockchain data: {str(e)}")

if __name__ == "__main__":
    reset_blockchain_data()
