
export interface FleetUtilizationMetric {
  vehicleId: string;
  plateNumber: string;
  make: string;
  model: string;
  totalTrips: number;
  totalDistance: number;
  utilizationPercentage: number;
  idleDays: number;
  lastUsedDate: string;
}

export interface CostAnalysisData {
  vehicleId: string;
  plateNumber: string;
  fuelCosts: number;
  maintenanceCosts: number;
  totalCosts: number;
  costPerKilometer: number;
  monthlyAverageCost: number;
}

export interface DriverPerformanceMetric {
  driverId: string;
  driverName: string;
  tripsCompleted: number;
  totalDistance: number;
  averageTripDistance: number;
  fuelEfficiencyRating: number;
  safetyScore: number;
  complianceScore: number;
}

export interface MaintenanceAnalysis {
  vehicleId: string;
  plateNumber: string;
  make: string;
  model: string;
  pastCosts: number;
  projectedCosts: number;
  nextMaintenanceDate: string;
  maintenanceItems: {
    item: string;
    estimatedCost: number;
    priority: 'low' | 'medium' | 'high';
  }[];
}

export interface AnalyticsDashboardData {
  fleetUtilization: {
    totalVehicles: number;
    activeVehicles: number;
    averageUtilization: number;
    utilizationTrend: { date: string; value: number }[];
  };
  costBreakdown: {
    totalCosts: number;
    fuelCosts: number;
    maintenanceCosts: number;
    otherCosts: number;
    monthlyCostTrend: { month: string; value: number }[];
  };
  driverStats: {
    totalDrivers: number;
    activeDrivers: number;
    topPerformers: { driverId: string; driverName: string; score: number }[];
  };
  maintenanceOverview: {
    upcomingMaintenanceCount: number;
    estimatedMonthlyCosts: number;
    overdueMaintenanceCount: number;
  };
}
