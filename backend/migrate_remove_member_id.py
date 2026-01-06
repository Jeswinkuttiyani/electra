"""
Migration Script: Remove member_id Index

This script removes the member_id index from the users collection to fix
the duplicate key error. The system now uses voter_id instead of member_id.

Usage:
    python migrate_remove_member_id.py
"""

from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

def remove_member_id_index():
    """Remove member_id index from users collection"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        users = db["users"]
        
        print(f"📦 Connecting to database: {DB_NAME}")
        print(f"📍 MongoDB URI: {MONGO_URI}")
        
        # List all indexes before removal
        print("\n🔍 Current indexes:")
        indexes = list(users.list_indexes())
        for idx in indexes:
            print(f"  - {idx['name']}: {idx.get('key', {})}")
        
        # Drop member_id index if it exists
        print("\n🗑️  Removing member_id index...")
        try:
            users.drop_index("member_id_1")
            print("  ✓ member_id_1 index dropped successfully")
        except Exception as e:
            if "index not found" in str(e).lower() or "no such index" in str(e).lower():
                print("  ℹ️  member_id_1 index not found (may have been already removed)")
            else:
                raise
        
        # Try alternative index name
        try:
            users.drop_index([("member_id", 1)])
            print("  ✓ member_id index dropped successfully (alternative method)")
        except Exception as e:
            if "index not found" in str(e).lower() or "no such index" in str(e).lower():
                pass  # Index doesn't exist, which is fine
            else:
                raise
        
        # List indexes after removal
        print("\n🔍 Updated indexes:")
        indexes = list(users.list_indexes())
        for idx in indexes:
            print(f"  - {idx['name']}: {idx.get('key', {})}")
        
        # Verify voter_id index exists (should be created separately if needed)
        print("\n✅ Migration completed successfully!")
        print("\n📊 Collection Stats:")
        print(f"  - Total users: {users.count_documents({})}")
        print(f"  - Voters: {users.count_documents({'user_type': 'voter'})}")
        print(f"  - Admins: {users.count_documents({'user_type': 'admin'})}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error during migration: {str(e)}")
        raise

if __name__ == "__main__":
    remove_member_id_index()

