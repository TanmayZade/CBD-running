"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"

export default function AuthErrorPage() {
  // Log the error for debugging
  useEffect(() => {
    console.log("Auth error page loaded - handling authentication error")
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4 text-red-500">
            <AlertCircle className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Authentication Error</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">
            There was a problem with your authentication session. This could be due to an expired session or
            configuration issues.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full bg-green-600 hover:bg-green-700">
            <a href="/auth/login">Return to Login</a>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <a href="/auth-reset">Reset Authentication State</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
