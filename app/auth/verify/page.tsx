"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import Link from "next/link"

export default function VerifyPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Check your email</CardTitle>
          <CardDescription className="text-center">
            We've sent you a verification link to your email address.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4">Please check your email and click the verification link to complete your registration.</p>
          <p className="text-sm text-gray-500">
            Already verified?{" "}
            <Link href="/auth/login" className="text-green-600 hover:text-green-500">
              Login here
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
