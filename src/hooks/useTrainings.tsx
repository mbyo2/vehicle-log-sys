
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrainingCourse, DriverTraining } from '@/types/training';
import { useAuth } from '@/contexts/AuthContext';

export function useTrainings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const profileData = profile.get();
  const userId = profileData?.id;
  const companyId = profileData?.company_id;
  const userRole = profileData?.role;
  const isDriver = userRole === 'driver';

  // Fetch training courses
  const { data: trainingCourses, isLoading: isCoursesLoading } = useQuery({
    queryKey: ['training_courses', companyId],
    queryFn: async () => {
      if (!companyId) return [];
      
      const { data, error } = await supabase
        .from('training_courses')
        .select('*')
        .eq('company_id', companyId)
        .order('title');
      
      if (error) throw error;
      return data as TrainingCourse[];
    },
    enabled: !!companyId,
  });

  // Fetch driver's trainings or all trainings for admin/supervisor
  const { data: driverTrainings, isLoading: isTrainingsLoading } = useQuery({
    queryKey: ['driver_trainings', companyId, userId, isDriver],
    queryFn: async () => {
      if (!companyId || !userId) return [];
      
      let query = supabase
        .from('driver_trainings')
        .select(`
          *,
          course:course_id(*)
        `);
        
      // If user is a driver, only fetch their trainings
      if (isDriver) {
        query = query.eq('driver_id', userId);
      } else {
        // For admin/supervisor, fetch all company trainings
        query = query.eq('company_id', companyId);
      }
      
      const { data, error } = await query.order('completion_date', { ascending: false });
      
      if (error) throw error;
      
      return data.map(training => ({
        ...training,
        course: training.course
      })) as DriverTraining[];
    },
    enabled: !!companyId && !!userId,
  });

  // For admin: Add a new training course
  const addTrainingCourse = useMutation({
    mutationFn: async (course: Omit<TrainingCourse, 'id' | 'created_at' | 'updated_at'>) => {
      if (!companyId) {
        throw new Error('Company not selected');
      }

      const { data, error } = await supabase
        .from('training_courses')
        .insert({
          ...course,
          company_id: companyId,
        })
        .select();

      if (error) throw error;
      return data[0] as TrainingCourse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training_courses'] });
      toast({
        title: "Training course added",
        description: "The training course has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to add training course: ${error.message}`,
      });
    },
  });

  // For admin/supervisor: Record a completed training for a driver
  const recordDriverTraining = useMutation({
    mutationFn: async (training: {
      driver_id: string;
      course_id: string;
      completion_date: string;
      expiry_date?: string;
      certificate_file_path?: string;
      certificate_number?: string;
      notes?: string;
    }) => {
      if (!companyId) {
        throw new Error('Company not selected');
      }

      const { data, error } = await supabase
        .from('driver_trainings')
        .insert({
          ...training,
          company_id: companyId,
        })
        .select();

      if (error) throw error;
      return data[0] as DriverTraining;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver_trainings'] });
      toast({
        title: "Training recorded",
        description: "The driver training has been recorded successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to record training: ${error.message}`,
      });
    },
  });

  return {
    trainingCourses,
    driverTrainings,
    isLoading: isCoursesLoading || isTrainingsLoading,
    addTrainingCourse,
    recordDriverTraining,
    expiringSoonCount: driverTrainings?.filter(t => {
      if (!t.expiry_date) return false;
      const expiryDate = new Date(t.expiry_date);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
    }).length || 0,
  };
}
