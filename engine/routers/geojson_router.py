from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import os
import time

router = APIRouter()

GEOJSON_DIR = "geojson/areas"

@router.get("/geojson-names")
def list_geojson_files():
    files = [f for f in os.listdir(GEOJSON_DIR) if f.endswith(".geojson")]
    return [os.path.splitext(f)[0] for f in files]

@router.get("/geojson")
def get_geojson(name: str):
    path = os.path.join(GEOJSON_DIR, f"{name}.geojson")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="GeoJSON not found")
    return FileResponse(path, media_type="application/geo+json")

@router.get("/fill")
def run_fill_operation():
    time.sleep(2)
    path = os.path.join("geojson", "lookup_mocks", "exampleFill.geojson")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="GeoJSON not found")
    return FileResponse(path, media_type="application/geo+json")

@router.get("/opt-area")
def run_fill_operation():
    from shape_optimisations.shape_optimisations import geoJsonDemo
    return geoJsonDemo

@router.get("/polygon")
def get_polygon():
    return {
        "positions": [
            [-12.1118, 63.9029],
            [-14.4884, 62.5654],
            [-20.5995, 60.5865],
            [-20.7268, 60.5030],
            [-22.1273, 58.0095],
            [-21.9575, 57.9194],
            [-15.9313, 56.1652],
            [-9.9474, 56.7979],
            [-7.7831, 59.2031],
            [-9.3957, 60.5448],
            [-9.4382, 62.6240],
            [-7.9953, 64.3658],
            [-10.3718, 64.8931],
            [-12.1118, 63.9029]
        ]
    }
    