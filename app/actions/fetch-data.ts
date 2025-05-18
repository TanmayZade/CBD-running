"use server"

import { createServerClient } from "@/lib/supabase"

// Fetch all conversations for a user using service role to bypass RLS
export async function fetchUserConversations(userId: string) {
  const supabase = createServerClient()

  try {
    // Get all conversation IDs where the user is a participant
    const { data: userParticipations, error: participationsError } = await supabase
      .from("participants")
      .select("conversation_id")
      .eq("profile_id", userId)

    if (participationsError) {
      console.error("Error fetching user participations:", participationsError)
      return { success: false, error: "Failed to fetch conversations" }
    }

    if (!userParticipations.length) {
      return { success: true, conversations: [] }
    }

    const conversationIds = userParticipations.map((p) => p.conversation_id)

    // Get all conversations
    const { data: conversationsData, error: conversationsError } = await supabase
      .from("conversations")
      .select("*")
      .in("id", conversationIds)
      .order("updated_at", { ascending: false })

    if (conversationsError) {
      console.error("Error fetching conversations:", conversationsError)
      return { success: false, error: "Failed to fetch conversations" }
    }

    // Process each conversation
    const conversationsWithDetails = await Promise.all(
      conversationsData.map(async (conversation) => {
        // Get participants
        const { data: participantIds, error: participantsError } = await supabase
          .from("participants")
          .select("profile_id")
          .eq("conversation_id", conversation.id)

        if (participantsError) {
          console.error("Error fetching participants:", participantsError)
          throw participantsError
        }

        // Get profiles
        const profileIds = participantIds.map((p) => p.profile_id)
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", profileIds)

        if (profilesError) {
          console.error("Error fetching profiles:", profilesError)
          throw profilesError
        }

        // Get last message
        const { data: lastMessageData, error: lastMessageError } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: false })
          .limit(1)

        if (lastMessageError && lastMessageError.code !== "PGRST116") {
          console.error("Error fetching last message:", lastMessageError)
          throw lastMessageError
        }

        // Get unread count
        const { data: unreadData, error: unreadError } = await supabase
          .from("messages")
          .select("id", { count: "exact" })
          .eq("conversation_id", conversation.id)
          .neq("sender_id", userId)
          .eq("status", "sent")

        if (unreadError) {
          console.error("Error fetching unread count:", unreadError)
          throw unreadError
        }

        return {
          ...conversation,
          participants: profiles,
          last_message: lastMessageData[0] || null,
          unread_count: unreadData.length,
        }
      }),
    )

    return { success: true, conversations: conversationsWithDetails }
  } catch (error) {
    console.error("Error in fetchUserConversations:", error)
    return { success: false, error: "Failed to fetch conversations" }
  }
}

// Fetch a single conversation with messages
export async function fetchConversationWithMessages(conversationId: string, userId: string) {
  const supabase = createServerClient()

  try {
    // Check if user is a participant
    const { data: isParticipant, error: participantError } = await supabase
      .from("participants")
      .select("profile_id")
      .eq("conversation_id", conversationId)
      .eq("profile_id", userId)
      .maybeSingle()

    if (participantError) {
      console.error("Error checking participant:", participantError)
      return { success: false, error: "Failed to verify access" }
    }

    // If user is not a participant, return error
    if (!isParticipant) {
      return { success: false, error: "You don't have access to this conversation" }
    }

    // Get conversation details
    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single()

    if (conversationError) {
      console.error("Error fetching conversation:", conversationError)
      return { success: false, error: "Failed to fetch conversation" }
    }

    // Get participants
    const { data: participantIds, error: participantsError } = await supabase
      .from("participants")
      .select("profile_id")
      .eq("conversation_id", conversationId)

    if (participantsError) {
      console.error("Error fetching participants:", participantsError)
      return { success: false, error: "Failed to fetch participants" }
    }

    // Get profiles
    const profileIds = participantIds.map((p) => p.profile_id)
    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*").in("id", profileIds)

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
      return { success: false, error: "Failed to fetch profiles" }
    }

    // Get messages
    const { data: messagesData, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (messagesError) {
      console.error("Error fetching messages:", messagesError)
      return { success: false, error: "Failed to fetch messages" }
    }

    // Mark messages as read
    await supabase
      .from("messages")
      .update({ status: "read" })
      .eq("conversation_id", conversationId)
      .neq("sender_id", userId)
      .eq("status", "sent")

    // Create a map of profiles for easy lookup
    const profileMap = new Map()
    profiles.forEach((profile) => {
      profileMap.set(profile.id, profile)
    })

    // Combine messages with sender profiles
    const messagesWithSenders = messagesData.map((message) => ({
      ...message,
      sender: profileMap.get(message.sender_id) || {
        id: message.sender_id,
        username: "Unknown",
        full_name: null,
        avatar_url: null,
        status: "",
        created_at: "",
        updated_at: "",
      },
    }))

    // Create the conversation with participants
    const conversationWithParticipants = {
      ...conversation,
      participants: profiles,
      last_message: messagesData[messagesData.length - 1] || null,
      unread_count: 0,
    }

    return {
      success: true,
      conversation: conversationWithParticipants,
      messages: messagesWithSenders,
    }
  } catch (error) {
    console.error("Error in fetchConversationWithMessages:", error)
    return { success: false, error: "Failed to fetch conversation data" }
  }
}
