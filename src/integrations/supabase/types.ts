export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      ad_analytics: {
        Row: {
          ad_id: string | null
          clicks: number | null
          conversion_rate: number | null
          created_at: string | null
          date: string | null
          id: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          ad_id?: string | null
          clicks?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          ad_id?: string | null
          clicks?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          date?: string | null
          id?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_analytics_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
        ]
      }
      advertisements: {
        Row: {
          advertiser_id: string | null
          clicks: number | null
          company_id: string | null
          content: string
          cost_per_day: number | null
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          payment_status: string | null
          placement_location: string | null
          start_date: string
          title: string
          total_cost: number | null
          updated_at: string
          views: number | null
        }
        Insert: {
          advertiser_id?: string | null
          clicks?: number | null
          company_id?: string | null
          content: string
          cost_per_day?: number | null
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          payment_status?: string | null
          placement_location?: string | null
          start_date: string
          title: string
          total_cost?: number | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          advertiser_id?: string | null
          clicks?: number | null
          company_id?: string | null
          content?: string
          cost_per_day?: number | null
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          payment_status?: string | null
          placement_location?: string | null
          start_date?: string
          title?: string
          total_cost?: number | null
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_advertiser_id_fkey"
            columns: ["advertiser_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      auth_rate_limits: {
        Row: {
          action_type: string
          attempt_count: number | null
          blocked_until: string | null
          created_at: string | null
          id: string
          user_identifier: string
          window_start: string | null
        }
        Insert: {
          action_type: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          user_identifier: string
          window_start?: string | null
        }
        Update: {
          action_type?: string
          attempt_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          user_identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      backup_logs: {
        Row: {
          backup_frequency: string | null
          backup_hash: string | null
          backup_location: string | null
          backup_type: string
          company_id: string | null
          completed_at: string | null
          compression_ratio: number | null
          created_at: string | null
          encryption_enabled: boolean | null
          encryption_key_id: string | null
          file_path: string | null
          id: string
          retention_days: number | null
          size_bytes: number | null
          started_at: string | null
          status: string
          verification_status: string | null
        }
        Insert: {
          backup_frequency?: string | null
          backup_hash?: string | null
          backup_location?: string | null
          backup_type: string
          company_id?: string | null
          completed_at?: string | null
          compression_ratio?: number | null
          created_at?: string | null
          encryption_enabled?: boolean | null
          encryption_key_id?: string | null
          file_path?: string | null
          id?: string
          retention_days?: number | null
          size_bytes?: number | null
          started_at?: string | null
          status?: string
          verification_status?: string | null
        }
        Update: {
          backup_frequency?: string | null
          backup_hash?: string | null
          backup_location?: string | null
          backup_type?: string
          company_id?: string | null
          completed_at?: string | null
          compression_ratio?: number | null
          created_at?: string | null
          encryption_enabled?: boolean | null
          encryption_key_id?: string | null
          file_path?: string | null
          id?: string
          retention_days?: number | null
          size_bytes?: number | null
          started_at?: string | null
          status?: string
          verification_status?: string | null
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
      document_categories: {
        Row: {
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_categories_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category_id: string | null
          company_id: string | null
          created_at: string | null
          created_by: string | null
          driver_id: string | null
          expiry_date: string | null
          file_size: number | null
          file_url: string | null
          id: string
          metadata: Json | null
          mime_type: string | null
          name: string
          parent_document_id: string | null
          storage_path: string
          type: string
          updated_at: string | null
          vehicle_id: string | null
          verification_notes: string | null
          verification_status: string
          verified_at: string | null
          verified_by: string | null
          version: number | null
          version_notes: string | null
        }
        Insert: {
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          driver_id?: string | null
          expiry_date?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name: string
          parent_document_id?: string | null
          storage_path: string
          type: string
          updated_at?: string | null
          vehicle_id?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          version?: number | null
          version_notes?: string | null
        }
        Update: {
          category_id?: string | null
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          driver_id?: string | null
          expiry_date?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string | null
          name?: string
          parent_document_id?: string | null
          storage_path?: string
          type?: string
          updated_at?: string | null
          vehicle_id?: string | null
          verification_notes?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
          version?: number | null
          version_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
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
      driver_trainings: {
        Row: {
          certificate_file_path: string | null
          certificate_number: string | null
          company_id: string
          completion_date: string
          course_id: string
          created_at: string
          driver_id: string
          expiry_date: string | null
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          certificate_file_path?: string | null
          certificate_number?: string | null
          company_id: string
          completion_date?: string
          course_id: string
          created_at?: string
          driver_id: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          certificate_file_path?: string | null
          certificate_number?: string | null
          company_id?: string
          completion_date?: string
          course_id?: string
          created_at?: string
          driver_id?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_trainings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
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
          encrypted_credentials: string | null
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
          encrypted_credentials?: string | null
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
          encrypted_credentials?: string | null
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
      error_logs: {
        Row: {
          company_id: string | null
          created_at: string
          error_data: Json | null
          error_message: string
          error_type: string
          id: string
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          stack_trace: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          error_data?: Json | null
          error_message: string
          error_type: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          error_data?: Json | null
          error_message?: string
          error_type?: string
          id?: string
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          stack_trace?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "error_logs_company_id_fkey"
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
          encrypted_config: string | null
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
          encrypted_config?: string | null
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
          encrypted_config?: string | null
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
      ip_whitelist: {
        Row: {
          company_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          ip_address: string
          updated_at: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          ip_address?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ip_whitelist_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ip_whitelist_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      messages: {
        Row: {
          company_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          sender_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          company_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          sender_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          sender_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
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
          two_factor_enabled: boolean | null
          two_factor_method: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          two_factor_enabled?: boolean | null
          two_factor_method?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          two_factor_enabled?: boolean | null
          two_factor_method?: string | null
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
      security_audit_logs: {
        Row: {
          company_id: string | null
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          ip_address: string | null
          risk_level: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          risk_level?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          risk_level?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_results: {
        Row: {
          audit_id: string
          company_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          results: Json
          score: number
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          audit_id: string
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          results?: Json
          score?: number
          started_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          audit_id?: string
          company_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          results?: Json
          score?: number
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          event_details: Json
          event_type: string
          id: string
          ip_address: string | null
          risk_score: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_details?: Json
          event_type: string
          id?: string
          ip_address?: string | null
          risk_score?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_details?: Json
          event_type?: string
          id?: string
          ip_address?: string | null
          risk_score?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_policies: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          policy_config: Json
          policy_name: string
          policy_type: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          policy_config?: Json
          policy_name: string
          policy_type: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          policy_config?: Json
          policy_name?: string
          policy_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_policies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      security_policy_config: {
        Row: {
          company_id: string
          configuration: Json
          created_at: string
          created_by: string
          id: string
          is_enabled: boolean
          policy_name: string
          policy_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          configuration?: Json
          created_at?: string
          created_by: string
          id?: string
          is_enabled?: boolean
          policy_name: string
          policy_type: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          configuration?: Json
          created_at?: string
          created_by?: string
          id?: string
          is_enabled?: boolean
          policy_name?: string
          policy_type?: string
          updated_at?: string
        }
        Relationships: []
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
      system_health_logs: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number
          status: string
          threshold_value: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value: number
          status?: string
          threshold_value?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number
          status?: string
          threshold_value?: number | null
        }
        Relationships: []
      }
      training_courses: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          duration_hours: number
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          duration_hours: number
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          duration_hours?: number
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      trip_approvals: {
        Row: {
          approved_by: string
          comment: string | null
          created_at: string
          id: string
          status: string
          trip_id: string
        }
        Insert: {
          approved_by: string
          comment?: string | null
          created_at?: string
          id?: string
          status: string
          trip_id: string
        }
        Update: {
          approved_by?: string
          comment?: string | null
          created_at?: string
          id?: string
          status?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_approvals_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_approvals_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "vehicle_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_logs: {
        Row: {
          approval_comment: string | null
          approval_status: string | null
          comments: string | null
          created_at: string | null
          driver_id: string | null
          end_kilometers: number | null
          end_location: Json | null
          end_time: string | null
          id: string
          purpose: string
          start_kilometers: number
          start_location: Json | null
          start_time: string
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          approval_comment?: string | null
          approval_status?: string | null
          comments?: string | null
          created_at?: string | null
          driver_id?: string | null
          end_kilometers?: number | null
          end_location?: Json | null
          end_time?: string | null
          id?: string
          purpose: string
          start_kilometers: number
          start_location?: Json | null
          start_time: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          approval_comment?: string | null
          approval_status?: string | null
          comments?: string | null
          created_at?: string | null
          driver_id?: string | null
          end_kilometers?: number | null
          end_location?: Json | null
          end_time?: string | null
          id?: string
          purpose?: string
          start_kilometers?: number
          start_location?: Json | null
          start_time?: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_logs_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          company_id: string
          created_at: string
          driver_id: string
          end_date: string | null
          end_kilometers: number | null
          end_location: string | null
          id: string
          purpose: string | null
          start_date: string
          start_kilometers: number
          start_location: string
          status: string | null
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          driver_id: string
          end_date?: string | null
          end_kilometers?: number | null
          end_location?: string | null
          id?: string
          purpose?: string | null
          start_date?: string
          start_kilometers: number
          start_location: string
          status?: string | null
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          driver_id?: string
          end_date?: string | null
          end_kilometers?: number | null
          end_location?: string | null
          id?: string
          purpose?: string | null
          start_date?: string
          start_kilometers?: number
          start_location?: string
          status?: string | null
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      two_factor_backup_codes: {
        Row: {
          code: string
          created_at: string | null
          id: string
          used: boolean | null
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
          used?: boolean | null
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "two_factor_backup_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      user_mfa_secrets: {
        Row: {
          created_at: string
          secret: string
          user_id: string
        }
        Insert: {
          created_at?: string
          secret: string
          user_id: string
        }
        Update: {
          created_at?: string
          secret?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_mfa_secrets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity: string
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vehicle_inspections: {
        Row: {
          checklist: Json
          comments: string | null
          created_at: string | null
          driver_id: string | null
          id: string
          inspection_date: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          checklist: Json
          comments?: string | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          inspection_date?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          checklist?: Json
          comments?: string | null
          created_at?: string | null
          driver_id?: string | null
          id?: string
          inspection_date?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_inspections_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_logs: {
        Row: {
          approval_comment: string | null
          approval_status: string
          approved_at: string | null
          approved_by: string | null
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
          approval_comment?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
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
          approval_comment?: string | null
          approval_status?: string
          approved_at?: string | null
          approved_by?: string | null
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
            foreignKeyName: "vehicle_logs_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
          fuel_type: string | null
          id: string
          insurance_expiry: string | null
          make: string
          model: string
          plate_number: string
          road_tax_expiry: string | null
          service_interval: number
          status: string | null
          updated_at: string
          vin: string | null
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
          fuel_type?: string | null
          id?: string
          insurance_expiry?: string | null
          make: string
          model: string
          plate_number: string
          road_tax_expiry?: string | null
          service_interval?: number
          status?: string | null
          updated_at?: string
          vin?: string | null
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
          fuel_type?: string | null
          id?: string
          insurance_expiry?: string | null
          make?: string
          model?: string
          plate_number?: string
          road_tax_expiry?: string | null
          service_interval?: number
          status?: string | null
          updated_at?: string
          vin?: string | null
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
      workflow_states: {
        Row: {
          assigned_to: string | null
          company_id: string
          created_at: string
          current_state: string
          entity_id: string
          entity_type: string
          id: string
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          company_id: string
          created_at?: string
          current_state: string
          entity_id: string
          entity_type: string
          id?: string
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          company_id?: string
          created_at?: string
          current_state?: string
          entity_id?: string
          entity_type?: string
          id?: string
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_if_first_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_public_table_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          has_public_access: boolean
          table_name: string
        }[]
      }
      check_rate_limit: {
        Args: {
          p_action_type: string
          p_identifier: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_table_rls_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          rls_enabled: boolean
          table_name: string
        }[]
      }
      create_backup: {
        Args: { p_backup_type?: string; p_company_id: string }
        Returns: string
      }
      create_test_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      decrypt_credentials: {
        Args: { encrypted_data: string; encryption_key?: string }
        Returns: Json
      }
      decrypt_integration_credentials: {
        Args: { encrypted_data: string }
        Returns: Json
      }
      encrypt_credentials: {
        Args: { credentials_data: Json; encryption_key?: string }
        Returns: string
      }
      encrypt_integration_credentials: {
        Args: { credentials_data: Json }
        Returns: string
      }
      get_current_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_secure_document_url: {
        Args: { storage_path: string }
        Returns: string
      }
      get_user_role: {
        Args: { user_id?: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      log_error: {
        Args: {
          p_company_id?: string
          p_error_data?: Json
          p_error_message: string
          p_error_type: string
          p_stack_trace?: string
          p_url?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      log_security_event: {
        Args: {
          p_company_id?: string
          p_event_data?: Json
          p_event_type: string
          p_ip_address?: string
          p_risk_level?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      process_service_reminders: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      schedule_automated_backup: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      verify_backup_integrity: {
        Args: { backup_id: string }
        Returns: boolean
      }
    }
    Enums: {
      common_trip_purpose:
        | "Delivery"
        | "Pickup"
        | "Maintenance"
        | "Client Visit"
        | "Administrative"
        | "Other"
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
      inspection_item:
        | "Brakes"
        | "Lights"
        | "Tires"
        | "Oil Level"
        | "Windshield"
        | "Mirrors"
        | "Horn"
        | "Seatbelts"
        | "Emergency Kit"
        | "Fuel Level"
      subscription_type: "trial" | "full"
      user_role: "super_admin" | "company_admin" | "supervisor" | "driver"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      common_trip_purpose: [
        "Delivery",
        "Pickup",
        "Maintenance",
        "Client Visit",
        "Administrative",
        "Other",
      ],
      erp_system_type: [
        "netsuite",
        "odoo",
        "sap",
        "erpnext",
        "dynamics365",
        "acumatica",
        "katana",
        "sage",
        "infor",
        "sds4",
      ],
      inspection_item: [
        "Brakes",
        "Lights",
        "Tires",
        "Oil Level",
        "Windshield",
        "Mirrors",
        "Horn",
        "Seatbelts",
        "Emergency Kit",
        "Fuel Level",
      ],
      subscription_type: ["trial", "full"],
      user_role: ["super_admin", "company_admin", "supervisor", "driver"],
    },
  },
} as const
