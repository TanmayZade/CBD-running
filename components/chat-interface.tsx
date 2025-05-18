"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Paperclip, Send, Smile, MoreVertical, Phone, Video } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import type { ConversationWithParticipants, MessageWithSender } from "@/types/supabase"
import type { User } from "@supabase/supabase-js"
import { ScrollArea } from "@/components/ui/scroll-area"
import { sendMessage } from "@/app/actions/chat"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ChatInterfaceProps {
  conversation: ConversationWithParticipants
  messages: MessageWithSender[]
  currentUser: User | null
}

const checkCyberbullying = async (message: string): Promise<string | null> => {
  try {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      console.warn("API URL not set. Skipping cyberbullying check.");
      return null;
    }

    const response = await fetch(process.env.NEXT_PUBLIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: message }),
    });

    if (!response.ok) {
      console.error("API responded with status", response.status);
      return null;
    }

    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Cyberbullying detection error:', error);
    return null;
  }
};


export function ChatInterface({ conversation, messages, currentUser }: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localMessages, setLocalMessages] = useState<MessageWithSender[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = getSupabaseBrowserClient()

  // Initialize local messages with props
  useEffect(() => {
    setLocalMessages(messages)
  }, [messages])

  useEffect(() => {
    scrollToBottom()
  }, [localMessages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

const handleSendMessage = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!newMessage.trim() || !currentUser || !conversation) return

  setIsSending(true)
  setError(null)

  try {
    // Step 1: Check for cyberbullying
    const result = await checkCyberbullying(newMessage)
    if (result && result.includes("Cyberbullying detected")) {
      // Add warning message locally without sending to backend
const warningMessage: MessageWithSender = {
  id: `warn-${Date.now()}`,
  content:
    '🚨 Cyberbullying detected! Bullying others is a punishable offence. Please reconsider your words. <a href="https://www.childnet.com/" target="_blank" class="underline text-blue-600 dark:text-blue-400">Learn more</a>.',
  created_at: new Date().toISOString(),
  sender_id: "system",
  status: "sent",
  conversation_id: conversation.id,
  sender: {
    id: "system",
    username: "System",
    full_name: "System",
    avatar_url: "/placeholder.svg",
  },
}


      setLocalMessages((prev) => [...prev, warningMessage])
      setNewMessage("")
      setIsSending(false)
      return
    }

    // Step 2: Send message normally
    const resultSend = await sendMessage(conversation.id, currentUser.id, newMessage)

    if (!resultSend.success) {
      setError(resultSend.error || "Failed to send message")
      return
    }

    setNewMessage("")

    if (resultSend.message) {
      const messageExists = localMessages.some((m) => m.id === resultSend.message.id)
      if (!messageExists) {
        setLocalMessages((prev) => [...prev, resultSend.message])
      }
    }
  } catch (error) {
    console.error("Error sending message:", error)
    setError("An unexpected error occurred")
  } finally {
    setIsSending(false)
  }
}


  const getConversationName = () => {
    const otherParticipants = conversation.participants.filter((p) => p.id !== currentUser?.id)

    if (otherParticipants.length === 0) return "No participants"
    if (otherParticipants.length === 1) {
      return otherParticipants[0].full_name || otherParticipants[0].username
    }

    return `${otherParticipants[0].full_name || otherParticipants[0].username} & ${otherParticipants.length - 1} others`
  }

  const getConversationAvatar = () => {
    const otherParticipants = conversation.participants.filter((p) => p.id !== currentUser?.id)
    if (otherParticipants.length === 0) return "/placeholder.svg?height=40&width=40"
    return otherParticipants[0].avatar_url || "/placeholder.svg?height=40&width=40"
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!currentUser || !conversation) return

    const subscription = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
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

            // Check if the message is already in our local state
            const messageExists = localMessages.some((m) => m.id === newMessage.id)
            if (!messageExists) {
              setLocalMessages((prev) => [...prev, newMessage])
            }

            // Mark message as read if from someone else
            if (payload.new.sender_id !== currentUser.id) {
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
  }, [currentUser, conversation, supabase, localMessages])

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-3 bg-gray-50 dark:bg-gray-800 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Avatar className="h-10 w-10">
            <img src={getConversationAvatar() || "/placeholder.svg"} alt={getConversationName()} />
          </Avatar>
          <div className="ml-3">
            <div className="font-medium">{getConversationName()}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {conversation.participants.length > 2 ? `${conversation.participants.length} participants` : "Online"}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {localMessages.length > 0 ? (
            localMessages.map((message) => (
              <div
                key={message.id}
                className={`flex mb-4 ${message.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}
              >
                {message.sender_id !== currentUser?.id && (
                  <Avatar className="h-8 w-8 mr-2 mt-1">
                    <img
                      src={message.sender?.avatar_url || "/placeholder.svg?height=32&width=32"}
                      alt={message.sender?.username || "User"}
                    />
                  </Avatar>
                )}
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.sender_id === currentUser?.id
                      ? "bg-green-500 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {conversation.participants.length > 2 && message.sender_id !== currentUser?.id && (
                    <div className="text-xs font-medium mb-1">
                      {message.sender?.full_name || message.sender?.username || "Unknown"}
                    </div>
                  )}
                  <div
  dangerouslySetInnerHTML={{ __html: message.content }}
  className={message.sender_id === "system" ? (
  <div className="w-full">
    <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 text-sm rounded-md p-3 mb-4" dangerouslySetInnerHTML={{ __html: message.content }} />
  </div>
) : (
  <div className={`flex mb-4 ${message.sender_id === currentUser?.id ? "justify-end" : "justify-start"}`}>
    {/* existing user message rendering */}
  </div>
)}

></div>

                  <div className="text-xs mt-1 flex justify-end items-center">
                    {formatTime(message.created_at)}
                    {message.sender_id === currentUser?.id && (
                      <span className="ml-1">
                        {message.status === "sent" && "✓"}
                        {message.status === "delivered" && "✓✓"}
                        {message.status === "read" && <span className="text-blue-400 dark:text-blue-300">✓✓</span>}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
                <Avatar className="h-16 w-16">
                  <img src={getConversationAvatar() || "/placeholder.svg"} alt={getConversationName()} />
                </Avatar>
              </div>
              <h3 className="text-xl font-medium mb-2">{getConversationName()}</h3>
              <p className="text-gray-500 mb-4">This is the beginning of your conversation.</p>
              <p className="text-gray-500">Send a message to start chatting!</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center"
      >
        <Button variant="ghost" size="icon" type="button">
          <Smile className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" type="button">
          <Paperclip className="h-5 w-5" />
        </Button>
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
          className="mx-2"
          disabled={isSending}
        />
        <Button
          type="submit"
          size="icon"
          className="bg-green-500 hover:bg-green-600"
          disabled={isSending || !newMessage.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  )
}
