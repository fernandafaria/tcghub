import { NextResponse } from "next/server";

// Server-side sync — longer timeout than browser fetch
// Call GET /api/sync-images?game=pokemon&limit=10000

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game") || "pokemon";
  const limit = parseInt(searchParams.get("limit") || "5000", 10);
  const endpoint = searchParams.get("endpoint") || "sync-tcgdex";

  const BACKEND = "https://seal-app-6y47g.ondigitalocean.app";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300_000); // 5 min

    const resp = await fetch(`${BACKEND}/admin/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game, limit }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const data = await resp.json();

    if (!resp.ok) {
      return NextResponse.json(
        { error: `Backend ${resp.status}: ${resp.statusText}`, ...data },
        { status: resp.status }
      );
    }

    return NextResponse.json({
      ok: true,
      game,
      endpoint,
      synced: data.synced ?? 0,
      skipped: data.skipped ?? 0,
      total_db: data.total_db ?? "?",
      tcgdex_size: data.tcgdex_size,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: message, game, endpoint },
      { status: 500 }
    );
  }
}
