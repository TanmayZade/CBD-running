"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Settings, LogOut, UserPlus } from "lucide-react"
import type { ConversationWithParticipants } from "@/types/supabase"
import { NewChatDialog } from "@/components/new-chat-dialog"
import { getSupabaseBrowserClient } from "@/lib/supabase"

interface ChatListProps {
  conversations?: ConversationWithParticipants[]
  activeId?: string
  currentUserId: string
}

export function ChatList({ conversations = [], activeId, currentUserId }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewChatOpen, setIsNewChatOpen] = useState(false)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Add this function to refresh the conversation list
  const refreshConversations = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  const filteredConversations = conversations.filter((conv) => {
    const otherParticipants = conv.participants.filter((p) => p.id !== currentUserId)
    return otherParticipants.some(
      (p) =>
        p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.full_name && p.full_name.toLowerCase().includes(searchQuery.toLowerCase())),
    )
  })

  const handleChatClick = (id: string) => {
    router.push(`/chats/${id}`)
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      window.location.href = "/auth/login"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const getConversationName = (conversation: ConversationWithParticipants) => {
    const otherParticipants = conversation.participants.filter((p) => p.id !== currentUserId)

    if (otherParticipants.length === 0) return "No participants"
    if (otherParticipants.length === 1) {
      return otherParticipants[0].full_name || otherParticipants[0].username
    }

    return `${otherParticipants[0].full_name || otherParticipants[0].username} & ${otherParticipants.length - 1} others`
  }

  const getLastMessagePreview = (conversation: ConversationWithParticipants) => {
    if (!conversation.last_message) return "No messages yet"

    const sender = conversation.participants.find((p) => p.id === conversation.last_message?.sender_id)
    const isCurrentUser = sender?.id === currentUserId
    const senderName = isCurrentUser ? "You" : sender?.username || "Unknown"

    return `${senderName}: ${conversation.last_message.content}`
  }

  const getConversationAvatar = (conversation: ConversationWithParticipants) => {
    const otherParticipants = conversation.participants.filter((p) => p.id !== currentUserId)
    if (otherParticipants.length === 0) return "/placeholder.svg?height=40&width=40"
    return otherParticipants[0].avatar_url || "/placeholder.svg?height=40&width=40"
  }

  const getLastMessageTime = (conversation: ConversationWithParticipants) => {
    if (!conversation.last_message) return ""

    const date = new Date(conversation.last_message.created_at)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffDays === 1) {
      return "Yesterday"
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  return (
    <>
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Avatar>
              <img src="/placeholder.svg?height=40&width=40" alt="User" />
            </Avatar>
            <span className="font-medium">Chat App</span>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsNewChatOpen(true)}>
              <UserPlus className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search conversations"
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-center p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  activeId === conversation.id ? "bg-gray-100 dark:bg-gray-700" : ""
                }`}
                onClick={() => handleChatClick(conversation.id)}
              >
                <Avatar className="h-12 w-12">
                  <img src={getConversationAvatar(conversation) || "/placeholder.svg"} alt="Chat" />
                </Avatar>
                <div className="ml-3 flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{getConversationName(conversation)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{getLastMessageTime(conversation)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {getLastMessagePreview(conversation)}
                    </p>
                    {conversation.unread_count ? (
                      <span className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {conversation.unread_count}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center text-gray-500">
              <p>No conversations found</p>
              <Button variant="link" className="text-green-600 mt-2" onClick={() => setIsNewChatOpen(true)}>
                Start a new conversation
              </Button>
            </div>
          )}
        </div>
      </div>

      {currentUserId && (
        <NewChatDialog
          open={isNewChatOpen}
          onOpenChange={(open) => {
            setIsNewChatOpen(open)
            if (!open) {
              // Refresh conversations when dialog closes
              refreshConversations()
            }
          }}
          currentUserId={currentUserId}
        />
      )}
    </>
  )
}
