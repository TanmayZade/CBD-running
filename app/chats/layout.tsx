import type React from "react"

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Simple layout that just renders children without any authentication logic
  return <>{children}</>
}
