from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class Asset(BaseModel):
    id: str
    name: str
    type: str
    location: Dict[str, float]  # { "lat": ..., "lon": ... }
    geometry: Optional[Dict[str, Any]] = None  # GeoJSON-style shape
    metadata: Optional[Dict[str, Any]] = None
