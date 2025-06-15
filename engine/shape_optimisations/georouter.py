from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/test-draw")
async def test_draw_polygon(request: Request):
    print(f"Request: {request}")
    data = await request.json()
    print("Received GeoJSON:", data)
    
    # You can add some dummy response here
    # return JSONResponse({"status": "success", "received": data["geometry"]["type"]})
    
    return JSONResponse({"status": "success", "received": data})