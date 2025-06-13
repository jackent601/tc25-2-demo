from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React/Vite frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
