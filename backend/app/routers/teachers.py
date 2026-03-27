from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.teacher import Teacher
from app.schemas.teacher import TeacherCreate, TeacherRead, TeacherUpdate

router = APIRouter()


@router.get("", response_model=list[TeacherRead])
async def list_teachers(db: AsyncSession = Depends(get_db)) -> list[TeacherRead]:
    result = await db.execute(select(Teacher).order_by(Teacher.name))
    return [TeacherRead.model_validate(t) for t in result.scalars().all()]


@router.post("", response_model=TeacherRead)
async def create_teacher(body: TeacherCreate, db: AsyncSession = Depends(get_db)) -> TeacherRead:
    t = Teacher(**body.model_dump())
    db.add(t)
    await db.commit()
    await db.refresh(t)
    return TeacherRead.model_validate(t)


@router.get("/{teacher_id}", response_model=TeacherRead)
async def get_teacher(teacher_id: int, db: AsyncSession = Depends(get_db)) -> TeacherRead:
    t = await db.get(Teacher, teacher_id)
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return TeacherRead.model_validate(t)


@router.patch("/{teacher_id}", response_model=TeacherRead)
async def update_teacher(
    teacher_id: int,
    body: TeacherUpdate,
    db: AsyncSession = Depends(get_db),
) -> TeacherRead:
    t = await db.get(Teacher, teacher_id)
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(t, k, v)
    await db.commit()
    await db.refresh(t)
    return TeacherRead.model_validate(t)


@router.delete("/{teacher_id}")
async def delete_teacher(teacher_id: int, db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    t = await db.get(Teacher, teacher_id)
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    await db.delete(t)
    await db.commit()
    return {"status": "ok"}


@router.patch("/{teacher_id}/status", response_model=TeacherRead)
async def update_teacher_status(
    teacher_id: int,
    body: TeacherUpdate,
    db: AsyncSession = Depends(get_db),
) -> TeacherRead:
    """Quick status update endpoint."""
    t = await db.get(Teacher, teacher_id)
    if not t:
        raise HTTPException(status_code=404, detail="Teacher not found")
    if body.status is not None:
        t.status = body.status
    if body.status_note is not None:
        t.status_note = body.status_note
    await db.commit()
    await db.refresh(t)
    return TeacherRead.model_validate(t)
