from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from models.schemas import Memory, MemoryCreate, MemoryUpdate
from routes.auth import get_current_user
import uuid
from datetime import datetime
from typing import List

router = APIRouter()

@router.post("/", response_model=Memory)
def create_memory(memory: MemoryCreate, current_user = Depends(get_current_user), db = Depends(get_db)):
    companion = db.companions.find_one({"_id": memory.companion_id, "user_id": current_user["_id"]})
    if not companion:
        raise HTTPException(status_code=404, detail="Companion not found")
        
    mem_dict = memory.model_dump()
    mem_dict["_id"] = str(uuid.uuid4())
    mem_dict["user_id"] = current_user["_id"]
    mem_dict["created_at"] = datetime.utcnow()
    
    db.memories.insert_one(mem_dict)
    return mem_dict

@router.get("/", response_model=List[Memory])
def get_all_memories(current_user = Depends(get_current_user), db = Depends(get_db)):
    memories = list(db.memories.find({"user_id": current_user["_id"]}))

    for memory in memories:
        memory["_id"] = str(memory["_id"])

    return memories

@router.get("/companion/{companion_id}", response_model=List[Memory])
def get_companion_memories(companion_id: str, current_user = Depends(get_current_user), db = Depends(get_db)):
    companion = db.companions.find_one({"_id": companion_id, "user_id": current_user["_id"]})
    if not companion:
        raise HTTPException(status_code=404, detail="Companion not found")
        
    memories = list(db.memories.find({"companion_id": companion_id, "user_id": current_user["_id"]}))
    return memories

@router.put("/{memory_id}", response_model=Memory)
def update_memory(memory_id: str, update: MemoryUpdate, current_user = Depends(get_current_user), db = Depends(get_db)):
    memory = db.memories.find_one({"_id": memory_id, "user_id": current_user["_id"]})
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    db.memories.update_one(
        {"_id": memory_id},
        {"$set": {"content": update.content}}
    )
    memory["content"] = update.content
    return memory

@router.delete("/{memory_id}")
def delete_memory(memory_id: str, current_user = Depends(get_current_user), db = Depends(get_db)):
    memory = db.memories.find_one({"_id": memory_id, "user_id": current_user["_id"]})
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found")

    db.memories.delete_one({"_id": memory_id})
    return {"message": "Memory deleted"}
