
import os
from datetime import datetime,timedelta,timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError,VerificationError

password_hasher=PasswordHasher()

# Hash password during registration
def hash_password(password:str)->str:
    return password_hasher.hash(password)

# Verify password during login
def verify_password(password:str,stored_hash:str)->bool:
    try:
        return password_hasher.verify(stored_hash,password)
    except (VerifyMismatchError,VerificationError):
        return False

# Generate JWT after successful login
def create_access_token(user_id:int)->str:
    secret=os.getenv("JWT_SECRET_KEY")

    if not secret:
        raise RuntimeError("JWT_SECRET_KEY is missing")

    expiration=datetime.now(timezone.utc)+timedelta(minutes=30)

    payload={
        "sub":str(user_id),
        "exp":expiration,
    }

    return jwt.encode(payload,secret,algorithm="HS256")

# Verify a JWT and return its user ID
def decode_access_token(token:str)->int|None:
    secret=os.getenv("JWT_SECRET_KEY")

    if not secret:
        raise RuntimeError("JWT_SECRET_KEY is missing")

    try:
        payload=jwt.decode(token,secret,algorithms=["HS256"])
        return int(payload["sub"])
    except (jwt.InvalidTokenError,KeyError,ValueError,TypeError):
        return None
