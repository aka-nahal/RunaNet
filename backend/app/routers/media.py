import hashlib
import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.media import MediaAsset

router = APIRouter()

MEDIA_DIR = Path("./data/media")
MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100 MB (video files can be large)
ALLOWED_MIME = {
    # Images
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    "image/avif", "image/bmp",
    # Video
    "video/mp4", "video/webm", "video/ogg", "video/quicktime",
}
MIME_EXT = {
    "image/jpeg": ".jpg", "image/png": ".png", "image/gif": ".gif",
    "image/webp": ".webp", "image/svg+xml": ".svg", "image/avif": ".avif",
    "image/bmp": ".bmp",
    "video/mp4": ".mp4", "video/webm": ".webm", "video/ogg": ".ogv",
    "video/quicktime": ".mov",
}
VIDEO_MIME = {"video/mp4", "video/webm", "video/ogg", "video/quicktime"}


def _ensure_media_dir():
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)


@router.post("")
async def upload_media(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    if not file.content_type or file.content_type not in ALLOWED_MIME:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: {', '.join(sorted(ALLOWED_MIME))}",
        )

    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=400, detail=f"File too large. Max {MAX_UPLOAD_BYTES // 1024 // 1024} MB.")

    _ensure_media_dir()

    # Compute checksum for deduplication
    checksum = hashlib.sha256(data).hexdigest()

    # Check for duplicate
    result = await db.execute(
        select(MediaAsset).where(MediaAsset.checksum_sha256 == checksum).limit(1)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return {
            "id": existing.id,
            "url": f"/api/media/{existing.id}",
            "kind": existing.kind,
            "mime_type": existing.mime_type,
            "bytes_size": existing.bytes_size,
            "filename": os.path.basename(existing.local_path),
            "created_at": existing.created_at.isoformat(),
            "duplicate": True,
        }

    ext = MIME_EXT.get(file.content_type, ".bin")
    filename = f"{uuid.uuid4().hex[:12]}{ext}"
    filepath = MEDIA_DIR / filename

    with open(filepath, "wb") as f:
        f.write(data)

    kind = "video" if file.content_type in VIDEO_MIME else "image"
    asset = MediaAsset(
        kind=kind,
        local_path=str(filepath),
        mime_type=file.content_type,
        bytes_size=len(data),
        checksum_sha256=checksum,
    )
    db.add(asset)
    await db.commit()
    await db.refresh(asset)

    return {
        "id": asset.id,
        "url": f"/api/media/{asset.id}",
        "kind": asset.kind,
        "mime_type": asset.mime_type,
        "bytes_size": asset.bytes_size,
        "filename": filename,
        "created_at": asset.created_at.isoformat(),
        "duplicate": False,
    }


@router.get("")
async def list_media(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(MediaAsset).order_by(MediaAsset.created_at.desc())
    )
    assets = result.scalars().all()
    return [
        {
            "id": a.id,
            "url": f"/api/media/{a.id}",
            "kind": a.kind,
            "mime_type": a.mime_type,
            "bytes_size": a.bytes_size,
            "filename": os.path.basename(a.local_path),
            "created_at": a.created_at.isoformat(),
        }
        for a in assets
    ]


@router.get("/{media_id}")
async def serve_media(media_id: int, db: AsyncSession = Depends(get_db)):
    asset = await db.get(MediaAsset, media_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Media not found")
    path = Path(asset.local_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(
        path,
        media_type=asset.mime_type or "application/octet-stream",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@router.delete("/{media_id}")
async def delete_media(media_id: int, db: AsyncSession = Depends(get_db)):
    asset = await db.get(MediaAsset, media_id)
    if not asset:
        raise HTTPException(status_code=404, detail="Media not found")
    path = Path(asset.local_path)
    if path.exists():
        path.unlink()
    await db.delete(asset)
    await db.commit()
    return {"status": "ok"}
