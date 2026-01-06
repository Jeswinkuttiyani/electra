"""
Database Setup and Migration Script

This script sets up the MongoDB database with proper indexes for the ELECTRON voting system.

Usage:
    python setup_db.py
"""

from pymongo import MongoClient, ASCENDING, DESCENDING
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

def setup_database():
    """Create collections and indexes"""
    try:
        client = MongoClient(MONGO_URI)
        db = client[DB_NAME]
        users = db["users"]
        
        print(f"📦 Connecting to database: {DB_NAME}")
        print(f"📍 MongoDB URI: {MONGO_URI}")
        
        # Create indexes
        print("\n🔍 Creating indexes...")
        
        # Unique index for email
        users.create_index([("email", ASCENDING)], unique=True)
        print("  ✓ Email index created")
        
        # Unique index for voter_id (for voters)
        users.create_index([("voter_id", ASCENDING)], unique=True, sparse=True)
        print("  ✓ Voter ID index created")
        
        # Index for user_type (for faster queries)
        users.create_index([("user_type", ASCENDING)])
        print("  ✓ User type index created")
        
        # Index for created_at (for sorting)
        users.create_index([("created_at", DESCENDING)])
        print("  ✓ Created at index created")
        
        print("\n✅ Database setup completed successfully!")
        print(f"\n📊 Collection Stats:")
        print(f"  - Total users: {users.count_documents({})}")
        print(f"  - Voters: {users.count_documents({'user_type': 'voter'})}")
        print(f"  - Admins: {users.count_documents({'user_type': 'admin'})}")
        
        client.close()
        
    except Exception as e:
        print(f"❌ Error setting up database: {str(e)}")
        raise

if __name__ == "__main__":
    setup_database()
