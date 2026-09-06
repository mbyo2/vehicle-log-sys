
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
  /** Real km per litre from recorded fuel logs; null when the driver has no fuel data yet */
  fuelEfficiencyKmPerLitre: number | null;
  /** Share of the driver's trips that were closed out with an end reading and end time */
  tripCompletionRate: number;
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
