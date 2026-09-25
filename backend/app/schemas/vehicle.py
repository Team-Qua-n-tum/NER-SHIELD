from pydantic import BaseModel, Field
from typing import List, Optional

class VehicleCreate(BaseModel):
    registration_number: str = Field(..., description="Vehicle registration e.g. AS-01-GB-4592")
    vehicle_type: str = Field(..., description="TRUCK, TANKER, MINI_TRUCK, CARGO_VAN")
    commodity: str = Field(..., description="MEDICINES, FOOD_SUPPLIES, FUEL, AGRICULTURAL_PRODUCE, CONSTRUCTION_MATERIALS")
    driver_name: str = Field(..., description="Driver full name")
    driver_phone: str = Field(..., description="Contact number")
    origin_district: str = Field(..., description="Origin location")
    destination_district: str = Field(..., description="Destination location")
    lat: float = Field(..., description="Current latitude")
    lng: float = Field(..., description="Current longitude")

class VehicleResponse(VehicleCreate):
    id: str = Field(..., description="Vehicle tracking ID")
    delivery_status: str = Field("IN_TRANSIT", description="IN_TRANSIT, DELIVERED, DELAYED, REROUTED, STUCK")
    speed_kmh: float = Field(0.0, description="Current speed in km/h")
    eta_hours: float = Field(..., description="Estimated time of arrival in hours")
    assigned_route_id: Optional[str] = Field(None, description="Current route plan ID")
    last_ping: str = Field(..., description="Timestamp of last GPS ping")

class VehicleLocationUpdate(BaseModel):
    lat: float = Field(..., description="New latitude")
    lng: float = Field(..., description="New longitude")
    speed_kmh: Optional[float] = Field(0.0, description="Current speed")
    delivery_status: Optional[str] = Field(None, description="Updated delivery status")

class VehicleListResponse(BaseModel):
    total: int
    vehicles: List[VehicleResponse]
