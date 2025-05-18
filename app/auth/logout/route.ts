import { NextResponse } from "next/server"
import { serverLogout } from "@/app/actions/auth-actions"

export async function GET() {
  const result = await serverLogout()

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.redirect(new URL("/auth/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
}
