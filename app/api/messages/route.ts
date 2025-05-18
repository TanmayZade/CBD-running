import { NextResponse } from "next/server"

// In a real application, this would connect to a database
// and handle real-time messaging with WebSockets or Server-Sent Events

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const chatId = searchParams.get("chatId")

  // Mock data - in a real app, this would come from a database
  const messages = {
    "1": [
      { id: "1", text: "Hey, how are you?", sender: "other", time: "10:30 AM", status: "read" },
      { id: "2", text: "I'm good, thanks! How about you?", sender: "me", time: "10:31 AM", status: "read" },
      {
        id: "3",
        text: "Doing well. Do you want to grab lunch later?",
        sender: "other",
        time: "10:32 AM",
        status: "read",
      },
    ],
    "2": [
      { id: "1", text: "Can we meet tomorrow?", sender: "other", time: "Yesterday", status: "read" },
      { id: "2", text: "Sure, what time works for you?", sender: "me", time: "Yesterday", status: "read" },
    ],
    "3": [
      {
        id: "1",
        text: "The project is going well!",
        sender: "other",
        time: "Yesterday",
        status: "read",
        senderName: "Alice",
      },
      { id: "2", text: "Great job everyone!", sender: "other", time: "Yesterday", status: "read", senderName: "Bob" },
      { id: "3", text: "Thanks! I'll finish my part by tomorrow.", sender: "me", time: "Yesterday", status: "read" },
    ],
  }

  if (!chatId || !messages[chatId as keyof typeof messages]) {
    return NextResponse.json({ error: "Chat not found" }, { status: 404 })
  }

  return NextResponse.json({ messages: messages[chatId as keyof typeof messages] })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { chatId, message } = body

  if (!chatId || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // In a real app, this would save to a database and notify other users

  return NextResponse.json({
    success: true,
    message: {
      id: Date.now().toString(),
      text: message,
      sender: "me",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    },
  })
}
