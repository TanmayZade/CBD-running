"use server"

import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase"

export async function serverLogin(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  console.log("Server login attempt for:", email)

  const cookieStore = cookies()
  const supabase = createServerClient()

  try {
    // Attempt to sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Server login error:", error)
      return { success: false, error: error.message }
    }

    if (!data.session) {
      console.error("No session returned from Supabase")
      return { success: false, error: "Authentication successful but no session was created" }
    }

    // Set auth cookie manually
    const expiresIn = 60 * 60 * 24 * 7 // 1 week
    cookieStore.set("sb-auth-token", data.session.access_token, {
      path: "/",
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })

    console.log("Server login successful, session created")
    return {
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    }
  } catch (error: any) {
    console.error("Unexpected error in server login:", error)
    return { success: false, error: error.message || "An unexpected error occurred" }
  }
}

export async function serverLogout() {
  const cookieStore = cookies()
  const supabase = createServerClient()

  try {
    await supabase.auth.signOut()

    // Clear auth cookie manually
    cookieStore.delete("sb-auth-token")

    return { success: true }
  } catch (error: any) {
    console.error("Error in server logout:", error)
    return { success: false, error: error.message }
  }
}

export async function getServerSession() {
  const supabase = createServerClient()

  try {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting server session:", error)
      return { success: false, error: error.message }
    }

    // If no session, return success: false but don't treat it as an error
    if (!data.session) {
      return { success: false, user: null }
    }

    return {
      success: true,
      session: data.session,
      user: data.session?.user || null,
    }
  } catch (error: any) {
    console.error("Unexpected error getting server session:", error)
    return { success: false, error: error.message }
  }
}
