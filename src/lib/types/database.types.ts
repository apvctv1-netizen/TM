// Sinh tự động từ schema Postgres thực tế (introspection qua information_schema,
// vì máy không có Docker để chạy `supabase gen types` chuẩn). Chạy lại script
// tương tự mỗi khi schema đổi, hoặc dùng CLI thật khi có Docker/đã `supabase login`.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      attendance_entries: {
        Row: {
          id: string
          employee_id: string
          work_date: string
          shift_type_id: string
          note: string | null
          created_at: string
          created_by: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          employee_id: string
          work_date: string
          shift_type_id: string
          note?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          employee_id?: string
          work_date?: string
          shift_type_id?: string
          note?: string | null
          created_at?: string
          created_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_entries_shift_type_id_fkey"
            columns: ["shift_type_id"]
            isOneToOne: false
            referencedRelation: "shift_types"
            referencedColumns: ["id"]
          }
        ]
      }
      employees: {
        Row: {
          id: string
          employee_code: number
          full_name: string
          start_date: string
          end_date: string | null
          gender: string | null
          dob: string | null
          id_number: string | null
          id_issue_date: string | null
          id_issue_place: string | null
          permanent_address: string | null
          phone: string | null
          email: string | null
          education_level: string | null
          partner_code: string | null
          position_code: string | null
          contract_type: string
          note: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          employee_code: number
          full_name: string
          start_date: string
          end_date?: string | null
          gender?: string | null
          dob?: string | null
          id_number?: string | null
          id_issue_date?: string | null
          id_issue_place?: string | null
          permanent_address?: string | null
          phone?: string | null
          email?: string | null
          education_level?: string | null
          partner_code?: string | null
          position_code?: string | null
          contract_type?: string
          note?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          employee_code?: number
          full_name?: string
          start_date?: string
          end_date?: string | null
          gender?: string | null
          dob?: string | null
          id_number?: string | null
          id_issue_date?: string | null
          id_issue_place?: string | null
          permanent_address?: string | null
          phone?: string | null
          email?: string | null
          education_level?: string | null
          partner_code?: string | null
          position_code?: string | null
          contract_type?: string
          note?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_partner_code_fkey"
            columns: ["partner_code"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "employees_position_code_fkey"
            columns: ["position_code"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["code"]
          }
        ]
      }
      holidays: {
        Row: {
          id: string
          holiday_date: string
          name: string
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          holiday_date: string
          name: string
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          holiday_date?: string
          name?: string
          created_at?: string
          created_by?: string | null
        }
        Relationships: [

        ]
      }
      partners: {
        Row: {
          code: string
          name: string
          is_active: boolean
        }
        Insert: {
          code: string
          name: string
          is_active?: boolean
        }
        Update: {
          code?: string
          name?: string
          is_active?: boolean
        }
        Relationships: [

        ]
      }
      payroll_entries: {
        Row: {
          id: string
          period_id: string
          employee_id: string
          contract_type_snapshot: string
          standard_cong: number
          ctt: number
          cong_chinh: number
          tang_ca: number
          cong_truc_le_tet: number
          cong_ca_dem: number
          cong_che_do: number
          so_ngay_nghi_le_tet: number
          cong_ht_dao_tao: number
          ngay_nghi_phep_nam: number
          cght_knn: number
          don_gia_cong: number
          don_gia_tang_ca: number
          don_gia_truc_le_tet: number
          don_gia_nghi_le_tet: number
          don_gia_ca_dem: number
          don_gia_luong_che_do: number
          don_gia_phep_nam: number
          completion_bonus_amount: number
          incentive_bonus_threshold_cong: number
          incentive_bonus_rate: number
          meal_allowance_rate: number
          cght_knn_rate: number
          tien_trach_nhiem: number
          tien_hoc_viec: number
          bo_sung_luong: number
          tru_bhxh: number
          thu_ho: number
          thue_tncn: number
          truy_thu: number
          luong_theo_ctt: number
          tien_tang_ca: number
          tien_truc_le_tet: number
          tien_nghi_le_tet: number
          tien_ca_dem: number
          tien_luong_che_do: number
          tien_phep_nam: number
          thuong_hoan_thanh: number
          thuong_khuyen_khich: number
          ho_tro_an_giua_ca: number
          tien_thuong_cght_knn: number
          tong_luong: number
          tong_khau_tru: number
          tong_luong_nhan: number
          global_settings_id: string | null
          rate_settings_id: string | null
          calculated_at: string | null
          calculated_by: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          period_id: string
          employee_id: string
          contract_type_snapshot: string
          standard_cong?: number
          ctt?: number
          cong_chinh?: number
          tang_ca?: number
          cong_truc_le_tet?: number
          cong_ca_dem?: number
          cong_che_do?: number
          so_ngay_nghi_le_tet?: number
          cong_ht_dao_tao?: number
          ngay_nghi_phep_nam?: number
          cght_knn?: number
          don_gia_cong?: number
          don_gia_tang_ca?: number
          don_gia_truc_le_tet?: number
          don_gia_nghi_le_tet?: number
          don_gia_ca_dem?: number
          don_gia_luong_che_do?: number
          don_gia_phep_nam?: number
          completion_bonus_amount?: number
          incentive_bonus_threshold_cong?: number
          incentive_bonus_rate?: number
          meal_allowance_rate?: number
          cght_knn_rate?: number
          tien_trach_nhiem?: number
          tien_hoc_viec?: number
          bo_sung_luong?: number
          tru_bhxh?: number
          thu_ho?: number
          thue_tncn?: number
          truy_thu?: number
          luong_theo_ctt?: number
          tien_tang_ca?: number
          tien_truc_le_tet?: number
          tien_nghi_le_tet?: number
          tien_ca_dem?: number
          tien_luong_che_do?: number
          tien_phep_nam?: number
          thuong_hoan_thanh?: number
          thuong_khuyen_khich?: number
          ho_tro_an_giua_ca?: number
          tien_thuong_cght_knn?: number
          tong_luong?: number
          tong_khau_tru?: number
          tong_luong_nhan?: number
          global_settings_id?: string | null
          rate_settings_id?: string | null
          calculated_at?: string | null
          calculated_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          period_id?: string
          employee_id?: string
          contract_type_snapshot?: string
          standard_cong?: number
          ctt?: number
          cong_chinh?: number
          tang_ca?: number
          cong_truc_le_tet?: number
          cong_ca_dem?: number
          cong_che_do?: number
          so_ngay_nghi_le_tet?: number
          cong_ht_dao_tao?: number
          ngay_nghi_phep_nam?: number
          cght_knn?: number
          don_gia_cong?: number
          don_gia_tang_ca?: number
          don_gia_truc_le_tet?: number
          don_gia_nghi_le_tet?: number
          don_gia_ca_dem?: number
          don_gia_luong_che_do?: number
          don_gia_phep_nam?: number
          completion_bonus_amount?: number
          incentive_bonus_threshold_cong?: number
          incentive_bonus_rate?: number
          meal_allowance_rate?: number
          cght_knn_rate?: number
          tien_trach_nhiem?: number
          tien_hoc_viec?: number
          bo_sung_luong?: number
          tru_bhxh?: number
          thu_ho?: number
          thue_tncn?: number
          truy_thu?: number
          luong_theo_ctt?: number
          tien_tang_ca?: number
          tien_truc_le_tet?: number
          tien_nghi_le_tet?: number
          tien_ca_dem?: number
          tien_luong_che_do?: number
          tien_phep_nam?: number
          thuong_hoan_thanh?: number
          thuong_khuyen_khich?: number
          ho_tro_an_giua_ca?: number
          tien_thuong_cght_knn?: number
          tong_luong?: number
          tong_khau_tru?: number
          tong_luong_nhan?: number
          global_settings_id?: string | null
          rate_settings_id?: string | null
          calculated_at?: string | null
          calculated_by?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payroll_entries_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_global_settings_id_fkey"
            columns: ["global_settings_id"]
            isOneToOne: false
            referencedRelation: "payroll_global_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_entries_rate_settings_id_fkey"
            columns: ["rate_settings_id"]
            isOneToOne: false
            referencedRelation: "payroll_rate_settings"
            referencedColumns: ["id"]
          }
        ]
      }
      payroll_global_settings: {
        Row: {
          id: string
          effective_from: string
          standard_cong: number
          incentive_bonus_threshold_cong: number
          incentive_bonus_rate: number
          meal_allowance_rate: number
          cght_knn_rate: number
          social_insurance_rate: number
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          effective_from: string
          standard_cong?: number
          incentive_bonus_threshold_cong?: number
          incentive_bonus_rate?: number
          meal_allowance_rate?: number
          cght_knn_rate?: number
          social_insurance_rate?: number
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          effective_from?: string
          standard_cong?: number
          incentive_bonus_threshold_cong?: number
          incentive_bonus_rate?: number
          meal_allowance_rate?: number
          cght_knn_rate?: number
          social_insurance_rate?: number
          created_at?: string
          created_by?: string | null
        }
        Relationships: [

        ]
      }
      payroll_periods: {
        Row: {
          id: string
          period_year: number
          period_month: number
          status: string
          locked_at: string | null
          locked_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          period_year: number
          period_month: number
          status?: string
          locked_at?: string | null
          locked_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          period_year?: number
          period_month?: number
          status?: string
          locked_at?: string | null
          locked_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      payroll_rate_settings: {
        Row: {
          id: string
          effective_from: string
          contract_type: string
          base_salary: number
          overtime_multiplier: number
          holiday_work_multiplier: number
          night_shift_multiplier: number
          holiday_off_pay_enabled: boolean
          completion_bonus_amount: number
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          effective_from: string
          contract_type: string
          base_salary: number
          overtime_multiplier?: number
          holiday_work_multiplier?: number
          night_shift_multiplier?: number
          holiday_off_pay_enabled?: boolean
          completion_bonus_amount?: number
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          effective_from?: string
          contract_type?: string
          base_salary?: number
          overtime_multiplier?: number
          holiday_work_multiplier?: number
          night_shift_multiplier?: number
          holiday_off_pay_enabled?: boolean
          completion_bonus_amount?: number
          created_at?: string
          created_by?: string | null
        }
        Relationships: [

        ]
      }
      positions: {
        Row: {
          code: string
          name: string
          is_active: boolean
        }
        Insert: {
          code: string
          name: string
          is_active?: boolean
        }
        Update: {
          code?: string
          name?: string
          is_active?: boolean
        }
        Relationships: [

        ]
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          employee_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role?: string
          employee_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          employee_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          }
        ]
      }
      shift_types: {
        Row: {
          id: string
          code: string
          label: string
          time_range: string | null
          parent_group: string
          work_unit_fraction: number
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          label: string
          time_range?: string | null
          parent_group: string
          work_unit_fraction: number
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          label?: string
          time_range?: string | null
          parent_group?: string
          work_unit_fraction?: number
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: [

        ]
      }
      user_permissions: {
        Row: {
          id: string
          user_id: string
          feature: string
          can_view: boolean
          can_edit: boolean
          granted_by: string | null
          granted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feature: string
          can_view?: boolean
          can_edit?: boolean
          granted_by?: string | null
          granted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          feature?: string
          can_view?: boolean
          can_edit?: boolean
          granted_by?: string | null
          granted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      current_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_permission: {
        Args: { p_feature: string; p_level?: string }
        Returns: boolean
      }
      calculate_payroll_period: {
        Args: { p_year: number; p_month: number }
        Returns: Database["public"]["Tables"]["payroll_entries"]["Row"][]
      }
      set_attendance_day: {
        Args: { p_employee_id: string; p_work_date: string; p_shift_type_ids: string[] }
        Returns: Database["public"]["Tables"]["attendance_entries"]["Row"][]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
