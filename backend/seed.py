"""Seed the database with a demo layout, notices, and tiles."""
import asyncio
import json

from app.database import AsyncSessionLocal, init_db
from app.models.layout import Layout, LayoutVersion
from app.models.notice import Notice
from app.models.tile import Tile


SAMPLE_NOTICES = [
    {
        "title": "Final Exams Schedule Released",
        "body": "The final examination timetable for Spring 2026 is now available on the student portal. Please check your personalized schedule and report any conflicts to the registrar before April 1.",
        "summary": "Spring 2026 final exam timetable is live on the student portal.",
        "category": "academic",
        "priority": 80,
        "tags": ["exams", "schedule", "spring-2026"],
    },
    {
        "title": "Campus Wi-Fi Maintenance",
        "body": "IT Services will perform network maintenance on Saturday March 28, 2:00 AM – 6:00 AM. Expect intermittent connectivity across all buildings.",
        "summary": "Wi-Fi downtime Sat Mar 28, 2–6 AM.",
        "category": "infrastructure",
        "priority": 40,
        "tags": ["wifi", "maintenance", "IT"],
    },
    {
        "title": "Annual Cultural Fest — Resonance 2026",
        "body": "Join us April 10–12 for three days of music, dance, art, and food. Register your team for competitions at resonance.campus.edu.",
        "summary": "Resonance 2026: April 10–12. Register now!",
        "category": "events",
        "priority": 60,
        "tags": ["cultural", "fest", "resonance"],
    },
    {
        "title": "Library Extended Hours",
        "body": "Starting March 25, the main library will stay open until midnight on weekdays to support exam preparation.",
        "summary": "Library open until midnight on weekdays from Mar 25.",
        "category": "academic",
        "priority": 30,
        "tags": ["library", "hours"],
    },
    {
        "title": "Placement Drive — TechCorp",
        "body": "TechCorp is visiting campus on April 5 for B.Tech and M.Tech students. Eligible branches: CSE, ECE, IT. Pre-register on the placement portal.",
        "summary": "TechCorp placement drive Apr 5 — CSE/ECE/IT.",
        "category": "placement",
        "priority": 70,
        "tags": ["placement", "techcorp"],
    },
    {
        "title": "Blood Donation Camp",
        "body": "NSS is organizing a blood donation camp on March 30 at the auditorium. Walk-ins welcome between 9 AM – 4 PM.",
        "summary": "Blood donation camp Mar 30, 9 AM–4 PM, auditorium.",
        "category": "health",
        "priority": 50,
        "tags": ["nss", "blood-donation", "health"],
    },
]


async def seed():
    import app.models  # noqa: F401

    await init_db()
    async with AsyncSessionLocal() as db:
        notices: list[Notice] = []
        for data in SAMPLE_NOTICES:
            n = Notice(
                title=data["title"],
                body=data["body"],
                summary=data["summary"],
                category=data["category"],
                priority=data["priority"],
                tags_json=json.dumps(data["tags"]),
            )
            db.add(n)
            notices.append(n)
        await db.flush()

        layout = Layout(name="Main Board")
        db.add(layout)
        await db.flush()

        lv = LayoutVersion(
            layout_id=layout.id,
            version=1,
            grid_cols=12,
            grid_rows=8,
            gap_px=10,
            is_published=True,
        )
        db.add(lv)
        await db.flush()

        tile_specs = [
            # (grid_x, grid_y, grid_w, grid_h, notice_index, tile_type)
            (0, 0, 5, 3, 0, "notice"),    # Exams — top-left, big
            (5, 0, 4, 2, 2, "notice"),     # Cultural fest — top-center
            (9, 0, 3, 2, 4, "notice"),     # Placement — top-right
            (0, 3, 3, 2, 1, "notice"),     # Wi-Fi maintenance
            (3, 3, 4, 3, 3, "notice"),     # Library hours
            (7, 2, 5, 3, 5, "notice"),     # Blood donation
            (0, 5, 12, 1, None, "ticker"), # Bottom ticker
            (0, 6, 3, 2, None, "clock"),   # Clock widget
            (3, 6, 9, 2, None, "banner"),  # Announcement banner
        ]

        for i, (gx, gy, gw, gh, ni, ttype) in enumerate(tile_specs):
            tile = Tile(
                layout_version_id=lv.id,
                tile_type=ttype,
                grid_x=gx,
                grid_y=gy,
                grid_w=gw,
                grid_h=gh,
                z_index=i,
                notice_id=notices[ni].id if ni is not None else None,
                priority_weight=notices[ni].priority if ni is not None else 0,
            )
            db.add(tile)

        await db.commit()
        print(f"Seeded {len(notices)} notices, 1 layout, {len(tile_specs)} tiles.")


if __name__ == "__main__":
    asyncio.run(seed())
