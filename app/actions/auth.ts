"use server"

import { createServerClient } from "@/lib/supabase"

export async function registerUser(email: string, password: string, username: string, fullName: string) {
  const supabase = createServerClient()

  try {
    // Create the user with admin API (immediately creates the user)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email verification for now
    })

    if (authError) throw authError

    if (!authData.user) {
      throw new Error("Failed to create user")
    }

    // Now create the profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      username,
      full_name: fullName,
    })

    if (profileError) throw profileError

    return { success: true }
  } catch (error: any) {
    console.error("Error in registration:", error)
    return {
      success: false,
      error: error.message || "Registration failed",
    }
  }
}
