import { Suspense } from "react"
import { LayoutBuilder } from "@/components/builder/layout-builder"

export default function BuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-400" />
      </div>
    }>
      <LayoutBuilder />
    </Suspense>
  )
}
