export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      advertisements: {
        Row: {
          company_id: string | null
          content: string
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          content: string
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          content?: string
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          company_id: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          performed_at: string
          performed_by: string
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          company_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_at?: string
          performed_by: string
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          company_id?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_at?: string
          performed_by?: string
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_logs: {
        Row: {
          backup_type: string
          company_id: string | null
          completed_at: string | null
          created_at: string | null
          file_path: string | null
          id: string
          size_bytes: number | null
          started_at: string | null
          status: string
        }
        Insert: {
          backup_type: string
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          file_path?: string | null
          id?: string
          size_bytes?: number | null
          started_at?: string | null
          status?: string
        }
        Update: {
          backup_type?: string
          company_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          file_path?: string | null
          id?: string
          size_bytes?: number | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          branding_primary_color: string | null
          branding_secondary_color: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          subscription_type: Database["public"]["Enums"]["subscription_type"]
          trial_end_date: string | null
          trial_start_date: string | null
          updated_at: string
        }
        Insert: {
          branding_primary_color?: string | null
          branding_secondary_color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
        }
        Update: {
          branding_primary_color?: string | null
          branding_secondary_color?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          subscription_type?: Database["public"]["Enums"]["subscription_type"]
          trial_end_date?: string | null
          trial_start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      compliance_reports: {
        Row: {
          company_id: string | null
          created_at: string | null
          generated_at: string | null
          generated_by: string | null
          id: string
          report_data: Json
          report_type: string
          status: string
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          report_data?: Json
          report_type: string
          status?: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          report_data?: Json
          report_type?: string
          status?: string
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      currency_settings: {
        Row: {
          company_id: string | null
          created_at: string
          currency_code: string
          exchange_rate: number
          id: string
          is_default: boolean | null
          symbol: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          currency_code: string
          exchange_rate?: number
          id?: string
          is_default?: boolean | null
          symbol: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          currency_code?: string
          exchange_rate?: number
          id?: string
          is_default?: boolean | null
          symbol?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "currency_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
          name: string
          storage_path: string
          type: string
          updated_at: string | null
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name: string
          storage_path: string
          type: string
          updated_at?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          storage_path?: string
          type?: string
          updated_at?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          license_expiry: string | null
          license_number: string | null
          man_number: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          man_number: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          man_number?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      erp_integrations: {
        Row: {
          company_id: string | null
          config: Json
          created_at: string | null
          credentials: Json
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          sync_frequency: unknown | null
          system_type: Database["public"]["Enums"]["erp_system_type"]
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          config?: Json
          created_at?: string | null
          credentials?: Json
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          sync_frequency?: unknown | null
          system_type: Database["public"]["Enums"]["erp_system_type"]
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          config?: Json
          created_at?: string | null
          credentials?: Json
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          sync_frequency?: unknown | null
          system_type?: Database["public"]["Enums"]["erp_system_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      external_integrations: {
        Row: {
          company_id: string | null
          config: Json
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          config?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          config?: Json
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "external_integrations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_logs: {
        Row: {
          company_id: string | null
          cost_per_liter: number
          created_at: string
          id: string
          liters_added: number
          odometer_reading: number
          total_cost: number
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          company_id?: string | null
          cost_per_liter: number
          created_at?: string
          id?: string
          liters_added: number
          odometer_reading: number
          total_cost: number
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          company_id?: string | null
          cost_per_liter?: number
          created_at?: string
          id?: string
          liters_added?: number
          odometer_reading?: number
          total_cost?: number
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fuel_prices: {
        Row: {
          company_id: string | null
          created_at: string
          currency_id: string | null
          effective_date: string
          fuel_type: string
          id: string
          price_per_liter: number
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          currency_id?: string | null
          effective_date: string
          fuel_type: string
          id?: string
          price_per_liter: number
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          currency_id?: string | null
          effective_date?: string
          fuel_type?: string
          id?: string
          price_per_liter?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuel_prices_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fuel_prices_currency_id_fkey"
            columns: ["currency_id"]
            isOneToOne: false
            referencedRelation: "currency_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_parts: {
        Row: {
          created_at: string
          id: string
          maintenance_id: string | null
          part_id: string | null
          quantity_used: number
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          maintenance_id?: string | null
          part_id?: string | null
          quantity_used: number
          unit_cost: number
        }
        Update: {
          created_at?: string
          id?: string
          maintenance_id?: string | null
          part_id?: string | null
          quantity_used?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_parts_maintenance_id_fkey"
            columns: ["maintenance_id"]
            isOneToOne: false
            referencedRelation: "vehicle_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_parts_part_id_fkey"
            columns: ["part_id"]
            isOneToOne: false
            referencedRelation: "parts_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          kilometer_interval: number | null
          scheduled_date: string
          service_type: string
          status: string
          time_interval_days: number | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          kilometer_interval?: number | null
          scheduled_date: string
          service_type: string
          status?: string
          time_interval_days?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          kilometer_interval?: number | null
          scheduled_date?: string
          service_type?: string
          status?: string
          time_interval_days?: number | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_schedules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_schedules_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      parts_inventory: {
        Row: {
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          min_quantity: number
          part_name: string
          part_number: string | null
          quantity: number
          supplier: string | null
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          min_quantity?: number
          part_name: string
          part_number?: string | null
          quantity?: number
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          min_quantity?: number
          part_name?: string
          part_number?: string | null
          quantity?: number
          supplier?: string | null
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parts_inventory_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bookings: {
        Row: {
          booking_date: string
          company_id: string | null
          created_at: string
          id: string
          notes: string | null
          reminder_sent: boolean | null
          reminder_settings: Json | null
          service_center_id: string | null
          service_type: string
          status: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          booking_date: string
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reminder_sent?: boolean | null
          reminder_settings?: Json | null
          service_center_id?: string | null
          service_type: string
          status?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          booking_date?: string
          company_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          reminder_sent?: boolean | null
          reminder_settings?: Json | null
          service_center_id?: string | null
          service_type?: string
          status?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_service_center_id_fkey"
            columns: ["service_center_id"]
            isOneToOne: false
            referencedRelation: "service_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_centers: {
        Row: {
          address: string
          company_id: string | null
          contact_number: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          operating_hours: Json | null
          updated_at: string
        }
        Insert: {
          address: string
          company_id?: string | null
          contact_number?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          operating_hours?: Json | null
          updated_at?: string
        }
        Update: {
          address?: string
          company_id?: string | null
          contact_number?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          operating_hours?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_centers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_logs: {
        Row: {
          comments: string | null
          company_id: string | null
          created_at: string
          driver_id: string
          end_kilometers: number
          end_time: string
          id: string
          purpose: string
          start_kilometers: number
          start_time: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          comments?: string | null
          company_id?: string | null
          created_at?: string
          driver_id: string
          end_kilometers: number
          end_time: string
          id?: string
          purpose: string
          start_kilometers: number
          start_time: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          comments?: string | null
          company_id?: string | null
          created_at?: string
          driver_id?: string
          end_kilometers?: number
          end_time?: string
          id?: string
          purpose?: string
          start_kilometers?: number
          start_time?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_notifications: {
        Row: {
          company_id: string | null
          created_at: string
          due_date: string | null
          id: string
          message: string
          priority: string
          status: string
          type: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          message: string
          priority: string
          status?: string
          type: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          message?: string
          priority?: string
          status?: string
          type?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_notifications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_notifications_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_services: {
        Row: {
          company_id: string | null
          cost: number | null
          created_at: string
          description: string | null
          id: string
          kilometers: number
          service_date: string
          service_type: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          company_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          kilometers: number
          service_date: string
          service_type: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          company_id?: string | null
          cost?: number | null
          created_at?: string
          description?: string | null
          id?: string
          kilometers?: number
          service_date?: string
          service_type?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_services_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          assigned_to: string | null
          assignment_end_date: string | null
          assignment_start_date: string | null
          company_id: string | null
          created_at: string
          current_kilometers: number | null
          fitness_cert_expiry: string | null
          id: string
          insurance_expiry: string | null
          make: string
          model: string
          plate_number: string
          road_tax_expiry: string | null
          service_interval: number
          updated_at: string
          year: number
        }
        Insert: {
          assigned_to?: string | null
          assignment_end_date?: string | null
          assignment_start_date?: string | null
          company_id?: string | null
          created_at?: string
          current_kilometers?: number | null
          fitness_cert_expiry?: string | null
          id?: string
          insurance_expiry?: string | null
          make: string
          model: string
          plate_number: string
          road_tax_expiry?: string | null
          service_interval?: number
          updated_at?: string
          year: number
        }
        Update: {
          assigned_to?: string | null
          assignment_end_date?: string | null
          assignment_start_date?: string | null
          company_id?: string | null
          created_at?: string
          current_kilometers?: number | null
          fitness_cert_expiry?: string | null
          id?: string
          insurance_expiry?: string | null
          make?: string
          model?: string
          plate_number?: string
          road_tax_expiry?: string | null
          service_interval?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      process_service_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      erp_system_type:
        | "netsuite"
        | "odoo"
        | "sap"
        | "erpnext"
        | "dynamics365"
        | "acumatica"
        | "katana"
        | "sage"
        | "infor"
        | "sds4"
      subscription_type: "trial" | "full"
      user_role: "super_admin" | "company_admin" | "supervisor" | "driver"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
