"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChatList } from "@/components/chat-list"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { ConversationWithParticipants } from "@/types/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { fetchUserConversations } from "@/app/actions/fetch-data"

export default function ChatsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await supabase.auth.getSession()

        if (error) throw error

        if (!data.session) {
          // Not authenticated, redirect to login
          router.push("/auth/login")
          return
        }

        setUser(data.session.user)
      } catch (err: any) {
        console.error("Auth check error:", err)
        setError("Authentication error: " + err.message)
        // Still redirect on error
        router.push("/auth/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase.auth])

  // Fetch conversations using server action
  useEffect(() => {
    const loadConversations = async () => {
      if (!user) return

      try {
        setError(null)

        // Use the server action to fetch conversations
        const result = await fetchUserConversations(user.id)

        if (!result.success) {
          setError(result.error || "Failed to load conversations")
          return
        }

        setConversations(result.conversations)
      } catch (err: any) {
        console.error("Error loading conversations:", err)
        setError(err.message || "Failed to load conversations")
      }
    }

    if (user) {
      loadConversations()
    }
  }, [user])

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel("public:messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          // Update conversations when a new message is received
          setConversations((prevConversations) => {
            return prevConversations
              .map((conv) => {
                if (conv.id === payload.new.conversation_id) {
                  return {
                    ...conv,
                    last_message: payload.new,
                    updated_at: new Date().toISOString(),
                    unread_count: payload.new.sender_id !== user.id ? (conv.unread_count || 0) + 1 : conv.unread_count,
                  }
                }
                return conv
              })
              .sort((a, b) => {
                return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
              })
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user, supabase])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-green-500" />
      </div>
    )
  }

  // If not authenticated, this will redirect (see useEffect)
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="mb-4">You need to be logged in to view this page.</p>
          <a href="/auth/login" className="text-green-600 hover:underline">
            Go to login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex w-full max-w-7xl mx-auto overflow-hidden rounded-lg shadow-lg bg-white dark:bg-gray-800">
        {error && (
          <div className="w-full p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {!error && (
          <>
            <ChatList conversations={conversations} currentUserId={user.id} />
            <div className="flex-1 flex items-center justify-center border-l border-gray-200 dark:border-gray-700">
              <div className="text-center p-8">
                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">
                  Select a chat or start a new conversation
                </h3>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
