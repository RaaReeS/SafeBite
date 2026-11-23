export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: { extensions?: Json; operationName?: string; query?: string; variables?: Json };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      dish_allergens: {
        Row: {
          allergen: Database["public"]["Enums"]["allergen"];
          dish_id: string;
          level: Database["public"]["Enums"]["allergen_level"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          allergen: Database["public"]["Enums"]["allergen"];
          dish_id: string;
          level: Database["public"]["Enums"]["allergen_level"];
          updated_at?: string;
        };
        Update: {
          allergen?: Database["public"]["Enums"]["allergen"];
          dish_id?: string;
          level?: Database["public"]["Enums"]["allergen_level"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dish_allergens_dish_id_fkey";
            columns: ["dish_id"];
            isOneToOne: false;
            referencedRelation: "dishes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dish_allergens_dish_id_fkey";
            columns: ["dish_id"];
            isOneToOne: false;
            referencedRelation: "public_dishes";
            referencedColumns: ["id"];
          },
        ];
      };
      dishes: {
        Row: {
          allergen_suggestions: NonNullable<Json>;
          category: string | null;
          created_at: string;
          description: string | null;
          id: string;
          ingredients: string | null;
          is_active: boolean;
          name: string;
          price_cents: number | null;
          restaurant_id: string;
          sort_order: number;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          allergen_suggestions?: NonNullable<Json>;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          ingredients?: string | null;
          is_active?: boolean;
          name: string;
          price_cents?: number | null;
          restaurant_id: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          allergen_suggestions?: NonNullable<Json>;
          category?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          ingredients?: string | null;
          is_active?: boolean;
          name?: string;
          price_cents?: number | null;
          restaurant_id?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dishes_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "public_restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dishes_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      family_member_allergens: {
        Row: {
          allergen: Database["public"]["Enums"]["allergen"];
          member_id: string;
        };
        ComputedFields: never;
        Insert: {
          allergen: Database["public"]["Enums"]["allergen"];
          member_id: string;
        };
        Update: {
          allergen?: Database["public"]["Enums"]["allergen"];
          member_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "family_member_allergens_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "family_members";
            referencedColumns: ["id"];
          },
        ];
      };
      family_members: {
        Row: {
          created_at: string;
          guardian_confirmed_at: string;
          id: string;
          name: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          guardian_confirmed_at: string;
          id?: string;
          name: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          guardian_confirmed_at?: string;
          id?: string;
          name?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "family_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      menu_imports: {
        Row: {
          created_at: string;
          id: string;
          restaurant_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          restaurant_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          restaurant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "menu_imports_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "public_restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "menu_imports_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          health_data_consent_at: string | null;
          id: string;
          plan: Database["public"]["Enums"]["account_plan"];
          role: Database["public"]["Enums"]["user_role"];
          terms_accepted_at: string | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          display_name?: string | null;
          health_data_consent_at?: string | null;
          id: string;
          plan?: Database["public"]["Enums"]["account_plan"];
          role?: Database["public"]["Enums"]["user_role"];
          terms_accepted_at?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          health_data_consent_at?: string | null;
          id?: string;
          plan?: Database["public"]["Enums"]["account_plan"];
          role?: Database["public"]["Enums"]["user_role"];
          terms_accepted_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      restaurant_requests: {
        Row: {
          city: string;
          created_at: string;
          id: string;
          restaurant_name: string;
          status: Database["public"]["Enums"]["restaurant_request_status"];
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          city: string;
          created_at?: string;
          id?: string;
          restaurant_name: string;
          status?: Database["public"]["Enums"]["restaurant_request_status"];
          user_id?: string;
        };
        Update: {
          city?: string;
          created_at?: string;
          id?: string;
          restaurant_name?: string;
          status?: Database["public"]["Enums"]["restaurant_request_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "restaurant_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurants: {
        Row: {
          address: string | null;
          city: string;
          contact_email: string | null;
          created_at: string;
          id: string;
          latitude: number | null;
          longitude: number | null;
          name: string;
          owner_id: string;
          phone: string | null;
          published: boolean;
          slug: string;
          updated_at: string;
          verification_note: string | null;
          verification_status: Database["public"]["Enums"]["restaurant_verification_status"];
          verified_at: string | null;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          city: string;
          contact_email?: string | null;
          created_at?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          owner_id?: string;
          phone?: string | null;
          published?: boolean;
          slug: string;
          updated_at?: string;
          verification_note?: string | null;
          verification_status?: Database["public"]["Enums"]["restaurant_verification_status"];
          verified_at?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string;
          contact_email?: string | null;
          created_at?: string;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          owner_id?: string;
          phone?: string | null;
          published?: boolean;
          slug?: string;
          updated_at?: string;
          verification_note?: string | null;
          verification_status?: Database["public"]["Enums"]["restaurant_verification_status"];
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "restaurants_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      user_allergens: {
        Row: {
          allergen: Database["public"]["Enums"]["allergen"];
          created_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          allergen: Database["public"]["Enums"]["allergen"];
          created_at?: string;
          user_id: string;
        };
        Update: {
          allergen?: Database["public"]["Enums"]["allergen"];
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_allergens_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      public_dish_allergens: {
        Row: {
          allergen: Database["public"]["Enums"]["allergen"];
          dish_id: string;
          level: Database["public"]["Enums"]["allergen_level"];
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "dish_allergens_dish_id_fkey";
            columns: ["dish_id"];
            isOneToOne: false;
            referencedRelation: "dishes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dish_allergens_dish_id_fkey";
            columns: ["dish_id"];
            isOneToOne: false;
            referencedRelation: "public_dishes";
            referencedColumns: ["id"];
          },
        ];
      };
      public_dishes: {
        Row: {
          category: string | null;
          description: string | null;
          id: string;
          ingredients: string | null;
          name: string;
          price_cents: number | null;
          restaurant_id: string;
          sort_order: number;
        };
        ComputedFields: never;
        Relationships: [
          {
            foreignKeyName: "dishes_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "public_restaurants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "dishes_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          },
        ];
      };
      public_restaurants: {
        Row: {
          address: string | null;
          city: string;
          contact_email: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          name: string;
          phone: string | null;
          slug: string;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          city?: string | null;
          contact_email?: string | null;
          id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          name?: string | null;
          phone?: string | null;
          slug?: string | null;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          contact_email?: string | null;
          id?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          name?: string | null;
          phone?: string | null;
          slug?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      add_family_member: {
        Args: { guardian_confirmed: boolean; member_name: string };
        Returns: string;
      };
      admin_has_second_factor: { Args: Record<PropertyKey, never>; Returns: boolean };
      admin_list_restaurants: {
        Args: Record<PropertyKey, never>;
        Returns: {
          address: string;
          city: string;
          contact_email: string;
          created_at: string;
          id: string;
          name: string;
          owner_email: string;
          phone: string;
          published: boolean;
          slug: string;
          verification_note: string;
          verification_status: Database["public"]["Enums"]["restaurant_verification_status"];
          verified_at: string;
        }[];
      };
      admin_request_email_code: { Args: Record<PropertyKey, never>; Returns: undefined };
      admin_request_summary: {
        Args: Record<PropertyKey, never>;
        Returns: {
          city: string;
          city_key: string;
          first_requested_at: string;
          last_requested_at: string;
          name_key: string;
          pending_count: number;
          request_count: number;
          restaurant_name: string;
          status: Database["public"]["Enums"]["restaurant_request_status"];
        }[];
      };
      admin_set_account_plan: {
        Args: { new_plan: Database["public"]["Enums"]["account_plan"]; target_email: string };
        Returns: undefined;
      };
      admin_set_request_status: {
        Args: {
          new_status: Database["public"]["Enums"]["restaurant_request_status"];
          target_city_key: string;
          target_name_key: string;
        };
        Returns: number;
      };
      admin_set_restaurant_verification: {
        Args: {
          new_status: Database["public"]["Enums"]["restaurant_verification_status"];
          note?: string;
          target_restaurant_id: string;
        };
        Returns: undefined;
      };
      admin_verify_email_code: { Args: { code: string }; Returns: string };
      delete_own_account: { Args: Record<PropertyKey, never>; Returns: undefined };
      family_member_limit: { Args: Record<PropertyKey, never>; Returns: number };
      register_menu_import: { Args: { p_restaurant_id: string }; Returns: undefined };
      set_dish_allergens: {
        Args: { declarations: Json; target_dish_id: string };
        Returns: undefined;
      };
      set_family_member_allergens: {
        Args: { allergens: Database["public"]["Enums"]["allergen"][]; target_member_id: string };
        Returns: undefined;
      };
      set_my_allergens: {
        Args: { allergens: Database["public"]["Enums"]["allergen"][] };
        Returns: undefined;
      };
    };
    Enums: {
      account_plan: "free" | "premium";
      allergen:
        | "gluten"
        | "crustaceans"
        | "eggs"
        | "fish"
        | "peanuts"
        | "soybeans"
        | "milk"
        | "nuts"
        | "celery"
        | "mustard"
        | "sesame"
        | "sulphites"
        | "lupin"
        | "molluscs";
      allergen_level: "contains" | "may_contain" | "free_from";
      restaurant_request_status: "pending" | "added";
      restaurant_verification_status: "pending" | "verified" | "rejected";
      user_role: "diner" | "restaurant_owner" | "admin";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_plan: ["free", "premium"],
      allergen: [
        "gluten",
        "crustaceans",
        "eggs",
        "fish",
        "peanuts",
        "soybeans",
        "milk",
        "nuts",
        "celery",
        "mustard",
        "sesame",
        "sulphites",
        "lupin",
        "molluscs",
      ],
      allergen_level: ["contains", "may_contain", "free_from"],
      restaurant_request_status: ["pending", "added"],
      restaurant_verification_status: ["pending", "verified", "rejected"],
      user_role: ["diner", "restaurant_owner", "admin"],
    },
  },
} as const;
