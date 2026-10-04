from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.core.db import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.models import User, AuditLog
from app.schemas.schemas import UserRegister, UserLogin, UserOut, TokenResponse, ForgotPasswordRequest
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Log action
    db.add(AuditLog(user_id=user.id, action="USER_REGISTERED", target_type="User", target_id=user.id))
    db.commit()

    return user

@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    token = create_access_token(subject=user.id)
    db.add(AuditLog(user_id=user.id, action="USER_LOGIN", target_type="User", target_id=user.id))
    db.commit()

    return TokenResponse(access_token=token, token_type="bearer")

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    return {"message": "If the email is registered, password reset instructions have been sent."}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.add(AuditLog(user_id=current_user.id, action="USER_LOGOUT", target_type="User", target_id=current_user.id))
    db.commit()
    return {"message": "Logged out successfully"}
