"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api-client"
import type { TeacherRead, TeacherCreate, TeacherStatus } from "@/lib/types"
import { TEACHER_STATUSES } from "@/lib/types"

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function statusInfo(status: TeacherStatus) {
  return TEACHER_STATUSES.find((s) => s.value === status) ?? TEACHER_STATUSES[4]
}

function StatusBadge({ status, size = "sm" }: { status: TeacherStatus; size?: "sm" | "md" }) {
  const info = statusInfo(status)
  const sizeMap = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  }
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-900/30 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-900/30 text-amber-400 border-amber-500/20",
    blue: "bg-blue-900/30 text-blue-400 border-blue-500/20",
    violet: "bg-violet-900/30 text-violet-400 border-violet-500/20",
    red: "bg-red-900/30 text-red-400 border-red-500/20",
  }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border font-medium ${sizeMap[size]} ${colorMap[info.color] ?? colorMap.red}`}>
      <span>{info.icon}</span>
      {info.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherRead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<TeacherStatus | "all">("all")
  const [filterDept, setFilterDept] = useState("")

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<TeacherCreate>({ name: "", department: "" })
  const [creating, setCreating] = useState(false)

  // Edit
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<Partial<TeacherRead>>({})

  // Quick status
  const [statusMenuId, setStatusMenuId] = useState<number | null>(null)

  async function load() {
    try {
      setTeachers(await api.teachers.list())
    } catch (e) {
      console.error("Load teachers failed", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function createTeacher() {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      await api.teachers.create(form)
      await load()
      setShowCreate(false)
      setForm({ name: "", department: "" })
    } catch (e) {
      console.error("Create failed", e)
    } finally {
      setCreating(false)
    }
  }

  async function quickStatus(id: number, status: TeacherStatus, note?: string) {
    try {
      await api.teachers.updateStatus(id, status, note)
      await load()
    } catch (e) {
      console.error("Status update failed", e)
    }
    setStatusMenuId(null)
  }

  async function saveEdit(id: number) {
    try {
      await api.teachers.update(id, editForm)
      await load()
    } catch (e) {
      console.error("Update failed", e)
    }
    setEditingId(null)
  }

  async function deleteTeacher(id: number) {
    if (!confirm("Delete this teacher?")) return
    try {
      await api.teachers.delete(id)
      setTeachers((prev) => prev.filter((t) => t.id !== id))
    } catch (e) {
      console.error("Delete failed", e)
    }
  }

  // Filtering
  const departments = [...new Set(teachers.map((t) => t.department).filter(Boolean))].sort()
  const filtered = teachers.filter((t) => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false
    if (filterDept && t.department !== filterDept) return false
    if (search) {
      const q = search.toLowerCase()
      return t.name.toLowerCase().includes(q) || t.department.toLowerCase().includes(q) ||
        (t.subject ?? "").toLowerCase().includes(q) || (t.room ?? "").toLowerCase().includes(q) ||
        (t.email ?? "").toLowerCase().includes(q)
    }
    return true
  })

  // Stats
  const stats = TEACHER_STATUSES.map((s) => ({
    ...s,
    count: teachers.filter((t) => t.status === s.value && t.is_active).length,
  }))

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Teacher Tracker</h1>
          <p className="mt-1 text-sm text-zinc-500">Track teacher availability, schedules, and locations</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20">
          + Add Teacher
        </button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {stats.map((s) => {
          const colorMap: Record<string, string> = {
            emerald: "border-emerald-500/20 bg-emerald-900/10",
            amber: "border-amber-500/20 bg-amber-900/10",
            blue: "border-blue-500/20 bg-blue-900/10",
            violet: "border-violet-500/20 bg-violet-900/10",
            red: "border-red-500/20 bg-red-900/10",
          }
          const textMap: Record<string, string> = {
            emerald: "text-emerald-400",
            amber: "text-amber-400",
            blue: "text-blue-400",
            violet: "text-violet-400",
            red: "text-red-400",
          }
          return (
            <button key={s.value}
              onClick={() => setFilterStatus(filterStatus === s.value ? "all" : s.value)}
              className={`rounded-xl border p-3 text-left transition-all ${
                filterStatus === s.value ? "ring-1 ring-white/10" : ""
              } ${colorMap[s.color]}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{s.icon}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${textMap[s.color]}`}>{s.label}</span>
              </div>
              <p className={`text-xl font-bold tabular-nums ${textMap[s.color]}`}>{s.count}</p>
            </button>
          )
        })}
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-200">Add New Teacher</h2>
            <button onClick={() => setShowCreate(false)} className="text-zinc-500 hover:text-zinc-300 text-lg">&times;</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500">Name *</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Smith" className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none border border-zinc-700 focus:border-blue-500/50" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500">Department</span>
              <input value={form.department ?? ""} onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Computer Science" className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none border border-zinc-700 focus:border-blue-500/50" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500">Subject</span>
              <input value={form.subject ?? ""} onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="Data Structures" className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none border border-zinc-700 focus:border-blue-500/50" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500">Email</span>
              <input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@school.edu" className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none border border-zinc-700 focus:border-blue-500/50" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500">Phone</span>
              <input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 234 567 8901" className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none border border-zinc-700 focus:border-blue-500/50" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-zinc-500">Room</span>
              <input value={form.room ?? ""} onChange={(e) => setForm({ ...form, room: e.target.value })}
                placeholder="B-204" className="rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none border border-zinc-700 focus:border-blue-500/50" />
            </label>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={createTeacher} disabled={!form.name.trim() || creating}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
              Add Teacher
            </button>
            <button onClick={() => { setShowCreate(false); setForm({ name: "", department: "" }) }}
              className="rounded-lg px-4 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800">Cancel</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, dept, subject, room..."
            className="w-full rounded-lg bg-zinc-900 pl-10 pr-3 py-2 text-sm text-zinc-200 outline-none border border-zinc-800 focus:border-blue-500/40" />
        </div>
        {departments.length > 0 && (
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-zinc-300 outline-none border border-zinc-800">
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        )}
        {(filterStatus !== "all" || filterDept || search) && (
          <button onClick={() => { setFilterStatus("all"); setFilterDept(""); setSearch("") }}
            className="text-xs text-zinc-500 hover:text-zinc-300">Clear filters</button>
        )}
        <span className="ml-auto text-xs text-zinc-600">{filtered.length} of {teachers.length} teachers</span>
      </div>

      {/* Teachers table */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center">
          <span className="text-3xl block mb-2">👨‍🏫</span>
          <p className="text-sm text-zinc-400">{teachers.length === 0 ? "No teachers yet." : "No teachers match your filters."}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-left text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-2.5">Teacher</th>
                <th className="px-4 py-2.5">Department</th>
                <th className="px-4 py-2.5">Room</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Note</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className={`border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30 ${!t.is_active ? "opacity-40" : ""}`}>
                  <td className="px-4 py-3">
                    {editingId === t.id ? (
                      <input value={editForm.name ?? t.name} autoFocus
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="rounded bg-zinc-800 px-2 py-0.5 text-sm text-zinc-200 outline-none border border-blue-500/50 w-full" />
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{t.name}</p>
                        {t.subject && <p className="text-[10px] text-zinc-500">{t.subject}</p>}
                        {t.email && <p className="text-[10px] text-zinc-600">{t.email}</p>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === t.id ? (
                      <input value={editForm.department ?? t.department}
                        onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                        className="rounded bg-zinc-800 px-2 py-0.5 text-sm text-zinc-200 outline-none border border-blue-500/50 w-full" />
                    ) : (
                      <span className="text-sm text-zinc-400">{t.department || "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === t.id ? (
                      <input value={editForm.room ?? t.room ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                        className="rounded bg-zinc-800 px-2 py-0.5 text-sm text-zinc-200 outline-none border border-blue-500/50 w-24" />
                    ) : (
                      <span className="text-sm text-zinc-400 font-mono">{t.room || "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 relative">
                    <button onClick={() => setStatusMenuId(statusMenuId === t.id ? null : t.id)}>
                      <StatusBadge status={t.status} />
                    </button>
                    {/* Quick status menu */}
                    {statusMenuId === t.id && (
                      <div className="absolute left-4 top-full z-50 mt-1 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl p-1 min-w-[160px]">
                        {TEACHER_STATUSES.map((s) => (
                          <button key={s.value}
                            onClick={() => quickStatus(t.id, s.value)}
                            className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors ${
                              t.status === s.value ? "bg-zinc-800 text-zinc-200" : "text-zinc-400 hover:bg-zinc-800"
                            }`}>
                            <span>{s.icon}</span>{s.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === t.id ? (
                      <input value={editForm.status_note ?? t.status_note ?? ""}
                        onChange={(e) => setEditForm({ ...editForm, status_note: e.target.value })}
                        placeholder="Note..."
                        className="rounded bg-zinc-800 px-2 py-0.5 text-sm text-zinc-200 outline-none border border-blue-500/50 w-full" />
                    ) : (
                      <span className="text-xs text-zinc-500 italic">{t.status_note || "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === t.id ? (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => saveEdit(t.id)}
                          className="rounded-md bg-blue-600 px-2.5 py-1 text-[10px] text-white hover:bg-blue-500">Save</button>
                        <button onClick={() => setEditingId(null)}
                          className="rounded-md px-2.5 py-1 text-[10px] text-zinc-400 hover:bg-zinc-800">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => { setEditingId(t.id); setEditForm({}) }}
                          className="rounded-md px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-800 border border-zinc-700">Edit</button>
                        <button onClick={() => deleteTeacher(t.id)}
                          className="rounded-md px-2 py-1 text-[10px] text-red-400 hover:bg-red-900/20 border border-zinc-700 hover:border-red-500/30">Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
