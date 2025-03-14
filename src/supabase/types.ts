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
      category: {
        Row: {
          created_at: string
          id: number
          imageUrl: string | null
          name: string
          products: number[] | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: number
          imageUrl?: string | null
          name: string
          products?: number[] | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: number
          imageUrl?: string | null
          name?: string
          products?: number[] | null
          slug?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          account: string | null
          amount_spent: number
          date: string | null
          department: string
          id: string
          item: string
          mode_of_payment: string | null
          submittedby: string | null
        }
        Insert: {
          account?: string | null
          amount_spent: number
          date?: string | null
          department: string
          id?: string
          item: string
          mode_of_payment?: string | null
          submittedby?: string | null
        }
        Update: {
          account?: string | null
          amount_spent?: number
          date?: string | null
          department?: string
          id?: string
          item?: string
          mode_of_payment?: string | null
          submittedby?: string | null
        }
        Relationships: []
      }
      finance: {
        Row: {
          amount_available: number | null
          amount_paid: number | null
          balance: number | null
          bank_name: string | null
          created_at: string | null
          id: number
          mode_of_mobilemoney: string | null
          mode_of_payment: string | null
          order_id: number | null
          submittedby: string | null
          total_amount: number | null
          user_id: string | null
        }
        Insert: {
          amount_available?: number | null
          amount_paid?: number | null
          balance?: number | null
          bank_name?: string | null
          created_at?: string | null
          id?: number
          mode_of_mobilemoney?: string | null
          mode_of_payment?: string | null
          order_id?: number | null
          submittedby?: string | null
          total_amount?: number | null
          user_id?: string | null
        }
        Update: {
          amount_available?: number | null
          amount_paid?: number | null
          balance?: number | null
          bank_name?: string | null
          created_at?: string | null
          id?: number
          mode_of_mobilemoney?: string | null
          mode_of_payment?: string | null
          order_id?: number | null
          submittedby?: string | null
          total_amount?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_ledger_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger: {
        Row: {
          amount: number | null
          description: string | null
          id: number
          reference_id: string | null
          reference_table: string | null
          transaction_date: string | null
          transaction_type: string | null
        }
        Insert: {
          amount?: number | null
          description?: string | null
          id?: number
          reference_id?: string | null
          reference_table?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
        }
        Update: {
          amount?: number | null
          description?: string | null
          id?: number
          reference_id?: string | null
          reference_table?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
        }
        Relationships: []
      }
      material_entries: {
        Row: {
          action: string
          created_by: string
          date: string | null
          id: number
          material_id: number | null
          quantity: number
        }
        Insert: {
          action: string
          created_by: string
          date?: string | null
          id?: number
          material_id?: number | null
          quantity: number
        }
        Update: {
          action?: string
          created_by?: string
          date?: string | null
          id?: number
          material_id?: number | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "material_entries_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          amount_available: number
          id: number
          name: string
          unit: string | null
        }
        Insert: {
          amount_available: number
          id?: never
          name: string
          unit?: string | null
        }
        Update: {
          amount_available?: number
          id?: never
          name?: string
          unit?: string | null
        }
        Relationships: []
      }
      order: {
        Row: {
          created_at: string
          description: string | null
          id: number
          is_processed: boolean | null
          receiption_status: string | null
          slug: string
          status: string
          total_amount: string | null
          user: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          is_processed?: boolean | null
          receiption_status?: string | null
          slug: string
          status: string
          total_amount?: string | null
          user: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          is_processed?: boolean | null
          receiption_status?: string | null
          slug?: string
          status?: string
          total_amount?: string | null
          user?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_user_fkey"
            columns: ["user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item: {
        Row: {
          created_at: string
          id: number
          order: number
          product: number
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: number
          order: number
          product: number
          quantity: number
        }
        Update: {
          created_at?: string
          id?: number
          order?: number
          product?: number
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_order"
            columns: ["order"]
            isOneToOne: false
            referencedRelation: "order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_item_product_fkey"
            columns: ["product"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      product: {
        Row: {
          category: number
          created_at: string
          heroImage: string | null
          id: number
          imagesUrl: string[] | null
          maxQuantity: number | null
          slug: string | null
          title: string
        }
        Insert: {
          category: number
          created_at?: string
          heroImage?: string | null
          id?: number
          imagesUrl?: string[] | null
          maxQuantity?: number | null
          slug?: string | null
          title: string
        }
        Update: {
          category?: number
          created_at?: string
          heroImage?: string | null
          id?: number
          imagesUrl?: string[] | null
          maxQuantity?: number | null
          slug?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      product_entries: {
        Row: {
          created_at: string | null
          Created_by: string | null
          id: number
          material_id: number | null
          product_id: number
          quantity: number
          title: string
        }
        Insert: {
          created_at?: string | null
          Created_by?: string | null
          id?: number
          material_id?: number | null
          product_id: number
          quantity: number
          title: string
        }
        Update: {
          created_at?: string | null
          Created_by?: string | null
          id?: number
          material_id?: number | null
          product_id?: number
          quantity?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      products_materials: {
        Row: {
          id: number
          material_id: number
          product_id: number
          quantity_required: number
        }
        Insert: {
          id?: never
          material_id: number
          product_id: number
          quantity_required: number
        }
        Update: {
          id?: never
          material_id?: number
          product_id?: number
          quantity_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      proof_of_payment: {
        Row: {
          file_url: string | null
          id: number
          order_id: number | null
          upload_date: string | null
          user_id: string | null
        }
        Insert: {
          file_url?: string | null
          id?: never
          order_id?: number | null
          upload_date?: string | null
          user_id?: string | null
        }
        Update: {
          file_url?: string | null
          id?: never
          order_id?: number | null
          upload_date?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proofs_of_payment_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proofs_of_payment_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          address: string | null
          avatar_url: string
          created_at: string | null
          email: string
          expo_notification_token: string | null
          id: string
          name: string | null
          password: string | null
          phone: string | null
          type: string | null
        }
        Insert: {
          address?: string | null
          avatar_url: string
          created_at?: string | null
          email: string
          expo_notification_token?: string | null
          id: string
          name?: string | null
          password?: string | null
          phone?: string | null
          type?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string
          created_at?: string | null
          email?: string
          expo_notification_token?: string | null
          id?: string
          name?: string | null
          password?: string | null
          phone?: string | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_product_quantity: {
        Args: {
          product_id: number
          quantity: number
        }
        Returns: undefined
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
