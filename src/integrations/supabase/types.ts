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
      order_items: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
          unit: Database["public"]["Enums"]["unit_of_measure"]
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id?: string | null
          product_name: string
          quantity: number
          unit: Database["public"]["Enums"]["unit_of_measure"]
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit?: Database["public"]["Enums"]["unit_of_measure"]
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          comment: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_day: Database["public"]["Enums"]["delivery_day"]
          id: string
          order_number: number
          status: Database["public"]["Enums"]["order_status"]
          total: number
          updated_at: string
          user_id: string | null
          window_id: string | null
        }
        Insert: {
          address: string
          comment?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_day: Database["public"]["Enums"]["delivery_day"]
          id?: string
          order_number?: number
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          user_id?: string | null
          window_id?: string | null
        }
        Update: {
          address?: string
          comment?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_day?: Database["public"]["Enums"]["delivery_day"]
          id?: string
          order_number?: number
          status?: Database["public"]["Enums"]["order_status"]
          total?: number
          updated_at?: string
          user_id?: string | null
          window_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_window_id_fkey"
            columns: ["window_id"]
            isOneToOne: false
            referencedRelation: "preorder_windows"
            referencedColumns: ["id"]
          },
        ]
      }
      preorder_windows: {
        Row: {
          closes_at: string
          created_at: string
          delivery_days: Database["public"]["Enums"]["delivery_day"][]
          delivery_week_start: string | null
          description: string | null
          id: string
          is_active: boolean
          opens_at: string
          title: string
          updated_at: string
        }
        Insert: {
          closes_at: string
          created_at?: string
          delivery_days?: Database["public"]["Enums"]["delivery_day"][]
          delivery_week_start?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          opens_at: string
          title: string
          updated_at?: string
        }
        Update: {
          closes_at?: string
          created_at?: string
          delivery_days?: Database["public"]["Enums"]["delivery_day"][]
          delivery_week_start?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          opens_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          min_order: number
          name: string
          price: number
          sort_order: number
          step: number
          unit: Database["public"]["Enums"]["unit_of_measure"]
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_order?: number
          name: string
          price: number
          sort_order?: number
          step?: number
          unit?: Database["public"]["Enums"]["unit_of_measure"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_order?: number
          name?: string
          price?: number
          sort_order?: number
          step?: number
          unit?: Database["public"]["Enums"]["unit_of_measure"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          full_name: string | null
          id: string
          notify_on_new_window: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          notify_on_new_window?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          notify_on_new_window?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json
          id: string
          updated_at: string
        }
        Insert: {
          content?: Json
          id: string
          updated_at?: string
        }
        Update: {
          content?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "user"
      delivery_day: "thursday" | "friday" | "saturday"
      order_status: "new" | "confirmed" | "modified" | "completed" | "cancelled"
      product_category:
        | "fish"
        | "seafood"
        | "semifinished_turkey"
        | "semifinished_fish"
        | "semifinished_squid"
        | "semifinished_cottage"
        | "semifinished_apple"
        | "other"
        | "fish_chilled"
        | "fish_salted"
        | "fish_smoked"
        | "caviar"
        | "marinades"
        | "semifinished"
        | "canned"
      unit_of_measure: "kg" | "g" | "pcs" | "pack"
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
      app_role: ["admin", "editor", "user"],
      delivery_day: ["thursday", "friday", "saturday"],
      order_status: ["new", "confirmed", "modified", "completed", "cancelled"],
      product_category: [
        "fish",
        "seafood",
        "semifinished_turkey",
        "semifinished_fish",
        "semifinished_squid",
        "semifinished_cottage",
        "semifinished_apple",
        "other",
        "fish_chilled",
        "fish_salted",
        "fish_smoked",
        "caviar",
        "marinades",
        "semifinished",
        "canned",
      ],
      unit_of_measure: ["kg", "g", "pcs", "pack"],
    },
  },
} as const
