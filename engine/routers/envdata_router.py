from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import os
import xarray as xr
import geopandas as gpd
from shapely.geometry import Point
import pandas as pd

router = APIRouter()

NETCDF_PATH = os.path.join("environmentalData", "cmems_mod_glo_phy-so_anfc_0.083deg_P1D-m_1749908476181.nc")

@router.get("/available-depths")
def get_available_depths():
    try:
        ds = xr.open_dataset(NETCDF_PATH)
        return ds['depth'].values.tolist()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="NetCDF file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/points-geojson")
async def get_points_geojson(depth: float = 0.0):
    try:
        ds = xr.open_dataset(NETCDF_PATH)
        salinity = ds['so'].sel(depth=depth)
        df = salinity.to_dataframe().reset_index().dropna(subset=['so'])
        df['depth'] = depth
        geometry = [Point(xy) for xy in zip(df['longitude'], df['latitude'])]
        gdf = gpd.GeoDataFrame(df, geometry=geometry)
        gdf = gdf[['so', 'time', 'depth', 'geometry']]
        return JSONResponse(content=gdf.to_json())
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="NetCDF file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
