import { rectToGridPlacement } from "@/lib/grid-engine"
import type { DisplayBundle, DisplayTileDTO } from "@/lib/display-types"
import { serverApiUrl } from "@/lib/server-api-base"
import { ClockWidget } from "@/components/clock-widget"

async function fetchBundle(): Promise<DisplayBundle> {
  const url = serverApiUrl("/api/display/bundle")
  const timeoutMs = 8_000
  const signal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? AbortSignal.timeout(timeoutMs)
      : undefined

  const res = await fetch(url, {
    cache: "no-store",
    next: { revalidate: 0 },
    signal
  })
  if (!res.ok) throw new Error(`bundle ${res.status}`)
  return res.json()
}

function WidgetContent({ type }: { type: string }) {
  if (type === "clock")
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <ClockWidget />
      </div>
    )
  if (type === "ticker")
    return (
      <div className="flex h-full items-center overflow-hidden">
        <p className="animate-marquee whitespace-nowrap text-sm font-medium text-amber-300">
          Welcome to the Smart Notice Board &nbsp;&#x2022;&nbsp; Stay updated with the latest announcements
          &nbsp;&#x2022;&nbsp; Have a great day!
        </p>
      </div>
    )
  if (type === "banner")
    return (
      <div className="flex h-full items-center justify-center bg-gradient-to-r from-sky-600/30 to-indigo-600/30 px-6">
        <p className="text-center text-lg font-semibold text-white/90">
          Smart Notice Board &mdash; AI-Powered Campus Display System
        </p>
      </div>
    )
  return <p className="text-sm text-zinc-500">Widget: {type}</p>
}

function TileCard({ item }: { item: DisplayTileDTO }) {
  const { tile, notice, is_visible_by_schedule } = item
  const { gridRow, gridColumn } = rectToGridPlacement({
    x: tile.grid_x,
    y: tile.grid_y,
    w: tile.grid_w,
    h: tile.grid_h
  })
  const hidden = !is_visible_by_schedule
  const isWidget = ["clock", "ticker", "banner", "weather"].includes(tile.tile_type)
  const priorityColor =
    notice && notice.priority >= 70
      ? "border-red-500/40"
      : notice && notice.priority >= 50
        ? "border-amber-500/30"
        : "border-white/10"

  return (
    <article
      className={`relative overflow-hidden rounded-xl border bg-zinc-900/90 shadow-lg backdrop-blur-sm transition-opacity duration-300 ${priorityColor} ${
        hidden ? "opacity-20" : "opacity-100"
      } ${isWidget ? "p-0" : "p-4"}`}
      style={{ gridRow, gridColumn, zIndex: tile.z_index }}
    >
      {isWidget ? (
        <WidgetContent type={tile.tile_type} />
      ) : (
        <>
          <div className="mb-1 flex items-center gap-2">
            {notice && notice.category && (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                {notice.category}
              </span>
            )}
            <span className="text-[10px] uppercase tracking-wider text-zinc-600">{tile.tile_type}</span>
          </div>
          {notice ? (
            <>
              <h2 className="text-balance text-base font-semibold leading-snug text-white">{notice.title}</h2>
              <p className="mt-2 line-clamp-6 text-sm leading-relaxed text-zinc-300">
                {notice.summary ?? notice.body}
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-500">Empty tile</p>
          )}
        </>
      )}
    </article>
  )
}

export async function DisplayCanvas() {
  let bundle: DisplayBundle
  try {
    bundle = await fetchBundle()
  } catch {
    return (
      <div className="flex h-full items-center justify-center text-zinc-500">
        Cannot load display bundle — start FastAPI on :8000 or set API_URL in .env.local
      </div>
    )
  }

  if (bundle.layout_version_id === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-400">
        <p>No published layout.</p>
        <p className="text-sm text-zinc-600">POST /api/layouts, add tiles, then publish a version.</p>
      </div>
    )
  }

  const tiles = [...bundle.tiles].sort(
    (a, b) => a.tile.z_index - b.tile.z_index || a.tile.id - b.tile.id
  )

  return (
    <div
      className="grid h-full w-full bg-zinc-950 p-2"
      style={{
        gridTemplateColumns: `repeat(${bundle.grid_cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${bundle.grid_rows}, minmax(0, 1fr))`,
        gap: bundle.gap_px
      }}
    >
      {tiles.map((item) => (
        <TileCard key={item.tile.id} item={item} />
      ))}
    </div>
  )
}
