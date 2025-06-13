from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React/Vite frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEOJSON_DIR = "geojson"

@app.get("/geojson-names")
def list_geojson_files():
    files = [f for f in os.listdir(GEOJSON_DIR) if f.endswith(".geojson")]
    return [os.path.splitext(f)[0] for f in files]  # return names without extension

@app.get("/geojson")
def get_geojson(name: str):
    path = os.path.join(GEOJSON_DIR, f"{name}.geojson")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="GeoJSON not found")
    return FileResponse(path, media_type="application/geo+json")

@app.get("/polygons")
async def get_polygons():
    return [
        {
            "id": 1,
            "name": "Triangle",
            "coordinates": [
                [-100.0, 40.0],
                [-105.0, 45.0],
                [-110.0, 40.0],
                [-100.0, 40.0]
            ],
        },
        {
            "id": 2,
            "name": "Square",
            "coordinates": [
                [-90.0, 30.0],
                [-90.0, 35.0],
                [-85.0, 35.0],
                [-85.0, 30.0],
                [-90.0, 30.0]
            ],
        },
    ]
    
@app.get("/polygon")
def get_polygon():
    return {
        "positions": [
            [12.4924, 41.8902],  # Rome
            [12.4964, 41.9028],  # Near Rome
            [12.4833, 41.8992],  # Near Rome
        ]
    }
