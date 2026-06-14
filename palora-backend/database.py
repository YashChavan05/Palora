import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

try:
    client = MongoClient(MONGO_URI)
except Exception as e:
    print("\n" + "="*80)
    print(f"⚠️  WARNING: Failed to connect to MongoDB Atlas ({MONGO_URI}):")
    print(f"   {e}")
    print("\n   This usually happens because the MongoDB Atlas cluster is PAUSED or DELETED.")
    print("   Please log into https://cloud.mongodb.com/ and resume your cluster.")
    print("\n   >>> FALLING BACK TO LOCAL MONGODB (mongodb://localhost:27017) TO KEEP THE APP RUNNING! <<<")
    print("="*80 + "\n")
    MONGO_URI = "mongodb://localhost:27017"
    client = MongoClient(MONGO_URI)

# Database
db = client.palora

# Collections
users_collection = db.users
companions_collection = db.companions
memories_collection = db.memories
chats_collection = db.chats

def get_db():
    return db
