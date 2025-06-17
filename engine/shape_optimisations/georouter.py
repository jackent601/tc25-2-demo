from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import numpy as np
from shapely.geometry import MultiPolygon, Polygon, Point, mapping
from shapely.ops import unary_union
import matplotlib.pyplot as plt
from matplotlib.patches import Patch, Wedge
import pulp
import json

router = APIRouter()

""" 
fudge function to coerce cesium POST json data into a shapely.geometry MultiPolygon
exactly the type of fudge that isnt needed once API to core utils is well defined between
vis layer and object layer (and vice versa)
"""
def geojson_to_multipolygon(geojson):
    polygons = []

    for feature in geojson.get('features', []):
        geom = feature.get('geometry', {})
        if geom.get('type') == 'Polygon':
            # Extract outer ring and holes
            coords = geom.get('coordinates', [])
            if coords:
                outer = coords[0]
                holes = coords[1:] if len(coords) > 1 else []
                polygons.append(Polygon(shell=outer, holes=holes))

    return MultiPolygon([(p.exterior.coords[:], []) for p in polygons])

# azimuths = [0.0, 22.5, 45.0, 67.5, 90.0, 112.5, 135.0, 157.5, 180.0, 202.5, 225.0, 247.5, 270.0, 292.5, 315.0, 337.5]

azimuths = [0.0, 22.5, 45.0, 67.5, 90.0, 112.5, 135.0, 157.5, 180.0, 202.5, 225.0, 247.5, 270.0, 292.5, 315.0, 337.5]
configurations=[]
for a in azimuths:
    configurations.append(    
        {
            'azimuth_degree': a,
            'fan_degree': 50,
            'range_km': 130,
        } 
    )
    configurations.append(    
        {
            'azimuth_degree': a,
            'fan_degree': 130,
            'range_km': 70,
        } 
    )
    
# --- Step 1: Helper functions ---

def create_fan_polygon(center_lon, center_lat, range_km, orientation_deg, fan_angle_deg):
    EARTH_RADIUS_KM = 6371
    range_deg = (range_km / EARTH_RADIUS_KM) * (180 / np.pi)
    angles = np.linspace(orientation_deg - fan_angle_deg / 2,
                         orientation_deg + fan_angle_deg / 2,
                         20)
    arc_points = []
    for angle in angles:
        d_lat = range_deg * np.cos(np.radians(angle))
        d_lon = range_deg * np.sin(np.radians(angle)) / np.cos(np.radians(center_lat))
        arc_points.append((center_lon + d_lon, center_lat + d_lat))
    fan_points = [(center_lon, center_lat)] + arc_points
    return Polygon(fan_points)

def get_grid_points_in_polygon_km(polygon, resolution_km=10):
    EARTH_RADIUS_KM = 6371
    min_lon, min_lat, max_lon, max_lat = polygon.bounds
    grid_points = []
    lat_step = (resolution_km / EARTH_RADIUS_KM) * (180 / np.pi)
    current_lat = min_lat
    while current_lat <= max_lat:
        deg_lon_dist_km = (np.pi / 180) * EARTH_RADIUS_KM * np.cos(np.radians(current_lat))
        lon_step = resolution_km / deg_lon_dist_km if deg_lon_dist_km > 0 else max_lon - min_lon + 1
        current_lon = min_lon
        while current_lon <= max_lon:
            point = Point(current_lon, current_lat)
            if polygon.contains(point):
                grid_points.append(point)
            current_lon += lon_step
        current_lat += lat_step
    return grid_points

