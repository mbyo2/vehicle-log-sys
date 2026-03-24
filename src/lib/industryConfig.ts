import { IndustryType } from '@/types/auth';

/**
 * Industry-specific configuration for tailoring the app
 * per company industry type.
 */

// Vehicle categories per industry
export const VEHICLE_CATEGORIES: Record<IndustryType, { value: string; label: string }[]> = {
  mining: [
    { value: 'haul_truck', label: 'Haul Truck' },
    { value: 'excavator', label: 'Excavator' },
    { value: 'drill_rig', label: 'Drill Rig' },
    { value: 'loader', label: 'Loader' },
    { value: 'bulldozer', label: 'Bulldozer' },
    { value: 'water_bowser', label: 'Water Bowser' },
    { value: 'light_vehicle', label: 'Light Vehicle' },
    { value: 'personnel_carrier', label: 'Personnel Carrier' },
    { value: 'service_vehicle', label: 'Service Vehicle' },
    { value: 'other', label: 'Other' },
  ],
  transport: [
    { value: 'truck', label: 'Truck' },
    { value: 'trailer', label: 'Trailer' },
    { value: 'tanker', label: 'Tanker' },
    { value: 'flatbed', label: 'Flatbed' },
    { value: 'refrigerated', label: 'Refrigerated Truck' },
    { value: 'bus', label: 'Bus' },
    { value: 'van', label: 'Van' },
    { value: 'sedan', label: 'Sedan' },
    { value: 'other', label: 'Other' },
  ],
  logistics: [
    { value: 'delivery_van', label: 'Delivery Van' },
    { value: 'box_truck', label: 'Box Truck' },
    { value: 'cargo_truck', label: 'Cargo Truck' },
    { value: 'forklift', label: 'Forklift' },
    { value: 'trailer', label: 'Trailer' },
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'sedan', label: 'Sedan' },
    { value: 'other', label: 'Other' },
  ],
  construction: [
    { value: 'excavator', label: 'Excavator' },
    { value: 'crane', label: 'Crane' },
    { value: 'bulldozer', label: 'Bulldozer' },
    { value: 'concrete_mixer', label: 'Concrete Mixer' },
    { value: 'dump_truck', label: 'Dump Truck' },
    { value: 'backhoe', label: 'Backhoe' },
    { value: 'light_vehicle', label: 'Light Vehicle' },
    { value: 'service_vehicle', label: 'Service Vehicle' },
    { value: 'other', label: 'Other' },
  ],
  agriculture: [
    { value: 'tractor', label: 'Tractor' },
    { value: 'harvester', label: 'Harvester' },
    { value: 'sprayer', label: 'Sprayer' },
    { value: 'pickup', label: 'Pickup Truck' },
    { value: 'trailer', label: 'Trailer' },
    { value: 'irrigation_truck', label: 'Irrigation Truck' },
    { value: 'utility_vehicle', label: 'Utility Vehicle' },
    { value: 'other', label: 'Other' },
  ],
  general: [
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'pickup', label: 'Pickup Truck' },
    { value: 'van', label: 'Van' },
    { value: 'truck', label: 'Truck' },
    { value: 'bus', label: 'Bus' },
    { value: 'motorcycle', label: 'Motorcycle' },
    { value: 'other', label: 'Other' },
  ],
  other: [
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'truck', label: 'Truck' },
    { value: 'van', label: 'Van' },
    { value: 'specialized', label: 'Specialized' },
    { value: 'other', label: 'Other' },
  ],
};

