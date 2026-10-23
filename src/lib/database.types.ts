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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      amenity_types: {
        Row: {
          category: Database["public"]["Enums"]["amenity_category"]
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          category: Database["public"]["Enums"]["amenity_category"]
          id: string
          name: string
          sort_order?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["amenity_category"]
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string
          key: string
          value: number
        }
        Insert: {
          description: string
          key: string
          value: number
        }
        Update: {
          description?: string
          key?: string
          value?: number
        }
        Relationships: []
      }
      content_reports: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          reporter_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id: string
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          reporter_id?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_types: {
        Row: {
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          id: string
          name: string
          sort_order?: number
        }
        Update: {
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      park_amenities: {
        Row: {
          amenity_type_id: string
          park_id: string
        }
        Insert: {
          amenity_type_id: string
          park_id: string
        }
        Update: {
          amenity_type_id?: string
          park_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "park_amenities_amenity_type_id_fkey"
            columns: ["amenity_type_id"]
            isOneToOne: false
            referencedRelation: "amenity_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "park_amenities_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
        ]
      }
      park_equipment: {
        Row: {
          condition: Database["public"]["Enums"]["equipment_condition"]
          equipment_type_id: string
          park_id: string
          quantity: number
        }
        Insert: {
          condition?: Database["public"]["Enums"]["equipment_condition"]
          equipment_type_id: string
          park_id: string
          quantity?: number
        }
        Update: {
          condition?: Database["public"]["Enums"]["equipment_condition"]
          equipment_type_id?: string
          park_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "park_equipment_equipment_type_id_fkey"
            columns: ["equipment_type_id"]
            isOneToOne: false
            referencedRelation: "equipment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "park_equipment_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
        ]
      }
      park_photos: {
        Row: {
          created_at: string
          height: number | null
          id: string
          is_hidden: boolean
          park_id: string
          report_count: number
          review_id: string | null
          storage_path: string
          user_id: string
          width: number | null
        }
        Insert: {
          created_at?: string
          height?: number | null
          id?: string
          is_hidden?: boolean
          park_id: string
          report_count?: number
          review_id?: string | null
          storage_path: string
          user_id: string
          width?: number | null
        }
        Update: {
          created_at?: string
          height?: number | null
          id?: string
          is_hidden?: boolean
          park_id?: string
          report_count?: number
          review_id?: string | null
          storage_path?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "park_photos_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "park_photos_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "park_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      park_submissions: {
        Row: {
          changes: Json
          confirmations: number
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["submission_kind"]
          note: string | null
          park_id: string
          rejections: number
          resolved_at: string | null
          status: Database["public"]["Enums"]["submission_status"]
        }
        Insert: {
          changes?: Json
          confirmations?: number
          created_at?: string
          created_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["submission_kind"]
          note?: string | null
          park_id: string
          rejections?: number
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Update: {
          changes?: Json
          confirmations?: number
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["submission_kind"]
          note?: string | null
          park_id?: string
          rejections?: number
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "park_submissions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "park_submissions_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
        ]
      }
      parks: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lat: number
          lng: number
          location: unknown
          name: string
          rating_cleanliness: number | null
          rating_environment: number | null
          rating_equipment: number | null
          rating_overall: number | null
          rating_safety: number | null
          review_count: number
          status: Database["public"]["Enums"]["park_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lat: number
          lng: number
          location?: unknown
          name: string
          rating_cleanliness?: number | null
          rating_environment?: number | null
          rating_equipment?: number | null
          rating_overall?: number | null
          rating_safety?: number | null
          review_count?: number
          status?: Database["public"]["Enums"]["park_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lat?: number
          lng?: number
          location?: unknown
          name?: string
          rating_cleanliness?: number | null
          rating_environment?: number | null
          rating_equipment?: number | null
          rating_overall?: number | null
          rating_safety?: number | null
          review_count?: number
          status?: Database["public"]["Enums"]["park_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_hidden: boolean
          park_id: string
          rating_cleanliness: number
          rating_environment: number
          rating_equipment: number
          rating_overall: number
          rating_safety: number
          report_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean
          park_id: string
          rating_cleanliness: number
          rating_environment: number
          rating_equipment: number
          rating_overall: number
          rating_safety: number
          report_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_hidden?: boolean
          park_id?: string
          rating_cleanliness?: number
          rating_environment?: number
          rating_equipment?: number
          rating_overall?: number
          rating_safety?: number
          report_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_park_id_fkey"
            columns: ["park_id"]
            isOneToOne: false
            referencedRelation: "parks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_votes: {
        Row: {
          created_at: string
          submission_id: string
          user_id: string
          vote: Database["public"]["Enums"]["vote_kind"]
        }
        Insert: {
          created_at?: string
          submission_id: string
          user_id: string
          vote: Database["public"]["Enums"]["vote_kind"]
        }
        Update: {
          created_at?: string
          submission_id?: string
          user_id?: string
          vote?: Database["public"]["Enums"]["vote_kind"]
        }
        Relationships: [
          {
            foreignKeyName: "submission_votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "park_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submission_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_park_photo: {
        Args: {
          height?: number
          park_id: string
          review_id?: string
          storage_path: string
          user_lat: number
          user_lng: number
          width?: number
        }
        Returns: string
      }
      create_park: {
        Args: {
          amenity_ids?: string[]
          description?: string
          equipment?: Json
          lat: number
          lng: number
          name: string
          user_lat: number
          user_lng: number
        }
        Returns: string
      }
      delete_account: { Args: never; Returns: undefined }
      nearby_parks: {
        Args: { user_lat: number; user_lng: number }
        Returns: {
          distance_meters: number
          id: string
          lat: number
          lng: number
          name: string
          pending_submissions: number
          status: Database["public"]["Enums"]["park_status"]
        }[]
      }
      parks_in_view: {
        Args: {
          amenity_ids?: string[]
          equipment_ids?: string[]
          max_lat: number
          max_lng: number
          max_results?: number
          min_lat: number
          min_lng: number
          min_rating?: number
          verified_only?: boolean
        }
        Returns: {
          id: string
          lat: number
          lng: number
          name: string
          rating_overall: number
          review_count: number
          status: Database["public"]["Enums"]["park_status"]
        }[]
      }
      propose_park_edit: {
        Args: {
          changes: Json
          note?: string
          park_id: string
          user_lat: number
          user_lng: number
        }
        Returns: string
      }
      propose_park_removal: {
        Args: {
          note?: string
          park_id: string
          user_lat: number
          user_lng: number
        }
        Returns: string
      }
      report_content: {
        Args: {
          reason?: string
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Returns: undefined
      }
      upsert_review: {
        Args: {
          body?: string
          park_id: string
          rating_cleanliness: number
          rating_environment: number
          rating_equipment: number
          rating_overall: number
          rating_safety: number
          user_lat: number
          user_lng: number
        }
        Returns: string
      }
      vote_on_submission: {
        Args: {
          submission_id: string
          user_lat: number
          user_lng: number
          vote: Database["public"]["Enums"]["vote_kind"]
        }
        Returns: Database["public"]["Enums"]["submission_status"]
      }
    }
    Enums: {
      amenity_category: "amenity" | "accessibility"
      equipment_condition: "good" | "worn" | "broken"
      park_status: "pending" | "approved" | "rejected" | "removed"
      report_target: "review" | "photo"
      submission_kind: "create" | "edit" | "remove"
      submission_status: "pending" | "approved" | "rejected"
      vote_kind: "confirm" | "reject"
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
      amenity_category: ["amenity", "accessibility"],
      equipment_condition: ["good", "worn", "broken"],
      park_status: ["pending", "approved", "rejected", "removed"],
      report_target: ["review", "photo"],
      submission_kind: ["create", "edit", "remove"],
      submission_status: ["pending", "approved", "rejected"],
      vote_kind: ["confirm", "reject"],
    },
  },
} as const
