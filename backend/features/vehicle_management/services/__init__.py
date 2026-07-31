from features.vehicle_management.services.provider_service import (
    seed_default_providers_and_routes,
    get_providers,
    get_provider,
    create_provider,
    update_provider,
    delete_provider,
)
from features.vehicle_management.services.vendor_route_service import (
    get_vendor_routes,
    get_vendor_route,
    create_vendor_route,
    update_vendor_route,
    delete_vendor_route,
    calculate_dispatch_cost,
)
from features.vehicle_management.services.vehicle_service import (
    seed_default_vehicles,
    seed_duc_anh_vehicles_and_contracts,
    get_vehicles,
    get_vehicle,
    create_vehicle,
    update_vehicle,
    delete_vehicle,
)
from features.vehicle_management.services.dispatch_service import (
    get_dispatches,
    get_dispatch,
    create_dispatch,
    update_dispatch,
    delete_dispatch,
)
from features.vehicle_management.services.contract_service import (
    get_monthly_contracts,
    get_monthly_contract,
    update_monthly_contract,
    get_monthly_reconciliation_report,
)
from features.vehicle_management.services.odometer_service import (
    get_daily_odometer_logs,
    create_or_update_daily_odometer_log,
)

__all__ = [
    "seed_default_providers_and_routes",
    "get_providers",
    "get_provider",
    "create_provider",
    "update_provider",
    "delete_provider",
    "get_vendor_routes",
    "get_vendor_route",
    "create_vendor_route",
    "update_vendor_route",
    "delete_vendor_route",
    "calculate_dispatch_cost",
    "seed_default_vehicles",
    "seed_duc_anh_vehicles_and_contracts",
    "get_vehicles",
    "get_vehicle",
    "create_vehicle",
    "update_vehicle",
    "delete_vehicle",
    "get_dispatches",
    "get_dispatch",
    "create_dispatch",
    "update_dispatch",
    "delete_dispatch",
    "get_monthly_contracts",
    "get_monthly_contract",
    "update_monthly_contract",
    "get_monthly_reconciliation_report",
    "get_daily_odometer_logs",
    "create_or_update_daily_odometer_log",
]