// Extra vehicle fields per industry
export interface IndustryVehicleField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select';
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export const INDUSTRY_VEHICLE_FIELDS: Record<IndustryType, IndustryVehicleField[]> = {
  mining: [
    { name: 'operating_zone', label: 'Operating Zone', type: 'select', options: [
      { value: 'underground', label: 'Underground' },
      { value: 'open_pit', label: 'Open Pit' },
      { value: 'surface', label: 'Surface' },
      { value: 'processing', label: 'Processing Plant' },
    ]},
    { name: 'engine_hours', label: 'Engine Hours', type: 'number', placeholder: 'Total engine hours' },
    { name: 'blast_zone_certified', label: 'Blast Zone Certification Expiry', type: 'date' },
  ],
  construction: [
    { name: 'site_name', label: 'Current Site', type: 'text', placeholder: 'Construction site name' },
    { name: 'engine_hours', label: 'Engine Hours', type: 'number', placeholder: 'Total engine hours' },
    { name: 'load_capacity', label: 'Load Capacity (tons)', type: 'number', placeholder: 'Max load capacity' },
  ],
  agriculture: [
    { name: 'farm_zone', label: 'Farm / Zone', type: 'text', placeholder: 'Farm or zone name' },
    { name: 'engine_hours', label: 'Engine Hours', type: 'number', placeholder: 'Total engine hours' },
    { name: 'implement_type', label: 'Attached Implement', type: 'text', placeholder: 'e.g. Plough, Disc' },
  ],
  transport: [
    { name: 'load_capacity', label: 'Load Capacity (tons)', type: 'number', placeholder: 'Max load capacity' },
    { name: 'route', label: 'Primary Route', type: 'text', placeholder: 'e.g. Harare - Bulawayo' },
  ],
  logistics: [
    { name: 'load_capacity', label: 'Load Capacity (kg)', type: 'number', placeholder: 'Max load capacity' },
    { name: 'delivery_zone', label: 'Delivery Zone', type: 'text', placeholder: 'Primary delivery area' },
  ],
  general: [],
  other: [],
};

// Navigation items to show/hide per industry (using href as key)
// Items listed here are ADDITIONAL industry-specific items shown in nav
export const INDUSTRY_NAV_ITEMS: Record<IndustryType, { title: string; href: string; icon: string }[]> = {
  mining: [
    { title: 'Shift Reports', href: '/reports', icon: 'ClipboardCheck' },
    { title: 'Safety Compliance', href: '/documents', icon: 'Shield' },
  ],
  transport: [
    { title: 'Route Planning', href: '/trip-management', icon: 'MapPin' },
  ],
  logistics: [
    { title: 'Delivery Tracking', href: '/trip-management', icon: 'MapPin' },
  ],
  construction: [
    { title: 'Site Equipment', href: '/fleet', icon: 'Wrench' },
  ],
  agriculture: [
    { title: 'Seasonal Planning', href: '/maintenance', icon: 'Calendar' },
  ],
  general: [],
  other: [],
};

// Nav items to HIDE per industry (by href)
export const INDUSTRY_HIDDEN_NAV: Record<IndustryType, string[]> = {
  mining: [], // Mining companies see everything
  transport: [],
  logistics: [],
  construction: ['/fuel'], // Construction might not track fuel same way
  agriculture: [],
  general: [],
  other: [],
};

// Dashboard widget config per industry
export interface DashboardWidget {
  title: string;
  description: string;
  icon: string;
  metric: string;
  color: string;
}

