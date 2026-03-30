from pymongo import MongoClient
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

load_dotenv()
client = MongoClient(os.getenv('MONGO_URI'))
db = client[os.getenv('DB_NAME')]
db.users.update_one(
    {'email': 'jeswinkuttiyanickal@gmail.com'}, 
    {'$set': {'password': generate_password_hash('admin123')}}
)
print('Admin password reset successful')
client.close()
