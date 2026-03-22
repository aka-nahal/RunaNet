"use client"

import { useEffect, useState } from "react"

export function ClockWidget() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!now) return null

  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  const date = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric", year: "numeric" })

  return (
    <>
      <p className="text-3xl font-bold tabular-nums tracking-tight text-white">{time}</p>
      <p className="mt-1 text-sm text-zinc-400">{date}</p>
    </>
  )
}
