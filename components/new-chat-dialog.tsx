"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { searchUsersByUsername, createConversation } from "@/app/actions/chat"
import type { Profile } from "@/types/supabase"

interface NewChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId: string
}

export function NewChatDialog({ open, onOpenChange, currentUserId }: NewChatDialogProps) {
  const [username, setUsername] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSearch = async () => {
    if (!username.trim()) return

    setIsSearching(true)
    setError(null)

    try {
      const result = await searchUsersByUsername(username, currentUserId)

      if (!result.success) {
        setError(result.error || "Failed to search users")
        return
      }

      setSearchResults(result.users || [])
    } catch (error) {
      console.error("Error searching users:", error)
      setError("An error occurred while searching for users")
    } finally {
      setIsSearching(false)
    }
  }

  const handleStartConversation = async (userId: string) => {
    setIsCreating(true)
    setError(null)

    try {
      console.log("Creating conversation with user:", userId)
      const result = await createConversation(currentUserId, userId)
      console.log("Conversation creation result:", result)

      if (!result.success) {
        setError(result.error || "Failed to create conversation")
        return
      }

      // Close dialog
      onOpenChange(false)

      // Add a small delay to ensure the dialog closes properly before navigation
      setTimeout(() => {
        // Force a hard navigation to the conversation
        window.location.href = `/chats/${result.conversationId}`

        // Alternatively, you can use router.push with a refresh
        // router.push(`/chats/${result.conversationId}`);
        // router.refresh();
      }, 100)
    } catch (error) {
      console.error("Error creating conversation:", error)
      setError("An error occurred while creating the conversation")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a New Chat</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Search by Username or Name</Label>
            <div className="flex space-x-2">
              <Input
                id="username"
                placeholder="Enter username or name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching || !username.trim()}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {isSearching ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-green-500" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                    onClick={() => handleStartConversation(user.id)}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <img src={user.avatar_url || "/placeholder.svg?height=40&width=40"} alt={user.username} />
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.full_name || user.username}</div>
                      <div className="text-sm text-gray-500">@{user.username}</div>
                    </div>
                    {isCreating && <Loader2 className="h-4 w-4 animate-spin ml-auto text-green-500" />}
                  </div>
                ))}
              </div>
            ) : username.trim() ? (
              <div className="text-center py-4 text-gray-500">No users found</div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
