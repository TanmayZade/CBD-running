"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true)
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          // User is authenticated, redirect to chats
          router.push("/chats")
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase.auth])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-green-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Chat App</h1>
        <p className="text-lg mb-8">A real-time messaging application</p>
        <div className="flex gap-4 justify-center">
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <a href="/auth/login">Login</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/auth/register">Register</a>
          </Button>
        </div>
      </div>
    </div>
  )
}
