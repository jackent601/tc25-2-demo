from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import envdata_router, geojson_router
from shape_optimisations import georouter

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(envdata_router.router)
app.include_router(geojson_router.router)
app.include_router(georouter.router)
