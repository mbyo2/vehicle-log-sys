
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  FleetUtilizationMetric, 
  CostAnalysisData, 
  DriverPerformanceMetric, 
  MaintenanceAnalysis,
  AnalyticsDashboardData
} from '@/types/analytics';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export function useAnalytics() {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(subMonths(new Date(), 3)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  // Analytics Dashboard Data
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ['analytics-dashboard', dateRange],
    queryFn: async () => {
      // Get fleet utilization overview
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, plate_number');
      
      const { data: trips } = await supabase
        .from('vehicle_logs')
        .select('vehicle_id, start_time')
        .gte('start_time', `${dateRange.startDate}T00:00:00`)
        .lte('start_time', `${dateRange.endDate}T23:59:59`);
      
      // Get cost data
      const { data: maintenanceServices } = await supabase
        .from('vehicle_services')
        .select('vehicle_id, cost')
        .gte('service_date', dateRange.startDate)
        .lte('service_date', dateRange.endDate);
      
      const { data: fuelLogs } = await supabase
        .from('fuel_logs')
        .select('vehicle_id, total_cost')
        .gte('created_at', `${dateRange.startDate}T00:00:00`)
        .lte('created_at', `${dateRange.endDate}T23:59:59`);
      
      // Calculate metrics for dashboard
      const totalVehicles = vehicles?.length || 0;
      const activeVehicles = new Set(trips?.map(trip => trip.vehicle_id)).size;
      
      const fuelCosts = fuelLogs?.reduce((sum, log) => sum + (log.total_cost || 0), 0) || 0;
      const maintenanceCosts = maintenanceServices?.reduce((sum, service) => sum + (service.cost || 0), 0) || 0;
      
      // Monthly cost trend (simplified)
      const monthlyCostTrend = [
        { month: 'Jan', value: Math.round(Math.random() * 5000) },
        { month: 'Feb', value: Math.round(Math.random() * 5000) }, 
        { month: 'Mar', value: Math.round(Math.random() * 5000) },
        { month: 'Apr', value: Math.round(Math.random() * 5000) },
        { month: 'May', value: Math.round(Math.random() * 5000) },
        { month: 'Jun', value: Math.round(Math.random() * 5000) }
      ];
      
      // Utilization trend (simplified)
      const utilizationTrend = [
        { date: '2023-01', value: Math.round(Math.random() * 100) },
        { date: '2023-02', value: Math.round(Math.random() * 100) },
        { date: '2023-03', value: Math.round(Math.random() * 100) },
        { date: '2023-04', value: Math.round(Math.random() * 100) },
        { date: '2023-05', value: Math.round(Math.random() * 100) },
        { date: '2023-06', value: Math.round(Math.random() * 100) }
      ];
      
      // For demo purposes, creating sample data
      const dashboardData: AnalyticsDashboardData = {
        fleetUtilization: {
          totalVehicles,
          activeVehicles,
          averageUtilization: totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0,
          utilizationTrend
        },
        costBreakdown: {
          totalCosts: fuelCosts + maintenanceCosts,
          fuelCosts,
          maintenanceCosts,
          otherCosts: 0,
          monthlyCostTrend
        },
        driverStats: {
          totalDrivers: 12, // Example value
          activeDrivers: 8, // Example value
          topPerformers: [
            { driverId: '1', driverName: 'Alex Johnson', score: 95 },
            { driverId: '2', driverName: 'Maria Garcia', score: 92 },
            { driverId: '3', driverName: 'John Smith', score: 88 }
          ]
        },
        maintenanceOverview: {
          upcomingMaintenanceCount: 5,
          estimatedMonthlyCosts: Math.round(maintenanceCosts / 3), // Dividing by number of months
          overdueMaintenanceCount: 2
        }
      };
      
      return dashboardData;
    }
  });

  // Fleet Utilization Metrics
  const { data: fleetUtilization, isLoading: isFleetUtilizationLoading } = useQuery({
    queryKey: ['fleet-utilization', dateRange],
    queryFn: async () => {
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, plate_number, make, model');
      
      if (vehiclesError) throw vehiclesError;
      
      const { data: trips, error: tripsError } = await supabase
        .from('vehicle_logs')
        .select('id, vehicle_id, start_time, start_kilometers, end_kilometers')
        .gte('start_time', `${dateRange.startDate}T00:00:00`)
        .lte('start_time', `${dateRange.endDate}T23:59:59`);
      
      if (tripsError) throw tripsError;
      
      // Calculate utilization metrics
      const utilizationMetrics: FleetUtilizationMetric[] = vehicles?.map(vehicle => {
        const vehicleTrips = trips?.filter(trip => trip.vehicle_id === vehicle.id) || [];
        const totalTrips = vehicleTrips.length;
        
        const totalDistance = vehicleTrips.reduce((sum, trip) => {
          if (trip.end_kilometers && trip.start_kilometers) {
            return sum + (trip.end_kilometers - trip.start_kilometers);
          }
          return sum;
        }, 0);
        
        // Calculate days between start and end dates
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Get unique days the vehicle was used
        const usedDays = new Set(vehicleTrips.map(trip => 
          new Date(trip.start_time).toISOString().split('T')[0]
        )).size;
        
        const idleDays = totalDays - usedDays;
        const utilizationPercentage = totalDays > 0 ? (usedDays / totalDays) * 100 : 0;
        
        // Get the last used date
        const lastTrip = vehicleTrips.sort((a, b) => 
          new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        )[0];
        
        return {
          vehicleId: vehicle.id,
          plateNumber: vehicle.plate_number,
          make: vehicle.make,
          model: vehicle.model,
          totalTrips,
          totalDistance,
          utilizationPercentage,
          idleDays,
          lastUsedDate: lastTrip ? lastTrip.start_time : 'Never'
        };
      }) || [];
      
      return utilizationMetrics;
    }
  });

  // Cost Analysis
  const { data: costAnalysis, isLoading: isCostAnalysisLoading } = useQuery({
    queryKey: ['cost-analysis', dateRange],
    queryFn: async () => {
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, plate_number');
      
      if (vehiclesError) throw vehiclesError;
      
      const { data: maintenanceServices, error: servicesError } = await supabase
        .from('vehicle_services')
        .select('vehicle_id, cost')
        .gte('service_date', dateRange.startDate)
        .lte('service_date', dateRange.endDate);
      
      if (servicesError) throw servicesError;
      
      const { data: fuelLogs, error: fuelError } = await supabase
        .from('fuel_logs')
        .select('vehicle_id, total_cost, liters_added, odometer_reading')
        .gte('created_at', `${dateRange.startDate}T00:00:00`)
        .lte('created_at', `${dateRange.endDate}T23:59:59`);
      
      if (fuelError) throw fuelError;
      
      // Calculate cost metrics
      const costData: CostAnalysisData[] = vehicles?.map(vehicle => {
        const vehicleMaintenanceCosts = maintenanceServices
          ?.filter(service => service.vehicle_id === vehicle.id)
          .reduce((sum, service) => sum + (service.cost || 0), 0) || 0;
        
        const vehicleFuelLogs = fuelLogs?.filter(log => log.vehicle_id === vehicle.id) || [];
        const vehicleFuelCosts = vehicleFuelLogs.reduce((sum, log) => sum + (log.total_cost || 0), 0);
        
        // Calculate total distance for cost per km
        let totalDistance = 0;
        if (vehicleFuelLogs.length > 1) {
          // Simple approximation based on fuel logs
          const firstReading = vehicleFuelLogs[0].odometer_reading;
          const lastReading = vehicleFuelLogs[vehicleFuelLogs.length - 1].odometer_reading;
          if (firstReading && lastReading) {
            totalDistance = Math.max(0, lastReading - firstReading);
          }
        }
        
        const totalCosts = vehicleFuelCosts + vehicleMaintenanceCosts;
        
        // Calculate months in range
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth()) + 1;
        
        return {
          vehicleId: vehicle.id,
          plateNumber: vehicle.plate_number,
          fuelCosts: vehicleFuelCosts,
          maintenanceCosts: vehicleMaintenanceCosts,
          totalCosts,
          costPerKilometer: totalDistance > 0 ? totalCosts / totalDistance : 0,
          monthlyAverageCost: monthDiff > 0 ? totalCosts / monthDiff : totalCosts
        };
      }) || [];
      
      return costData;
    }
  });

  // Driver Performance Metrics
  const { data: driverPerformance, isLoading: isDriverPerformanceLoading } = useQuery({
    queryKey: ['driver-performance', dateRange],
    queryFn: async () => {
      const { data: drivers, error: driversError } = await supabase
        .from('drivers')
        .select(`
          id,
          profile_id,
          profiles:profile_id(full_name)
        `);
      
      if (driversError) throw driversError;
      
      const { data: trips, error: tripsError } = await supabase
        .from('vehicle_logs')
        .select(`
          id, 
          driver_id, 
          start_kilometers, 
          end_kilometers,
          start_time,
          end_time,
          approval_status
        `)
        .gte('start_time', `${dateRange.startDate}T00:00:00`)
        .lte('start_time', `${dateRange.endDate}T23:59:59`);
      
      if (tripsError) throw tripsError;
      
      // Calculate driver metrics
      const performanceMetrics: DriverPerformanceMetric[] = drivers?.map(driver => {
        const driverTrips = trips?.filter(trip => trip.driver_id === driver.id) || [];
        const tripsCompleted = driverTrips.length;
        
        // Calculate total distance
        const totalDistance = driverTrips.reduce((sum, trip) => {
          if (trip.end_kilometers && trip.start_kilometers) {
            return sum + (trip.end_kilometers - trip.start_kilometers);
          }
          return sum;
        }, 0);
        
        // Calculate average distance per trip
        const averageTripDistance = tripsCompleted > 0 ? totalDistance / tripsCompleted : 0;
        
        // Calculate compliance (% of approved trips)
        const approvedTrips = driverTrips.filter(trip => trip.approval_status === 'approved').length;
        const complianceScore = tripsCompleted > 0 ? (approvedTrips / tripsCompleted) * 100 : 100;
        
        // For demo purposes, using random values for some metrics
        const fuelEfficiencyRating = 70 + Math.random() * 30; // Random value between 70-100
        const safetyScore = 80 + Math.random() * 20; // Random value between 80-100
        
        // Fix: Access profile data safely by handling the type correctly
        const profileData = driver.profiles as { full_name: string } | null;
        const driverName = profileData?.full_name || 'Unknown Driver';
        
        return {
          driverId: driver.id,
          driverName,
          tripsCompleted,
          totalDistance,
          averageTripDistance,
          fuelEfficiencyRating,
          safetyScore,
          complianceScore
        };
      }) || [];
      
      return performanceMetrics;
    }
  });

  // Maintenance Cost Forecasting
  const { data: maintenanceForecasts, isLoading: isMaintenanceForecastLoading } = useQuery({
    queryKey: ['maintenance-forecasts', dateRange],
    queryFn: async () => {
      const { data: vehicles, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('id, plate_number, make, model, current_kilometers, service_interval');
      
      if (vehiclesError) throw vehiclesError;
      
      const { data: maintenanceHistory, error: maintenanceError } = await supabase
        .from('vehicle_services')
        .select('vehicle_id, service_type, cost, service_date')
        .order('service_date', { ascending: false });
      
      if (maintenanceError) throw maintenanceError;
      
      const { data: maintenanceSchedules, error: schedulesError } = await supabase
        .from('maintenance_schedules')
        .select('vehicle_id, scheduled_date, service_type, estimated_cost, status')
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true });
      
      if (schedulesError) throw schedulesError;
      
      // Calculate maintenance forecasts
      const forecasts: MaintenanceAnalysis[] = vehicles?.map(vehicle => {
        // Get historical costs
        const vehicleHistory = maintenanceHistory?.filter(maint => maint.vehicle_id === vehicle.id) || [];
        const pastCosts = vehicleHistory.reduce((sum, service) => sum + (service.cost || 0), 0);
        
        // Get upcoming scheduled maintenance
        const upcomingMaintenance = maintenanceSchedules?.filter(
          schedule => schedule.vehicle_id === vehicle.id && schedule.status !== 'completed'
        ) || [];
        
        // Calculate projected costs based on upcoming maintenance
        const projectedCosts = upcomingMaintenance.reduce(
          (sum, schedule) => sum + (schedule.estimated_cost || 0), 0
        );
        
        // Get the next maintenance date
        const nextMaintenanceItem = upcomingMaintenance[0];
        const nextMaintenanceDate = nextMaintenanceItem ? nextMaintenanceItem.scheduled_date : 'Not scheduled';
        
        // Create maintenance items list
        const maintenanceItems = upcomingMaintenance.map(item => ({
          item: item.service_type,
          estimatedCost: item.estimated_cost || 0,
          priority: determinePriority(item.scheduled_date) as 'low' | 'medium' | 'high'
        }));
        
        return {
          vehicleId: vehicle.id,
          plateNumber: vehicle.plate_number,
          make: vehicle.make,
          model: vehicle.model,
          pastCosts,
          projectedCosts,
          nextMaintenanceDate,
          maintenanceItems
        };
      }) || [];
      
      return forecasts;
    }
  });

  // Utility function for maintenance priority
  function determinePriority(dateString: string): string {
    const today = new Date();
    const scheduledDate = new Date(dateString);
    const diffTime = scheduledDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'high'; // Overdue
    if (diffDays < 14) return 'high';
    if (diffDays < 30) return 'medium';
    return 'low';
  }

  return {
    dateRange,
    setDateRange,
    dashboardData,
    fleetUtilization,
    costAnalysis,
    driverPerformance,
    maintenanceForecasts,
    isDashboardLoading,
    isFleetUtilizationLoading,
    isCostAnalysisLoading,
    isDriverPerformanceLoading,
    isMaintenanceForecastLoading
  };
}
