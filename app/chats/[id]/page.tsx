"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ChatList } from "@/components/chat-list"
import { ChatInterface } from "@/components/chat-interface"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { ConversationWithParticipants, MessageWithSender } from "@/types/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { fetchUserConversations, fetchConversationWithMessages } from "@/app/actions/fetch-data"

export default function ChatPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [conversations, setConversations] = useState<ConversationWithParticipants[]>([])
  const [currentConversation, setCurrentConversation] = useState<ConversationWithParticipants | null>(null)
  const [messages, setMessages] = useState<MessageWithSender[]>([])
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

  // Fetch data using server actions
  useEffect(() => {
    const loadData = async () => {
      if (!user || !params.id) return

      try {
        setIsLoading(true)
        setError(null)

        // Fetch all conversations for the sidebar
        const conversationsResult = await fetchUserConversations(user.id)

        if (!conversationsResult.success) {
          setError(conversationsResult.error || "Failed to load conversations")
          return
        }

        setConversations(conversationsResult.conversations)

        // Fetch the current conversation with messages
        const conversationResult = await fetchConversationWithMessages(params.id, user.id)

        if (!conversationResult.success) {
          setError(conversationResult.error || "Failed to load conversation")
          return
        }

        setCurrentConversation(conversationResult.conversation)
        setMessages(conversationResult.messages)
      } catch (err: any) {
        console.error("Error loading data:", err)
        setError(err.message || "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user, params.id])

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!user || !params.id) return

    const subscription = supabase
      .channel(`messages:${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${params.id}`,
        },
        async (payload) => {
          try {
            // Get the sender profile directly
            const { data: senderProfile, error: profileError } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", payload.new.sender_id)
              .single()

            if (profileError) {
              console.error("Error fetching sender profile:", profileError)
              throw profileError
            }

            // Add new message to the list
            const newMessage: MessageWithSender = {
              ...payload.new,
              sender: senderProfile,
            }

            setMessages((prev) => [...prev, newMessage])

            // Mark message as read if from someone else
            if (payload.new.sender_id !== user.id) {
              await supabase.from("messages").update({ status: "read" }).eq("id", payload.new.id)
            }
          } catch (error) {
            console.error("Error processing new message:", error)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user, params.id, supabase])

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
        {error ? (
          <div className="w-full p-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <>
            <ChatList conversations={conversations} activeId={params.id} currentUserId={user.id} />
            {currentConversation ? (
              <ChatInterface conversation={currentConversation} messages={messages} currentUser={user} />
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8">
                  <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300">Conversation not found</h3>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