def export_to_geojson(filename, op_area, placed_sensors):
    """
    Exports the sensor placement results to a GeoJSON file.

    Args:
        filename (str): The path for the output GeoJSON file.
        op_area (shapely.Polygon): The operational area polygon.
        placed_sensors (list): A list of dictionaries, where each dictionary
                               contains info about a placed sensor (location, config:Dict[str,Any]).
    """
    features = []

    # 1. Add the Operational Area Feature
    if op_area is not None:
        op_area_feature = {
            "type": "Feature",
            "geometry": mapping(op_area),
            "properties": {
                "name": "Operational Area",
                "type": "boundary"
            }
        }
        features.append(op_area_feature)

    # 2. Add a Feature for each Sensor (Point) and its Coverage Area (Polygon)
    for i, sensor in enumerate(placed_sensors):
        loc = sensor['location']
                
        # Create the coverage fan polygon
        fan_poly = create_fan_polygon(
            center_lon=loc.x,
            center_lat=loc.y,
            range_km=sensor['config']['range_km'],
            orientation_deg=sensor['config']['azimuth_degree'],
            fan_angle_deg=sensor['config']['fan_degree']
        )

        # Add Sensor Point Feature
        sensor_point_feature = {
            "type": "Feature",
            "geometry": mapping(loc),
            "properties": {
                "type": "Sensor Placement",
                "id": i,
                "marker-symbol": "circle"
            }
        }
        features.append(sensor_point_feature)

        # Add Coverage Area Feature
        coverage_area_feature = {
            "type": "Feature",
            "geometry": mapping(fan_poly),
            "properties": {
                "type": "Coverage Area",
                "sensor_id": i,
                "range_km": sensor['config']['range_km'],
                "orientation_deg": sensor['config']['azimuth_degree'],
                "fan_angle_deg": sensor['config']['fan_degree'],
                "fill":"#FF0000",
                "fill-opacity": 0.5
            }
        }
        features.append(coverage_area_feature)

    # Assemble the final GeoJSON FeatureCollection
    geojson_output = {
        "type": "FeatureCollection",
        "features": features
    }

    # Write the object to a file
    if filename is not None:
        with open(filename, 'w') as f:
            json.dump(geojson_output, f)
        
        print(f"Successfully exported data to {filename}")
        
    return geojson_output

""" Runs optimisation over AOO and config space, returns sensor placement info"""
def calculateOptimise(AOO):
    # --- Step 2: Define problem parameters ---

    locations = get_grid_points_in_polygon_km(AOO, 60)
    num_locations = len(locations)
    num_configs = len(configurations)
    max_sensors = 99
    coverage_requirement = 0.70

    # TODO: Can this variable be continuous (0.0-1.0) instead in order to give fine control over the degree of overlapping?
    encourage_overlapping = False


    # --- Step 3: Pre-calculate Covers matrix ---
    covers = np.zeros((num_locations, num_locations, num_configs))
    for l_idx, l_point in enumerate(locations):
        for j_idx, j_key in enumerate(configurations):
            fan_poly = create_fan_polygon(l_point.x, l_point.y, j_key['range_km'], j_key['azimuth_degree'], j_key['fan_degree'])
            for i_idx, i_point in enumerate(locations):
                if fan_poly.contains(i_point):
                    covers[i_idx, l_idx, j_idx] = 1


    # --- Step 4: Build and solve the optimization problem ---

    prob = pulp.LpProblem("Sensor_Placement", pulp.LpMinimize)
    x = pulp.LpVariable.dicts("Place", (range(num_locations), range(num_configs)), cat='Binary')
    y = pulp.LpVariable.dicts("IsCovered", range(num_locations), cat='Binary')

    y_prime = pulp.LpVariable.dicts("CoveredCount", range(num_locations), cat='Integer')
    # Objective: Encourage sensor overlapping by subtracting the overlapping cover count
    prob += pulp.lpSum(x[l][j] for l in range(num_locations) for j in range(num_configs)) - encourage_overlapping * pulp.lpSum(y_prime[i]-1 for i in range(num_locations)), "Objective_func"
    # Constraint: The covered count variable (y_prime) should  be greater than or equal to the is_covered variable
    prob += pulp.lpSum(y_prime[i] for i in range(num_locations)) >= encourage_overlapping * pulp.lpSum(y[i] for i in range(num_locations))

    # Constraint: Avoid excessively overlapping the sensors, currently limit at 2
    for i in range(num_locations):
        prob += y_prime[i] <= 2

    # Constraint: Link the covered_count variable (y_prime) to the placement variables
    for i in range(num_locations):
        prob += pulp.lpSum(covers[i, l, j] * x[l][j] for l in range(num_locations) for j in range(num_configs)) >= encourage_overlapping * y_prime[i]

    # Constraint: Don't exceed the maximum number of available sensors
    prob += pulp.lpSum(x[l][j] for l in range(num_locations) for j in range(num_configs)) <= max_sensors

    # Constraint: Achieve the required percentage of grid point coverage
    prob += pulp.lpSum(y[i] for i in range(num_locations)) >= coverage_requirement * num_locations

    # Constraint: Link the is_covered variable to the placement variables
    for i in range(num_locations):
        prob += pulp.lpSum(covers[i, l, j] * x[l][j] for l in range(num_locations) for j in range(num_configs)) >= y[i]

    # Constraint: Ensure at most one sensor is placed at any given location
    for l in range(num_locations):
        prob += pulp.lpSum(x[l][j] for j in range(num_configs)) <= 1, f"One_Sensor_Per_Location_{l}"

    # Solve the problem
    prob.solve()

    # --- Step 5: Process results and calculate area coverage ---

    print(f"Status: {pulp.LpStatus[prob.status]}")
    placed_sensors_polygons = []
    placed_sensors_info = []
    for l in range(num_locations):
        for j in range(num_configs):
            if pulp.value(x[l][j]) == 1:
                loc = locations[l]
                fan = create_fan_polygon(loc.x, loc.y, configurations[j]['range_km'], configurations[j]['azimuth_degree'], configurations[j]['fan_degree'])
                placed_sensors_polygons.append(fan)
                placed_sensors_info.append({'location': loc, 'config': configurations[j]})

    print(f"Number of sensors placed: {len(placed_sensors_info)}")

    estimated_coverage_perc = sum([pulp.value(y[i]) for i in range(num_locations)]) / num_locations
    print(f"Estimated coverage percentage: {estimated_coverage_perc*100:.2f}%")

    total_coverage_geom = unary_union(placed_sensors_polygons)
    final_covered_area = AOO.intersection(total_coverage_geom)

    area_coverage_percentage = (final_covered_area.area / AOO.area)
    print(f"Actual Area Coverage: {area_coverage_percentage*100:.2f}%")
    return placed_sensors_info, f'{len(placed_sensors_info)}', f'{estimated_coverage_perc*100:.2f}', f'{area_coverage_percentage*100:.2f}'

