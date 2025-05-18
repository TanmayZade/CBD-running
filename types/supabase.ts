export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          conversation_id: string
          profile_id: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          profile_id: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          profile_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          status?: string
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"]
export type Participant = Database["public"]["Tables"]["participants"]["Row"]
export type Message = Database["public"]["Tables"]["messages"]["Row"]

export interface ConversationWithParticipants extends Conversation {
  participants: Profile[]
  last_message?: Message
  unread_count?: number
}

export interface MessageWithSender extends Message {
  sender: Profile
}
