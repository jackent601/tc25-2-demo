from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import os, json, time
import geopandas as gpd
from shape_optimisations.shape_optimisations import geoJsonDemo
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

@app.get("/available-depths")
def get_available_depths():
    try:
        file_path = os.path.join("environmentalData", "cmems_mod_glo_phy-so_anfc_0.083deg_P1D-m_1749908476181.nc")
        ds = xr.open_dataset(file_path)
        depths = ds['depth'].values.tolist()
        return depths
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/points-geojson")
async def get_points_geojson(depth: float = 0.0):
    try:
         # Load NetCDF file
        file_path = os.path.join("environmentalData", "cmems_mod_glo_phy-so_anfc_0.083deg_P1D-m_1749908476181.nc")
        ds = xr.open_dataset(file_path)

        # Extract salinity at specified depth
        salinity = ds['so'].sel(depth=depth)

        # Convert to DataFrame
        df = salinity.to_dataframe().reset_index().dropna(subset=['so'])
        df['depth'] = depth

        # Create GeoDataFrame
        geometry = [Point(xy) for xy in zip(df['longitude'], df['latitude'])]
        gdf = gpd.GeoDataFrame(df, geometry=geometry)
        gdf = gdf[['so', 'time', 'depth', 'geometry']]

        # Return as GeoJSON
        return JSONResponse(content=gdf.to_json())

    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="NetCDF file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



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
    
    
@app.get("/fill")
def run_fill_operation():
    time.sleep(2)
    path = os.path.join("geojson", "lookup_mocks", "exampleFill.geojson")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="GeoJSON not found")
    return FileResponse(path, media_type="application/geo+json")

@app.get("/opt-area")
def run_fill_operation():
    return geoJsonDemo

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

# Below is an exmaple of constructing geoJson on the fly
# @app.get("/fill")
# def run_fill_operation():
#     # Your fill logic here — we'll mock it for now
#     time.sleep(2)
#     gdf = gpd.GeoDataFrame.from_features([
#         {
#             "type": "Feature",
#             "geometry": {
#                 "type": "Polygon",
#                 "coordinates": [
#                 [
#                     [
#                         -16.164440535249298,
#                         64.69872960838514
#                     ],
#                     [
#                         -15.858403267285105,
#                         63.221264545144756
#                     ],
#                     [
#                         -13.899764752314262,
#                         62.88844410688576
#                     ],
#                     [
#                         -10.472147351115277,
#                         63.083051465158
#                     ],
#                     [
#                         -9.860072815186886,
#                         64.72487569309396
#                     ],
#                     [
#                         -10.594562258300948,
#                         65.64946895759081
#                     ],
#                     [
#                         -14.083387113092776,
#                         65.64946895759081
#                     ],
#                     [
#                         -16.164440535249298,
#                         64.69872960838514
#                     ]
#                 ]
#             ]
#             },
#             "properties": {"entity": "A"},
#         },
#         {
#             "type": "Feature",
#             "geometry": {
#                 "type": "Polygon",
#                 "coordinates": [
#                 [
#                     [
#                         -17.082552339141888,
#                         67.5681039580388
#                     ],
#                     [
#                         -17.14375979273472,
#                         66.19877135922313
#                     ],
#                     [
#                         -13.838557298721417,
#                         66.59091288020021
#                     ],
#                     [
#                         -9.492828093629846,
#                         67.73103093163358
#                     ],
#                     [
#                         -12.124748598121926,
#                         68.46162937010239
#                     ],
#                     [
#                         -16.89892997836337,
#                         68.57370435143335
#                     ],
#                     [
#                         -17.082552339141888,
#                         67.5681039580388
#                     ]
#                 ]
#             ]
#             },
#             "properties": {"entity": "B"},
#         },
# {
#             "type": "Feature",
#             "geometry": {
#                 "type": "Polygon",
#                 "coordinates": [
#                 [
#                     [
#                         -25.590388388546508,
#                         64.17047730084163
#                     ],
#                     [
#                         -22.34639334812605,
#                         63.79460683484652
#                     ],
#                     [
#                         -19.224813214891252,
#                         64.67255825970655
#                     ],
#                     [
#                         -18.61273867896286,
#                         66.00038770332645
#                     ],
#                     [
#                         -20.87741446189791,
#                         67.28616785862803
#                     ],
#                     [
#                         -24.672276584653932,
#                         66.88100975463487
#                     ],
#                     [
#                         -24.855898945432447,
#                         66.76055114119285
#                     ],
#                     [
#                         -26.32487783166058,
#                         65.31930639840047
#                     ],
#                     [
#                         -25.590388388546508,
#                         64.17047730084163
#                     ]
#                 ]
#             ]
#             },
#             "properties": {"entity": "C"},
#         },
#     ], crs="EPSG:4326")

#     return JSONResponse(content=json.loads(gdf.to_json()))