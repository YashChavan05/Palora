from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from database import get_db
from auth import get_password_hash, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from models.schemas import UserCreate, Token, User, ProfileUpdate, SettingsUpdate
from jose import JWTError, jwt
from auth import SECRET_KEY, ALGORITHM
from datetime import timedelta
import uuid

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.users.find_one({"_id": user_id})
    if user is None:
        raise credentials_exception
    return user


@router.post("/signup", response_model=User)
def signup(user: UserCreate, db = Depends(get_db)):
    existing_user = db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user.model_dump()
    user_dict["password"] = get_password_hash(user_dict.pop("password"))
    user_dict["_id"] = str(uuid.uuid4())
    
    db.users.insert_one(user_dict)
    return user_dict


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db = Depends(get_db)):
    user = db.users.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["_id"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=User)
def get_me(current_user = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=User)
def update_profile(update: ProfileUpdate, current_user = Depends(get_current_user), db = Depends(get_db)):
    fields = {k: v for k, v in update.model_dump().items() if v is not None}
    if fields:
        db.users.update_one({"_id": current_user["_id"]}, {"$set": fields})
        current_user.update(fields)
    return current_user


@router.put("/settings")
def update_settings(update: SettingsUpdate, current_user = Depends(get_current_user), db = Depends(get_db)):
    fields = {k: v for k, v in update.model_dump().items() if v is not None}
    if fields:
        db.users.update_one({"_id": current_user["_id"]}, {"$set": {"settings": {**current_user.get("settings", {}), **fields}}})
    return {"message": "Settings updated"}


@router.get("/settings")
def get_settings(current_user = Depends(get_current_user)):
    return current_user.get("settings", {})
