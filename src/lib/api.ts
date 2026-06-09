export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://tcghub.ai";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${path}: ${res.status} — ${body}`);
  }
  return res.json();
}
