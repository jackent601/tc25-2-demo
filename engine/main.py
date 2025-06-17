from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import os, json, time
import geopandas as gpd
# from shape_optimisations.shape_optimisations import geoJsonDemo
from shape_optimisations import georouter

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React/Vite frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(georouter.router)

GEOJSON_DIR = "geojson/areas"

# returns named of pre-loaded AOOs
@app.get("/geojson-names")
def list_geojson_files():
    files = [f for f in os.listdir(GEOJSON_DIR) if f.endswith(".geojson")]
    return [os.path.splitext(f)[0] for f in files]  # return names without extension

# returns geojson of pre-loaded AOOs
@app.get("/geojson")
def get_geojson(name: str):
    path = os.path.join(GEOJSON_DIR, f"{name}.geojson")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="GeoJSON not found")
    return FileResponse(path, media_type="application/geo+json")
    
# example of returning polygons that can be coloured using arbitrary attributes
@app.get("/coloured-polygons")
def run_fill_operation():
    time.sleep(2)
    path = os.path.join("geojson", "lookup_mocks", "exampleColouredPolygons.geojson")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="GeoJSON not found")
    return FileResponse(path, media_type="application/geo+json")

# Serves an example polygon to be consumed by UI (not currently used)
@app.get("/polygon")
def get_polygon():
    return {
        "positions": [
                    [
                        -12.111803885406676,
                        63.902943934445275
                    ],
                    [
                        -14.488361303890391,
                        62.565373813303836
                    ],
                    [
                        -20.599508951419956,
                        60.586498459383485
                    ],
                    [
                        -20.72682452741015,
                        60.50302304249223
                    ],
                    [
                        -22.12729586330234,
                        58.00946023815261
                    ],
                    [
                        -21.95754176198208,
                        57.91941499064066
                    ],
                    [
                        -15.93127116511265,
                        56.16516726918997
                    ],
                    [
                        -9.947439093573287,
                        56.79788898873035
                    ],
                    [
                        -7.783074301739908,
                        59.20309590556092
                    ],
                    [
                        -9.395738264282429,
                        60.54478766968278
                    ],
                    [
                        -9.43817678961249,
                        62.62397489855744
                    ],
                    [
                        -7.995266928390236,
                        64.36579001447011
                    ],
                    [
                        -10.371824346873954,
                        64.89309806901132
                    ],
                    [
                        -12.111803885406676,
                        63.902943934445275
                    ]
                ]
    }