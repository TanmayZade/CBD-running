"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { getSupabaseBrowserClient } from "@/lib/supabase"
import { Loader2 } from "lucide-react"

export default function AuthResetPage() {
  const [status, setStatus] = useState("Checking authentication state...")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    const resetAuth = async () => {
      try {
        // Check current session
        const { data } = await supabase.auth.getSession()

        if (data.session) {
          setStatus("Signing out...")
          await supabase.auth.signOut()
          setStatus("Signed out successfully")
        } else {
          setStatus("No active session found")
        }

        // Clear local storage
        if (typeof window !== "undefined") {
          setStatus("Clearing local storage...")
          localStorage.clear()
          setStatus("Authentication state has been reset")
        }
      } catch (error) {
        console.error("Error resetting auth:", error)
        setStatus("Error resetting authentication state")
      } finally {
        setIsLoading(false)
      }
    }

    resetAuth()
  }, [supabase.auth])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Authentication Reset</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          {isLoading ? (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              <p>{status}</p>
            </div>
          ) : (
            <p className="mb-4">{status}</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-center space-x-4">
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <a href="/auth/login">Go to Login</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/">Go to Home</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