export const INDUSTRY_DASHBOARD_WIDGETS: Record<IndustryType, DashboardWidget[]> = {
  mining: [
    { title: 'Active Haul Trucks', description: 'Trucks currently operating', icon: 'Truck', metric: 'active_haul_trucks', color: 'text-amber-500' },
    { title: 'Engine Hours Today', description: 'Total engine hours logged', icon: 'Clock', metric: 'engine_hours', color: 'text-blue-500' },
    { title: 'Underground Vehicles', description: 'Vehicles in underground zones', icon: 'ArrowDown', metric: 'underground_vehicles', color: 'text-red-500' },
    { title: 'Safety Incidents', description: 'This month', icon: 'AlertTriangle', metric: 'safety_incidents', color: 'text-destructive' },
  ],
  transport: [
    { title: 'Vehicles on Route', description: 'Currently in transit', icon: 'MapPin', metric: 'vehicles_on_route', color: 'text-green-500' },
    { title: 'Deliveries Today', description: 'Completed deliveries', icon: 'Package', metric: 'deliveries_today', color: 'text-blue-500' },
    { title: 'Avg Trip Distance', description: 'Average km per trip', icon: 'TrendingUp', metric: 'avg_trip_distance', color: 'text-amber-500' },
    { title: 'Fuel Efficiency', description: 'Fleet average km/l', icon: 'Fuel', metric: 'fuel_efficiency', color: 'text-purple-500' },
  ],
  logistics: [
    { title: 'Pending Deliveries', description: 'Awaiting dispatch', icon: 'Package', metric: 'pending_deliveries', color: 'text-amber-500' },
    { title: 'On-Time Rate', description: 'Delivery punctuality', icon: 'Clock', metric: 'on_time_rate', color: 'text-green-500' },
    { title: 'Active Routes', description: 'Routes in progress', icon: 'MapPin', metric: 'active_routes', color: 'text-blue-500' },
    { title: 'Fleet Utilization', description: 'Vehicles in use', icon: 'BarChart', metric: 'fleet_utilization', color: 'text-purple-500' },
  ],
  construction: [
    { title: 'Equipment on Site', description: 'Active at sites', icon: 'Wrench', metric: 'equipment_on_site', color: 'text-amber-500' },
    { title: 'Engine Hours Today', description: 'Total hours logged', icon: 'Clock', metric: 'engine_hours', color: 'text-blue-500' },
    { title: 'Maintenance Due', description: 'Equipment needing service', icon: 'AlertTriangle', metric: 'maintenance_due', color: 'text-red-500' },
    { title: 'Active Sites', description: 'Sites with equipment', icon: 'Building', metric: 'active_sites', color: 'text-green-500' },
  ],
  agriculture: [
    { title: 'Active Machinery', description: 'In the field now', icon: 'Tractor', metric: 'active_machinery', color: 'text-green-500' },
    { title: 'Engine Hours Today', description: 'Total hours logged', icon: 'Clock', metric: 'engine_hours', color: 'text-blue-500' },
    { title: 'Fuel Used Today', description: 'Liters consumed', icon: 'Fuel', metric: 'fuel_used', color: 'text-amber-500' },
    { title: 'Service Overdue', description: 'Machines past service', icon: 'AlertTriangle', metric: 'service_overdue', color: 'text-red-500' },
  ],
  general: [
    { title: 'Total Vehicles', description: 'In your fleet', icon: 'Car', metric: 'total_vehicles', color: 'text-blue-500' },
    { title: 'Active Trips', description: 'Currently in progress', icon: 'MapPin', metric: 'active_trips', color: 'text-green-500' },
    { title: 'Maintenance Due', description: 'Vehicles needing service', icon: 'Wrench', metric: 'maintenance_due', color: 'text-amber-500' },
    { title: 'Documents Expiring', description: 'Within 30 days', icon: 'FileText', metric: 'docs_expiring', color: 'text-red-500' },
  ],
  other: [
    { title: 'Total Vehicles', description: 'In your fleet', icon: 'Car', metric: 'total_vehicles', color: 'text-blue-500' },
    { title: 'Active Trips', description: 'Currently in progress', icon: 'MapPin', metric: 'active_trips', color: 'text-green-500' },
    { title: 'Maintenance Due', description: 'Vehicles needing service', icon: 'Wrench', metric: 'maintenance_due', color: 'text-amber-500' },
    { title: 'Documents Expiring', description: 'Within 30 days', icon: 'FileText', metric: 'docs_expiring', color: 'text-red-500' },
  ],
};

// Report tabs per industry
export interface IndustryReportTab {
  value: string;
  label: string;
  icon: string;
}

