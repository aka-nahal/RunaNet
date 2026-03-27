"""Proxy endpoint for OpenWeather API — keeps the API key server-side."""

from fastapi import APIRouter, HTTPException, Query
import httpx

from app.config import settings

router = APIRouter()

OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5"


@router.get("/current")
async def get_current_weather(
    city: str = Query(default="London", min_length=1),
    units: str = Query(default="metric", pattern="^(metric|imperial|standard)$"),
):
    api_key = settings.openweather_api_key
    if not api_key:
        raise HTTPException(status_code=503, detail="OpenWeather API key not configured")

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{OPENWEATHER_BASE}/weather",
            params={"q": city, "units": units, "appid": api_key},
        )

    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail=f"City not found: {city}")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="OpenWeather API error")

    data = resp.json()

    return {
        "city": data.get("name", city),
        "country": data.get("sys", {}).get("country", ""),
        "temp": data["main"]["temp"],
        "feels_like": data["main"]["feels_like"],
        "temp_min": data["main"]["temp_min"],
        "temp_max": data["main"]["temp_max"],
        "humidity": data["main"]["humidity"],
        "pressure": data["main"]["pressure"],
        "wind_speed": data["wind"]["speed"],
        "wind_deg": data["wind"].get("deg", 0),
        "description": data["weather"][0]["description"] if data.get("weather") else "",
        "icon": data["weather"][0]["icon"] if data.get("weather") else "01d",
        "icon_url": f"https://openweathermap.org/img/wn/{data['weather'][0]['icon']}@2x.png"
        if data.get("weather") else "",
        "visibility": data.get("visibility", 0),
        "clouds": data.get("clouds", {}).get("all", 0),
        "dt": data.get("dt", 0),
        "timezone": data.get("timezone", 0),
    }


@router.get("/forecast")
async def get_forecast(
    city: str = Query(default="London", min_length=1),
    units: str = Query(default="metric", pattern="^(metric|imperial|standard)$"),
):
    api_key = settings.openweather_api_key
    if not api_key:
        raise HTTPException(status_code=503, detail="OpenWeather API key not configured")

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{OPENWEATHER_BASE}/forecast",
            params={"q": city, "units": units, "appid": api_key, "cnt": 8},
        )

    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail=f"City not found: {city}")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="OpenWeather API error")

    data = resp.json()

    return {
        "city": data.get("city", {}).get("name", city),
        "country": data.get("city", {}).get("country", ""),
        "items": [
            {
                "dt": item["dt"],
                "temp": item["main"]["temp"],
                "description": item["weather"][0]["description"] if item.get("weather") else "",
                "icon": item["weather"][0]["icon"] if item.get("weather") else "01d",
                "icon_url": f"https://openweathermap.org/img/wn/{item['weather'][0]['icon']}@2x.png"
                if item.get("weather") else "",
            }
            for item in data.get("list", [])
        ],
    }
