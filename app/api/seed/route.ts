import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const supabase = createServerClient()

    // Create test users
    const testUsers = [
      { email: "user1@example.com", password: "password123", username: "user1", full_name: "User One" },
      { email: "user2@example.com", password: "password123", username: "user2", full_name: "User Two" },
      { email: "user3@example.com", password: "password123", username: "user3", full_name: "User Three" },
      { email: "john@example.com", password: "password123", username: "john", full_name: "John Doe" },
      { email: "jane@example.com", password: "password123", username: "jane", full_name: "Jane Smith" },
      { email: "alice@example.com", password: "password123", username: "alice", full_name: "Alice Johnson" },
      { email: "bob@example.com", password: "password123", username: "bob", full_name: "Bob Williams" },
    ]

    const createdUsers = []

    for (const user of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", user.username)
        .limit(1)

      if (existingUsers && existingUsers.length > 0) {
        console.log(`User ${user.username} already exists, skipping...`)
        continue
      }

      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      })

      if (authError) {
        console.error("Error creating auth user:", authError)
        continue
      }

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authUser.user.id,
        username: user.username,
        full_name: user.full_name,
      })

      if (profileError) {
        console.error("Error creating profile:", profileError)
        continue
      }

      createdUsers.push(authUser.user)
    }

    // Create conversations between users
    if (createdUsers.length >= 2) {
      // Create conversation between user1 and user2
      const { data: conversation1, error: convError1 } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single()

      if (convError1) {
        console.error("Error creating conversation:", convError1)
      } else {
        // Add participants
        await supabase.from("participants").insert([
          { conversation_id: conversation1.id, profile_id: createdUsers[0].id },
          { conversation_id: conversation1.id, profile_id: createdUsers[1].id },
        ])

        // Add messages
        await supabase.from("messages").insert([
          {
            conversation_id: conversation1.id,
            sender_id: createdUsers[0].id,
            content: "Hey there! How are you?",
            status: "read",
          },
          {
            conversation_id: conversation1.id,
            sender_id: createdUsers[1].id,
            content: "I'm good, thanks! How about you?",
            status: "read",
          },
          {
            conversation_id: conversation1.id,
            sender_id: createdUsers[0].id,
            content: "Doing well. Just testing out this new chat app!",
            status: "read",
          },
        ])
      }

      // Create group conversation with all users
      const { data: conversation2, error: convError2 } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single()

      if (convError2) {
        console.error("Error creating group conversation:", convError2)
      } else {
        // Add participants
        const participants = createdUsers.map((user) => ({
          conversation_id: conversation2.id,
          profile_id: user.id,
        }))

        await supabase.from("participants").insert(participants)

        // Add messages
        await supabase.from("messages").insert([
          {
            conversation_id: conversation2.id,
            sender_id: createdUsers[0].id,
            content: "Welcome to the group chat everyone!",
            status: "read",
          },
          {
            conversation_id: conversation2.id,
            sender_id: createdUsers[1].id,
            content: "Hey all! Excited to be here.",
            status: "read",
          },
          {
            conversation_id: conversation2.id,
            sender_id: createdUsers[2].id,
            content: "This chat app looks great!",
            status: "read",
          },
        ])
      }
    }

    return NextResponse.json({
      success: true,
      message: "Seed data created successfully",
      users: testUsers,
    })
  } catch (error) {
    console.error("Error in seed route:", error)
    return NextResponse.json({ success: false, error: "Failed to seed data" }, { status: 500 })
  }
}
