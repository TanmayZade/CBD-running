import { ChatInterface } from "@/components/chat-interface"
import { ChatList } from "@/components/chat-list"
export default function ChatPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex w-full max-w-7xl mx-auto overflow-hidden rounded-lg shadow-lg bg-white dark:bg-gray-800">
        <ChatList activeId={params.id} />
        <ChatInterface chatId={params.id} />
      </div>
    </div>
  )
}
