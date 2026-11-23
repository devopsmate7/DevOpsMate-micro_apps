from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator




class SignupRequest(BaseModel):
    full_name: str = Field(min_length=3, max_length=60)
    email: EmailStr
    mobile: str = Field(min_length=10, max_length=10)
    city: str = Field(default="India", min_length=2, max_length=50)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("full_name", "city")
    @classmethod
    def letters_and_spaces(cls, v: str) -> str:
        v = v.strip()
        if not v.replace(" ", "").replace(".", "").replace("'", "").replace("-", "").isalpha():
            raise ValueError("Use letters and spaces only")
        return v

    @field_validator("mobile", mode="before")
    @classmethod
    def ten_digits(cls, v: str) -> str:
        v = str(v).strip().replace(" ", "").replace("-", "")
        if v.startswith("+91"):
            v = v[3:]
        elif v.startswith("91") and len(v) == 12:
            v = v[2:]
        if not v.isdigit() or len(v) != 10:
            raise ValueError("Enter a valid 10-digit phone number")
        return v

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: EmailStr) -> str:
        return str(v).strip().lower()


class LoginRequest(BaseModel):
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v):
        if v is None:
            return v
        return str(v).strip().lower()

    @field_validator("mobile")
    @classmethod
    def normalize_mobile(cls, v):
        if v is None or v == "":
            return None
        v = str(v).strip().replace(" ", "").replace("-", "")
        if v.startswith("+91"):
            v = v[3:]
        elif v.startswith("91") and len(v) == 12:
            v = v[2:]
        if not v.isdigit() or len(v) != 10:
            raise ValueError("Enter a valid 10-digit phone number")
        return v

    @model_validator(mode="after")
    def require_login_id(self):
        if not self.email and not self.mobile:
            raise ValueError("Provide mobile number or email")
        return self




class UserOut(BaseModel):
    id: str  # the user's mobile number (DynamoDB primary key / account identity)
    full_name: str
    email: str
    mobile: str
    city: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class MessageResponse(BaseModel):
    message: str
    mail: Optional[str] = None


class DeliverPackRequest(BaseModel):
    order_id: str = Field(min_length=3, max_length=40)
    email: EmailStr
    name: str = Field(default="Student", min_length=1, max_length=60)


class NotifyConnectRequest(BaseModel):
    booking_id: str = Field(min_length=3, max_length=40)
    email: EmailStr
    name: str = Field(default="Student", min_length=1, max_length=60)
    mobile: str = Field(default="", max_length=20)
    duration_min: int = 15
    priority: bool = False
    slot_start: str = Field(min_length=8, max_length=64)
    price_inr: int = 99
    meeting_link: str = Field(min_length=8, max_length=500)


class ProfileUpdateRequest(BaseModel):
    # mobile and email are the DynamoDB primary/secondary keys and are immutable
    # after signup, so they are intentionally not editable here.
    full_name: Optional[str] = Field(default=None, min_length=3, max_length=60)
    city: Optional[str] = Field(default=None, min_length=2, max_length=50)

    @field_validator("full_name", "city")
    @classmethod
    def letters_and_spaces(cls, v):
        if v is None:
            return v
        v = v.strip()
        if not v.replace(" ", "").replace(".", "").replace("'", "").replace("-", "").isalpha():
            raise ValueError("Use letters and spaces only")
        return v
