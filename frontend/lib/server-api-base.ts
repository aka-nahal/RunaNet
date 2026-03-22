/**
 * Base URL for server-side fetches (RSC / Route Handlers).
 * Relative `/api/*` in `fetch()` has no host on the server — use this instead of relying on rewrites.
 */
export function getServerApiBase(): string {
  const raw =
    process.env.API_URL ??
    process.env.BACKEND_URL ??
    process.env.NEXT_PUBLIC_API_BASE ??
    "http://127.0.0.1:8000"
  return raw.replace(/\/$/, "")
}

export function serverApiUrl(path: string): string {
  const base = getServerApiBase()
  const p = path.startsWith("/") ? path : `/${path}`
  return `${base}${p}`
}
