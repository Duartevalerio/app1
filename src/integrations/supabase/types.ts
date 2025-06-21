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
      betting_accounts: {
        Row: {
          created_at: string
          fixed_stake_value: number
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fixed_stake_value: number
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          fixed_stake_value?: number
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      betting_operations: {
        Row: {
          account_id: string
          bet_type: string
          created_at: string
          gain_value: number
          id: string
          orbit_value: number
        }
        Insert: {
          account_id: string
          bet_type: string
          created_at?: string
          gain_value: number
          id?: string
          orbit_value: number
        }
        Update: {
          account_id?: string
          bet_type?: string
          created_at?: string
          gain_value?: number
          id?: string
          orbit_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "betting_operations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "betting_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_tracker: {
        Row: {
          entry_date: string
          id: string
          profit: number | null
          user_id: string
          withdrawal: number | null
        }
        Insert: {
          entry_date: string
          id?: string
          profit?: number | null
          user_id: string
          withdrawal?: number | null
        }
        Update: {
          entry_date?: string
          id?: string
          profit?: number | null
          user_id?: string
          withdrawal?: number | null
        }
        Relationships: []
      }
      user_financial_summary: {
        Row: {
          bankroll: number | null
          user_id: string
        }
        Insert: {
          bankroll?: number | null
          user_id: string
        }
        Update: {
          bankroll?: number | null
          user_id?: string
        }
        Relationships: []
      }
      verification_accounts: {
        Row: {
          created_at: string
          id: string
          is_deleted: boolean | null
          is_done: boolean | null
          name: string
          user_id: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_done?: boolean | null
          name: string
          user_id: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          is_done?: boolean | null
          name?: string
          user_id?: string
          verification_status?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_owns_betting_account: {
        Args: { account_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
