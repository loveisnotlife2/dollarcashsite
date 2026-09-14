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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      daily_profits: {
        Row: {
          amount: number
          created_at: string
          id: string
          investment_id: string
          profit_date: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          investment_id: string
          profit_date?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          investment_id?: string
          profit_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_profits_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          created_at: string
          id: string
          method: string
          pkr_amount: number
          rate: number
          reject_reason: string | null
          screenshot_url: string | null
          status: string
          tid: string
          usd_amount: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          method: string
          pkr_amount: number
          rate: number
          reject_reason?: string | null
          screenshot_url?: string | null
          status?: string
          tid: string
          usd_amount: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          method?: string
          pkr_amount?: number
          rate?: number
          reject_reason?: string | null
          screenshot_url?: string | null
          status?: string
          tid?: string
          usd_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      investments: {
        Row: {
          activated_at: string
          expires_at: string
          id: string
          plan_id: string
          status: string
          total_earned: number
          user_id: string
        }
        Insert: {
          activated_at?: string
          expires_at: string
          id?: string
          plan_id: string
          status?: string
          total_earned?: number
          user_id: string
        }
        Update: {
          activated_at?: string
          expires_at?: string
          id?: string
          plan_id?: string
          status?: string
          total_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_number: string
          account_title: string
          id: string
          is_active: boolean
          method: string
          qr_url: string | null
          updated_at: string
        }
        Insert: {
          account_number?: string
          account_title?: string
          id?: string
          is_active?: boolean
          method: string
          qr_url?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: string
          account_title?: string
          id?: string
          is_active?: boolean
          method?: string
          qr_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          cost: number
          daily_return: number
          id: string
          is_active: boolean
          name: string
          sort_order: number
          total_return: number
          validity_days: number
        }
        Insert: {
          cost: number
          daily_return: number
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          total_return: number
          validity_days?: number
        }
        Update: {
          cost?: number
          daily_return?: number
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          total_return?: number
          validity_days?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          balance: number
          banned: boolean
          created_at: string
          email: string | null
          id: string
          referral_code: string
          referred_by: string | null
          username: string | null
        }
        Insert: {
          balance?: number
          banned?: boolean
          created_at?: string
          email?: string | null
          id: string
          referral_code: string
          referred_by?: string | null
          username?: string | null
        }
        Update: {
          balance?: number
          banned?: boolean
          created_at?: string
          email?: string | null
          id?: string
          referral_code?: string
          referred_by?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_amount: number
          bonus_paid: boolean
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          bonus_amount?: number
          bonus_paid?: boolean
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          bonus_amount?: number
          bonus_paid?: boolean
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          created_at: string
          id: string
          investment_id: string
          reward: number
          task_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          investment_id: string
          reward?: number
          task_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          investment_id?: string
          reward?: number
          task_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          account_number: string
          account_title: string
          created_at: string
          id: string
          method: string
          reject_reason: string | null
          status: string
          usd_amount: number
          user_id: string
        }
        Insert: {
          account_number: string
          account_title: string
          created_at?: string
          id?: string
          method: string
          reject_reason?: string | null
          status?: string
          usd_amount: number
          user_id: string
        }
        Update: {
          account_number?: string
          account_title?: string
          created_at?: string
          id?: string
          method?: string
          reject_reason?: string | null
          status?: string
          usd_amount?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_expire_investment: { Args: { p_id: string }; Returns: undefined }
      admin_review_deposit: {
        Args: { p_approve: boolean; p_id: string; p_reason?: string }
        Returns: undefined
      }
      admin_review_withdrawal: {
        Args: { p_approve: boolean; p_id: string; p_reason?: string }
        Returns: undefined
      }
      admin_set_balance: {
        Args: { p_balance: number; p_user: string }
        Returns: undefined
      }
      admin_set_banned: {
        Args: { p_banned: boolean; p_user: string }
        Returns: undefined
      }
      admin_stats: { Args: never; Returns: Json }
      bootstrap_profile: {
        Args: { p_ref_code?: string; p_username?: string }
        Returns: undefined
      }
      buy_plan: { Args: { p_plan_id: string }; Returns: string }
      complete_task: { Args: { p_investment_id: string }; Returns: number }
      distribute_daily_profits: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      request_withdrawal: {
        Args: {
          p_method: string
          p_number: string
          p_title: string
          p_usd: number
        }
        Returns: string
      }
      submit_deposit: {
        Args: {
          p_method: string
          p_screenshot_url: string
          p_tid: string
          p_usd: number
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "user"],
    },
  },
} as const
