from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class User(BaseModel):
    id: str = Field(alias="_id")
    email: str
    name: Optional[str] = None

class ProfileUpdate(BaseModel):
    name: Optional[str] = None

class SettingsUpdate(BaseModel):
    notifications: Optional[bool] = None
    emailNotifs: Optional[bool] = None
    callSounds: Optional[bool] = None
    voiceMessages: Optional[bool] = None
    privateMode: Optional[bool] = None
    dataCollection: Optional[bool] = None
     
class Token(BaseModel):
    access_token: str
    token_type: str

class CompanionCreate(BaseModel):
    name: str
    description: str
    personality: str
    memories: List[str] = []
    
class Companion(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    name: str
    description: str
    personality: Optional[str] = None
    memories: Optional[List[str]] = []
    voice_id: Optional[str] = None
    voice_profile: Optional[dict] = None
    created_at: datetime

    class Config:
        populate_by_name = True

class ChatMessage(BaseModel):
    content: str
    
class ChatCreate(BaseModel):
    companion_id: str

class Chat(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    companion_id: str
    messages: List[ChatMessage] = []
    created_at: datetime
    updated_at: datetime

class MemoryCreate(BaseModel):
    companion_id: str
    content: str

class MemoryUpdate(BaseModel):
    content: str
   
class Memory(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    companion_id: str
    content: str
    created_at: datetime