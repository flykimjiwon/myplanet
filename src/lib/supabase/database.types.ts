// Supabase에서 자동 생성된 타입을 여기에 붙여넣으세요
// Supabase Dashboard > Settings > API > TypeScript types에서 생성 가능

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      visited_countries: {
        Row: {
          id: string
          user_id: string
          country_code: string
          visits: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          country_code: string
          visits?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          country_code?: string
          visits?: number
          created_at?: string
          updated_at?: string
        }
      }
      country_ratings: {
        Row: {
          id: string
          user_id: string
          country_code: string
          rating: number
          review: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          country_code: string
          rating: number
          review?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          country_code?: string
          rating?: number
          review?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      travel_memories: {
        Row: {
          id: string
          user_id: string
          country_code: string
          photo_url: string | null
          title: string | null
          text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          country_code: string
          photo_url?: string | null
          title?: string | null
          text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          country_code?: string
          photo_url?: string | null
          title?: string | null
          text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          stats_card_position: Json | null
          stats_card_collapsed: boolean
          travel_preferences: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stats_card_position?: Json | null
          stats_card_collapsed?: boolean
          travel_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stats_card_position?: Json | null
          stats_card_collapsed?: boolean
          travel_preferences?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

