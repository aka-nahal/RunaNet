"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import api from "@/lib/api-client"
import type { LayoutRead, NoticeRead, MediaAsset } from "@/lib/types"

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</span>
        <svg className="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-zinc-100">{value}</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [layouts, setLayouts] = useState<LayoutRead[]>([])
  const [notices, setNotices] = useState<NoticeRead[]>([])
  const [media, setMedia] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [l, n, m] = await Promise.all([
          api.layouts.list(),
          api.notices.list(),
          api.media.list(),
        ])
        setLayouts(l)
        setNotices(n)
        setMedia(m)
      } catch (e) {
        console.error("Dashboard load failed", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const publishedCount = layouts.reduce(
    (acc, l) => acc + l.versions.filter((v) => v.is_published).length,
    0,
  )

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Overview of your Smart Notice Board</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Layouts" value={layouts.length}
          icon="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
        <StatCard label="Published" value={publishedCount}
          icon="M5 13l4 4L19 7" />
        <StatCard label="Notices" value={notices.length}
          icon="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        <StatCard label="Media" value={media.length}
          icon="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/layouts"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-indigo-500/40 hover:bg-zinc-800/60">
            <h3 className="font-semibold text-zinc-200 group-hover:text-indigo-400">Manage Layouts &rarr;</h3>
            <p className="mt-1 text-sm text-zinc-500">Create presets for events, celebrations, emergencies</p>
          </Link>
          <Link href="/admin/builder"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-blue-500/40 hover:bg-zinc-800/60">
            <h3 className="font-semibold text-zinc-200 group-hover:text-blue-400">Open Builder &rarr;</h3>
            <p className="mt-1 text-sm text-zinc-500">Drag-and-drop grid editor for layout design</p>
          </Link>
          <Link href="/admin/notices"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-amber-500/40 hover:bg-zinc-800/60">
            <h3 className="font-semibold text-zinc-200 group-hover:text-amber-400">Manage Notices &rarr;</h3>
            <p className="mt-1 text-sm text-zinc-500">Create, edit, and organize notice content</p>
          </Link>
          <Link href="/admin/settings"
            className="group rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 transition-all hover:border-zinc-500/40 hover:bg-zinc-800/60">
            <h3 className="font-semibold text-zinc-200 group-hover:text-zinc-300">Settings &rarr;</h3>
            <p className="mt-1 text-sm text-zinc-500">Resolution, refresh rate, and display config</p>
          </Link>
        </div>
      </div>

      {/* Layouts list */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Layouts</h2>
          <Link href="/admin/layouts" className="text-xs text-blue-400 hover:text-blue-300">Manage Layouts &rarr;</Link>
        </div>
        {layouts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
            <p className="text-sm text-zinc-500">No layouts yet.</p>
            <Link href="/admin/builder" className="mt-2 inline-block text-sm text-blue-400 hover:text-blue-300">
              Create your first layout &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {layouts.map((layout) => {
              const published = layout.versions.find((v) => v.is_published)
              const latestVersion = layout.versions[layout.versions.length - 1]
              const tileCount = latestVersion?.tiles.length ?? 0
              return (
                <div key={layout.id} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-zinc-200">{layout.name}</h3>
                      {layout.description && <p className="mt-0.5 text-xs text-zinc-500">{layout.description}</p>}
                    </div>
                    {published && (
                      <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                        Live
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                    <span>{layout.versions.length} version{layout.versions.length !== 1 ? "s" : ""}</span>
                    <span>&middot;</span>
                    <span>{tileCount} tile{tileCount !== 1 ? "s" : ""}</span>
                    {latestVersion && (
                      <>
                        <span>&middot;</span>
                        <span>{latestVersion.grid_cols}&times;{latestVersion.grid_rows} grid</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Notices */}
      {notices.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Recent Notices</h2>
            <Link href="/admin/notices" className="text-xs text-blue-400 hover:text-blue-300">View All &rarr;</Link>
          </div>
          <div className="space-y-2">
            {notices.slice(0, 5).map((notice) => (
              <div key={notice.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-200">{notice.title}</p>
                  {notice.category && (
                    <span className="mt-0.5 inline-block rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] uppercase text-zinc-500">
                      {notice.category}
                    </span>
                  )}
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                    notice.priority >= 70 ? "bg-red-900/30 text-red-400" :
                    notice.priority >= 50 ? "bg-amber-900/30 text-amber-400" :
                    "bg-zinc-800 text-zinc-500"
                  }`}>
                    P{notice.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
