import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      return NextResponse.json({ authenticated: false, error: error.message }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: !!data.session,
      user: data.session?.user
        ? {
            id: data.session.user.id,
            email: data.session.user.email,
          }
        : null,
    })
  } catch (error: any) {
    console.error("Auth check error:", error)
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 })
  }
}
