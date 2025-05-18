"use server"

import { createServerClient } from "@/lib/supabase"

export async function searchUsersByUsername(query: string, currentUserId: string) {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", currentUserId)
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10)

    if (error) throw error

    return { success: true, users: data }
  } catch (error) {
    console.error("Error searching users:", error)
    return { success: false, error: "Failed to search users" }
  }
}

export async function createConversation(currentUserId: string, otherUserId: string) {
  const supabase = createServerClient()
  console.log(`Creating conversation between ${currentUserId} and ${otherUserId}`)

  try {
    // Check if conversation already exists
    const { data: existingParticipants, error: existingError } = await supabase
      .from("participants")
      .select("conversation_id")
      .eq("profile_id", currentUserId)

    if (existingError) {
      console.error("Error checking existing participants:", existingError)
      throw existingError
    }

    const userConversationIds = existingParticipants.map((p) => p.conversation_id)
    console.log(`Found ${userConversationIds.length} existing conversations for current user`)

    if (userConversationIds.length > 0) {
      const { data: otherParticipants, error: otherError } = await supabase
        .from("participants")
        .select("conversation_id")
        .eq("profile_id", otherUserId)
        .in("conversation_id", userConversationIds)

      if (otherError) {
        console.error("Error checking other participants:", otherError)
        throw otherError
      }

      // If conversation exists, return it
      if (otherParticipants.length > 0) {
        console.log(`Found existing conversation: ${otherParticipants[0].conversation_id}`)
        return {
          success: true,
          conversationId: otherParticipants[0].conversation_id,
          isExisting: true,
        }
      }
    }

    // Create new conversation
    console.log("Creating new conversation")
    const { data: newConversation, error: conversationError } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single()

    if (conversationError) {
      console.error("Error creating conversation:", conversationError)
      throw conversationError
    }

    console.log(`New conversation created with ID: ${newConversation.id}`)

    // Add participants
    const participants = [
      { conversation_id: newConversation.id, profile_id: currentUserId },
      { conversation_id: newConversation.id, profile_id: otherUserId },
    ]

    const { error: participantsError } = await supabase.from("participants").insert(participants)

    if (participantsError) {
      console.error("Error adding participants:", participantsError)
      throw participantsError
    }

    console.log("Participants added successfully")
    return {
      success: true,
      conversationId: newConversation.id,
      isExisting: false,
    }
  } catch (error) {
    console.error("Error creating conversation:", error)
    return {
      success: false,
      error: "Failed to create conversation",
    }
  }
}

// New server action for sending messages
export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const supabase = createServerClient()

  try {
    // Verify the sender is a participant in the conversation
    const { data: isParticipant, error: participantError } = await supabase
      .from("participants")
      .select("profile_id")
      .eq("conversation_id", conversationId)
      .eq("profile_id", senderId)
      .maybeSingle()

    if (participantError) {
      console.error("Error checking participant:", participantError)
      return { success: false, error: "Failed to verify access" }
    }

    if (!isParticipant) {
      return { success: false, error: "You don't have access to this conversation" }
    }

    // Insert the message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content,
        status: "sent",
      })
      .select()
      .single()

    if (messageError) {
      console.error("Error sending message:", messageError)
      return { success: false, error: "Failed to send message" }
    }

    // Update the conversation's updated_at timestamp
    await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId)

    // Get the sender profile
    const { data: senderProfile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", senderId)
      .single()

    if (profileError) {
      console.error("Error fetching sender profile:", profileError)
      // We can still return success even if we couldn't fetch the profile
    }

    return {
      success: true,
      message: {
        ...message,
        sender: senderProfile || null,
      },
    }
  } catch (error) {
    console.error("Error in sendMessage:", error)
    return { success: false, error: "Failed to send message" }
  }
}
