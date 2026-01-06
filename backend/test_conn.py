from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

uri = os.getenv("MONGO_URI")
db_name = os.getenv("DB_NAME")

print("Using URI:", uri)

client = MongoClient(uri, serverSelectionTimeoutMS=5000)

try:
    # Try to get server info
    info = client.server_info()
    print("Connected to MongoDB Atlas! Version:", info["version"])

    db = client[db_name]
    print("Database:", db_name)
    print("Collections:", db.list_collection_names())
    print("STATUS: SUCCESS – Backend can talk to Atlas.")

except Exception as e:
    print("STATUS: FAILED – Cannot reach MongoDB Atlas.")
    print("ERROR:", e)
