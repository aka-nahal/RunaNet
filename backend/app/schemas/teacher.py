from datetime import datetime

from pydantic import BaseModel, Field


class TeacherCreate(BaseModel):
    name: str
    department: str = ""
    subject: str | None = None
    email: str | None = None
    phone: str | None = None
    room: str | None = None
    status: str = Field(default="available", pattern="^(available|busy|in_class|on_leave|unavailable)$")
    status_note: str | None = None
    schedule_json: str | None = None
    avatar_url: str | None = None
    is_active: bool = True


class TeacherUpdate(BaseModel):
    name: str | None = None
    department: str | None = None
    subject: str | None = None
    email: str | None = None
    phone: str | None = None
    room: str | None = None
    status: str | None = None
    status_note: str | None = None
    schedule_json: str | None = None
    avatar_url: str | None = None
    is_active: bool | None = None


class TeacherRead(BaseModel):
    id: int
    name: str
    department: str
    subject: str | None
    email: str | None
    phone: str | None
    room: str | None
    status: str
    status_note: str | None
    schedule_json: str | None
    avatar_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
