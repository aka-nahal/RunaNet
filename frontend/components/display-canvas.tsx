"use client"

import { useCallback, useEffect, useState } from "react"
import { rectToGridPlacement } from "@/lib/grid-engine"
import type { DisplayBundle, DisplayTileDTO, TileConfig } from "@/lib/types"
import { ClockWidget } from "@/components/clock-widget"
import { WeatherWidget } from "@/components/weather-widget"
import { CarouselDisplay, parseSlides } from "@/components/carousel-widget"
import { MediaImage } from "@/components/media-image"

const DEFAULT_REFRESH_MS = 30_000

function parseTileConfig(raw: string | null): TileConfig {
  if (!raw || raw === "{}") return {}
  try { return JSON.parse(raw) } catch { return {} }
}

function tileSizeClass(w: number, h: number): "xs" | "sm" | "md" | "lg" | "xl" {
  const area = w * h
  if (area <= 2) return "xs"
  if (area <= 4) return "sm"
  if (area <= 9) return "md"
  if (area <= 16) return "lg"
  return "xl"
}

function WidgetContent({ type, tileW, tileH, config }: { type: string; tileW: number; tileH: number; config: TileConfig }) {
  const size = tileSizeClass(tileW, tileH)

  if (type === "clock")
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <ClockWidget />
      </div>
    )
  if (type === "ticker") {
    const text = config.tickerText || "Welcome to the Smart Notice Board \u2022 Stay updated with the latest announcements \u2022 Have a great day!"
    return (
      <div className="flex h-full items-center overflow-hidden">
        <p className="animate-marquee whitespace-nowrap text-sm font-medium text-amber-300">
          {text}
        </p>
      </div>
    )
  }
  if (type === "banner") {
    const title = config.bannerTitle || "Smart Notice Board"
    const subtitle = config.bannerSubtitle
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gradient-to-r from-sky-600/30 to-indigo-600/30 px-6 gap-1">
        <p className={`text-center font-semibold text-white/90 ${
          size === "xl" ? "text-2xl" : size === "lg" ? "text-xl" : size === "md" ? "text-lg" : "text-base"
        }`}>
          {title}
        </p>
        {subtitle && (
          <p className={`text-center text-white/60 ${size === "xl" || size === "lg" ? "text-sm" : "text-xs"}`}>
            {subtitle}
          </p>
        )}
      </div>
    )
  }
  if (type === "weather") {
    return (
      <WeatherWidget
        city={config.weatherCity || "London"}
        units={config.weatherUnits || "metric"}
        showForecast={config.weatherShowForecast !== "false" && config.weatherShowForecast !== false}
      />
    )
  }
  if (type === "carousel") {
    const slides = parseSlides(config.carouselSlides)
    return (
      <CarouselDisplay
        slides={slides}
        interval={config.carouselInterval || 5}
        transition={(config.carouselTransition as "fade" | "slide" | "none") || "fade"}
        showDots={config.carouselShowDots !== "false" && config.carouselShowDots !== false}
        showArrows={config.carouselShowArrows === "true" || config.carouselShowArrows === true}
        autoplay={config.carouselAutoplay !== "false" && config.carouselAutoplay !== false}
      />
    )
  }
  if (type === "image" && config.imageUrl) {
    return (
      <MediaImage src={config.imageUrl} alt={config.imageAlt} className="absolute inset-0 h-full w-full object-cover" />
    )
  }
  if (type === "video") {
    const videoUrl = config.videoUrl as string | undefined
    if (!videoUrl) return <p className="text-sm text-zinc-500">No video configured</p>

    // Check for YouTube
    const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/)
    const ytId = ytMatch?.[1] ?? null

    if (ytId) {
      const autoplay = config.videoAutoplay !== "false"
      const loop = config.videoLoop !== "false"
      const params = new URLSearchParams({
        autoplay: autoplay ? "1" : "0",
        mute: "1",
        loop: loop ? "1" : "0",
        playlist: ytId,
        controls: config.videoControls ? "1" : "0",
        modestbranding: "1",
        rel: "0",
      })
      return (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${ytId}?${params}`}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
          frameBorder="0"
        />
      )
    }

    return (
      <video
        src={videoUrl}
        poster={config.videoPoster as string | undefined}
        autoPlay={config.videoAutoplay !== "false"}
        loop={config.videoLoop !== "false"}
        muted
        playsInline
        controls={!!config.videoControls}
        className="absolute inset-0 h-full w-full object-cover"
      />
    )
  }
  return <p className="text-sm text-zinc-500">Widget: {type}</p>
}

function NoticeContent({
  notice, tile, config, hasMedia,
}: {
  notice: DisplayTileDTO["notice"]; tile: DisplayTileDTO["tile"]; config: TileConfig; hasMedia: boolean
}) {
  if (!notice)
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-500">Empty tile</p>
      </div>
    )

  const size = tileSizeClass(tile.grid_w, tile.grid_h)
  const titleCls =
    size === "xl" ? "text-xl" : size === "lg" ? "text-lg" : size === "md" ? "text-base" : "text-sm"
  const bodyCls =
    size === "xl" ? "text-base line-clamp-[12]" :
    size === "lg" ? "text-sm line-clamp-8" :
    size === "md" ? "text-sm line-clamp-5" :
    size === "sm" ? "text-xs line-clamp-3" : "text-xs line-clamp-2"

  const titleStyle: React.CSSProperties = {
    ...(config.fontFamily && { fontFamily: config.fontFamily }),
    ...(config.titleSize && { fontSize: config.titleSize }),
  }
  const bodyStyle: React.CSSProperties = {
    ...(config.fontFamily && { fontFamily: config.fontFamily }),
    ...(config.bodySize && { fontSize: config.bodySize }),
  }

  return (
    <>
      <div className="mb-1 flex items-center gap-2">
        {notice.category && (
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
            {notice.category}
          </span>
        )}
      </div>
      <h2 className={`text-balance font-semibold leading-snug text-white ${titleCls}`} style={titleStyle}>
        {notice.title}
      </h2>
      {(notice.summary || notice.body) && (
        <p className={`mt-2 leading-relaxed ${hasMedia ? "text-zinc-200" : "text-zinc-300"} ${bodyCls}`} style={bodyStyle}>
          {notice.summary ?? notice.body}
        </p>
      )}
    </>
  )
}

function priorityBorderColor(priority: number, isEmergency: boolean): string {
  if (isEmergency) return "border-red-500/70 shadow-red-500/20"
  if (priority >= 70) return "border-red-500/40"
  if (priority >= 50) return "border-amber-500/30"
  return "border-white/[0.06]"
}

function TileCard({ item }: { item: DisplayTileDTO }) {
  const { tile, notice, media_url, effective_priority, is_visible_by_schedule } = item
  const { gridRow, gridColumn } = rectToGridPlacement({
    x: tile.grid_x, y: tile.grid_y, w: tile.grid_w, h: tile.grid_h
  })
  const hidden = !is_visible_by_schedule
  const isWidget = ["clock", "ticker", "banner", "weather", "video", "carousel"].includes(tile.tile_type)
  const hasMedia = !!media_url
  const hasNotice = !!notice
  const config = parseTileConfig(tile.config_json)
  const hasConfigImage = !!config.imageUrl
  const isMediaOnly = tile.tile_type === "image" || (hasMedia && !hasNotice && !isWidget) || (hasConfigImage && !hasNotice && !isWidget)
  const noPadding = isWidget || isMediaOnly || (hasMedia && hasNotice)
  const isEmergency = tile.is_emergency_slot || tile.tile_type === "emergency"
  const borderColor = priorityBorderColor(effective_priority, isEmergency)

  return (
    <article
      className={`relative overflow-hidden rounded-xl border bg-zinc-900/90 shadow-lg backdrop-blur-sm transition-all duration-700 ${borderColor} ${
        hidden ? "opacity-20" : "opacity-100"
      } ${noPadding ? "p-0" : "p-4"} ${isEmergency && !hidden ? "animate-pulse-subtle" : ""}`}
      style={{ gridRow, gridColumn, zIndex: tile.z_index }}
    >
      {isEmergency && !hidden && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />
      )}

      {isWidget ? (
        <WidgetContent type={tile.tile_type} tileW={tile.grid_w} tileH={tile.grid_h} config={config} />
      ) : isMediaOnly ? (
        hasMedia ? (
          <MediaImage src={media_url!} alt={notice?.title} className="absolute inset-0 h-full w-full object-cover" />
        ) : hasConfigImage ? (
          <MediaImage src={config.imageUrl!} alt={config.imageAlt} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-500">No media</p>
          </div>
        )
      ) : hasMedia && hasNotice ? (
        <div className="relative h-full">
          <MediaImage src={media_url!} alt={notice!.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="relative z-10 flex h-full flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
            <NoticeContent notice={notice} tile={tile} config={config} hasMedia />
          </div>
        </div>
      ) : (
        <NoticeContent notice={notice} tile={tile} config={config} hasMedia={false} />
      )}
    </article>
  )
}

export function DisplayCanvas({ refreshInterval = DEFAULT_REFRESH_MS }: { refreshInterval?: number }) {
  const [bundle, setBundle] = useState<DisplayBundle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBundle = useCallback(async () => {
    try {
      const res = await fetch("/api/display/bundle", { cache: "no-store" })
      if (!res.ok) throw new Error(`${res.status}`)
      const data: DisplayBundle = await res.json()
      setBundle(data)
      setError(null)
    } catch {
      setError("Cannot load display bundle")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBundle()
    const interval = setInterval(fetchBundle, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchBundle, refreshInterval])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-400" />
      </div>
    )
  }

  if (error || !bundle) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-zinc-500">
        <p>{error || "No data"}</p>
        <button onClick={fetchBundle} className="rounded-lg border border-zinc-700 px-4 py-2 text-sm hover:border-zinc-500 hover:text-zinc-300">
          Retry
        </button>
      </div>
    )
  }

  if (bundle.layout_version_id === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-zinc-400">
        <p>No published layout.</p>
        <p className="text-sm text-zinc-600">
          Go to <a href="/admin/builder" className="text-blue-400 hover:underline">/admin/builder</a> to create and publish a layout.
        </p>
      </div>
    )
  }

  const tiles = [...bundle.tiles].sort(
    (a, b) => a.tile.z_index - b.tile.z_index || a.tile.id - b.tile.id
  )

  return (
    <div
      className="grid h-full w-full bg-zinc-950 p-2 transition-all duration-500"
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