export const INDUSTRY_REPORT_TABS: Record<IndustryType, IndustryReportTab[]> = {
  mining: [
    { value: 'company', label: 'Company Metrics', icon: 'PieChart' },
    { value: 'fleet', label: 'Equipment Utilization', icon: 'Activity' },
    { value: 'costs', label: 'Cost Analysis', icon: 'DollarSign' },
    { value: 'maintenance', label: 'Maintenance Costs', icon: 'BarChart' },
    { value: 'fuel', label: 'Fuel Analytics', icon: 'LineChart' },
  ],
  transport: [
    { value: 'company', label: 'Company Metrics', icon: 'PieChart' },
    { value: 'fleet', label: 'Fleet Utilization', icon: 'Activity' },
    { value: 'costs', label: 'Route Cost Analysis', icon: 'DollarSign' },
    { value: 'maintenance', label: 'Maintenance Costs', icon: 'BarChart' },
    { value: 'fuel', label: 'Fuel Efficiency', icon: 'LineChart' },
  ],
  logistics: [
    { value: 'company', label: 'Company Metrics', icon: 'PieChart' },
    { value: 'fleet', label: 'Fleet Utilization', icon: 'Activity' },
    { value: 'costs', label: 'Delivery Costs', icon: 'DollarSign' },
    { value: 'maintenance', label: 'Maintenance Costs', icon: 'BarChart' },
    { value: 'fuel', label: 'Fuel Analytics', icon: 'LineChart' },
  ],
  construction: [
    { value: 'company', label: 'Company Metrics', icon: 'PieChart' },
    { value: 'fleet', label: 'Equipment Utilization', icon: 'Activity' },
    { value: 'costs', label: 'Site Cost Analysis', icon: 'DollarSign' },
    { value: 'maintenance', label: 'Maintenance Costs', icon: 'BarChart' },
    { value: 'fuel', label: 'Fuel Analytics', icon: 'LineChart' },
  ],
  agriculture: [
    { value: 'company', label: 'Farm Metrics', icon: 'PieChart' },
    { value: 'fleet', label: 'Machinery Utilization', icon: 'Activity' },
    { value: 'costs', label: 'Cost Analysis', icon: 'DollarSign' },
    { value: 'maintenance', label: 'Maintenance Costs', icon: 'BarChart' },
    { value: 'fuel', label: 'Fuel Consumption', icon: 'LineChart' },
  ],
  general: [
    { value: 'company', label: 'Company Metrics', icon: 'PieChart' },
    { value: 'fleet', label: 'Fleet Utilization', icon: 'Activity' },
    { value: 'costs', label: 'Cost Analysis', icon: 'DollarSign' },
    { value: 'maintenance', label: 'Maintenance Costs', icon: 'BarChart' },
    { value: 'fuel', label: 'Fuel Analytics', icon: 'LineChart' },
  ],
  other: [
    { value: 'company', label: 'Company Metrics', icon: 'PieChart' },
    { value: 'fleet', label: 'Fleet Utilization', icon: 'Activity' },
    { value: 'costs', label: 'Cost Analysis', icon: 'DollarSign' },
    { value: 'maintenance', label: 'Maintenance Costs', icon: 'BarChart' },
    { value: 'fuel', label: 'Fuel Analytics', icon: 'LineChart' },
  ],
};

// Industry display names and descriptions
export const INDUSTRY_INFO: Record<IndustryType, { name: string; description: string; termForVehicle: string }> = {
  mining: { name: 'Mining', description: 'Mining operations fleet management', termForVehicle: 'Equipment' },
  transport: { name: 'Transport', description: 'Transport & haulage fleet management', termForVehicle: 'Vehicle' },
  logistics: { name: 'Logistics', description: 'Logistics & delivery fleet management', termForVehicle: 'Vehicle' },
  construction: { name: 'Construction', description: 'Construction equipment management', termForVehicle: 'Equipment' },
  agriculture: { name: 'Agriculture', description: 'Farm machinery management', termForVehicle: 'Machinery' },
  general: { name: 'General', description: 'General fleet management', termForVehicle: 'Vehicle' },
  other: { name: 'Other', description: 'Fleet management', termForVehicle: 'Vehicle' },
};

/**
 * Get the vehicle categories for an industry
 */
export function getVehicleCategories(industry: IndustryType): { value: string; label: string }[] {
  return VEHICLE_CATEGORIES[industry] || VEHICLE_CATEGORIES.general;
}

/**
 * Get the additional vehicle fields for an industry
 */
export function getIndustryVehicleFields(industry: IndustryType): IndustryVehicleField[] {
  return INDUSTRY_VEHICLE_FIELDS[industry] || [];
}

/**
 * Get the dashboard widgets for an industry
 */
export function getDashboardWidgets(industry: IndustryType): DashboardWidget[] {
  return INDUSTRY_DASHBOARD_WIDGETS[industry] || INDUSTRY_DASHBOARD_WIDGETS.general;
}

/**
 * Get the report tabs for an industry
 */
export function getReportTabs(industry: IndustryType): IndustryReportTab[] {
  return INDUSTRY_REPORT_TABS[industry] || INDUSTRY_REPORT_TABS.general;
}

/**
 * Get industry info
 */
export function getIndustryInfo(industry: IndustryType) {
  return INDUSTRY_INFO[industry] || INDUSTRY_INFO.general;
}