@router.post("/optimise-polygon-coverage")
async def optimise_polygon_coverage(request: Request):
    # debug
    print(f"Request: {request}")
    
    # Get request data
    data = await request.json()
    print("Received GeoJSON:", data)
    
    # Coerce request JSON to match python library
    OpAreaPolygons = geojson_to_multipolygon(data)
    
    # Calculate optimisation
    # 
    placed_sensors, numSensors, estCoverage, accCoverage = calculateOptimise(OpAreaPolygons)
    geoJsonDemo = export_to_geojson(filename=None, op_area=None,placed_sensors=placed_sensors)
    print("Optimised Sensor GeoJSON:", data)
    
    # You can add some dummy response here
    # return JSONResponse({"status": "success", "received": data["geometry"]["type"]})
    
    return JSONResponse({"status": "success", "geojson": geoJsonDemo, "numSensors": f'{numSensors}', "estCoverage": f'{estCoverage}', "accCoverage": f'{accCoverage}'})
    # return geoJsonDemo

"""
example data for fast responses for testing
"""
EXAMPLE_OPERATIONAL_AREA = MultiPolygon(
    [
        [[
            (-15.63607,63.44591),
            (-14.87971,64.01143),
            (-13.44727,64.15853),
            (-9.47021,63.56812),
            (-7.85655,62.73101),
            (-8.02002,61.89758),
            (-9.42634,61.81594),
            (-13.02268,62.61201),
        ],[]],
        [[
            (-5.9332,61.79661),
            (-5.34871,62.16978),
            (-3.5376,61.98027),
            (-1.604,61.27023),
            (-1.4502,60.91975),
            (-2.41515,60.37148),
            (-3.83423,60.58531),
            (-5.625,61.12202),
            (-6.1084,61.53317),
        ],[]],
        [[
            (-26.06663,68.64959),
            (-24.60937,68.08971),
            (-22.58789,66.65298),
            (-24.52148,66.00015),
            (-26.5078,66.31433),
            (-28.82553,67.85732),
        ],[]],
    ]
)
EXAMPLE_PLACED_SENSORS, numSensors, estCoverage, accCoverage = calculateOptimise(EXAMPLE_OPERATIONAL_AREA)
EXAMPLE_OPTIMISED_PLACEMENT_GEOJSON = export_to_geojson(filename=None, op_area=None,placed_sensors=EXAMPLE_PLACED_SENSORS)

# Serves an example result from the optimisation algorithm (used for fast testing only)
@router.get("/opt-placement-example")
def run_fill_operation():
    # return EXAMPLE_OPTIMISED_PLACEMENT_GEOJSON
    return JSONResponse({"status": "success", "geojson": EXAMPLE_OPTIMISED_PLACEMENT_GEOJSON, "numSensors": f'{numSensors}', "estCoverage": f'{estCoverage}', "accCoverage": f'{accCoverage}'})