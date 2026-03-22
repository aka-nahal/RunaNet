import { DisplayCanvas } from "@/components/display-canvas"

export const dynamic = "force-dynamic"

export default function HomePage() {
  return (
    <div className="fixed inset-0 bg-black">
      <DisplayCanvas />
    </div>
  )
}
