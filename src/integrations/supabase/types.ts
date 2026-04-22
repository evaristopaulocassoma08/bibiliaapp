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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bible_books: {
        Row: {
          abbrev: string
          chapters_count: number
          created_at: string
          id: number
          name: string
          position: number
          testament: string
        }
        Insert: {
          abbrev: string
          chapters_count: number
          created_at?: string
          id: number
          name: string
          position: number
          testament: string
        }
        Update: {
          abbrev?: string
          chapters_count?: number
          created_at?: string
          id?: number
          name?: string
          position?: number
          testament?: string
        }
        Relationships: []
      }
      bible_verses: {
        Row: {
          book_id: number
          chapter: number
          created_at: string
          id: number
          text: string
          verse: number
          version: string
        }
        Insert: {
          book_id: number
          chapter: number
          created_at?: string
          id?: number
          text: string
          verse: number
          version?: string
        }
        Update: {
          book_id?: number
          chapter?: number
          created_at?: string
          id?: number
          text?: string
          verse?: number
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_verses_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "bible_books"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          user_id: string
          verse_reference: string
          verse_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          verse_reference: string
          verse_text: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          verse_reference?: string
          verse_text?: string
        }
        Relationships: []
      }
      group_channels: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          group_id: string
          icon: string | null
          id: string
          name: string
          position: number
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          group_id: string
          icon?: string | null
          id?: string
          name: string
          position?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          group_id?: string
          icon?: string | null
          id?: string
          name?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "group_channels_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_join_requests: {
        Row: {
          created_at: string
          group_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          banned: boolean
          group_id: string
          id: string
          joined_at: string
          last_read_at: string
          muted: boolean
          nickname: string | null
          role: string
          user_id: string
        }
        Insert: {
          banned?: boolean
          group_id: string
          id?: string
          joined_at?: string
          last_read_at?: string
          muted?: boolean
          nickname?: string | null
          role?: string
          user_id: string
        }
        Update: {
          banned?: boolean
          group_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string
          muted?: boolean
          nickname?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          channel_id: string | null
          content: string | null
          created_at: string
          edited_at: string | null
          group_id: string
          id: string
          media_type: string
          media_url: string | null
          reply_to_id: string | null
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          content?: string | null
          created_at?: string
          edited_at?: string | null
          group_id: string
          id?: string
          media_type?: string
          media_url?: string | null
          reply_to_id?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string | null
          content?: string | null
          created_at?: string
          edited_at?: string | null
          group_id?: string
          id?: string
          media_type?: string
          media_url?: string | null
          reply_to_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "group_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      group_typing: {
        Row: {
          channel_id: string | null
          group_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          group_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string | null
          group_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_typing_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          invite_code: string | null
          is_public: boolean | null
          name: string
          only_admins_post: boolean
          owner_id: string | null
          pinned_message_id: string | null
          requires_approval: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean | null
          name: string
          only_admins_post?: boolean
          owner_id?: string | null
          pinned_message_id?: string | null
          requires_approval?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          invite_code?: string | null
          is_public?: boolean | null
          name?: string
          only_admins_post?: boolean
          owner_id?: string | null
          pinned_message_id?: string | null
          requires_approval?: boolean
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
          verse_reference: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
          verse_reference?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
          verse_reference?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sermon_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          sermon_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sermon_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sermon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sermon_comments_sermon_id_fkey"
            columns: ["sermon_id"]
            isOneToOne: false
            referencedRelation: "sermons"
            referencedColumns: ["id"]
          },
        ]
      }
      sermons: {
        Row: {
          chapters: Json | null
          content: string
          created_at: string
          id: string
          theme: string
          title: string
          user_id: string
        }
        Insert: {
          chapters?: Json | null
          content: string
          created_at?: string
          id?: string
          theme: string
          title: string
          user_id: string
        }
        Update: {
          chapters?: Json | null
          content?: string
          created_at?: string
          id?: string
          theme?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_group_member: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      is_group_owner: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      join_group_by_invite: { Args: { _code: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
