import { getSupabaseAdmin } from "@/lib/supabase"

function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}

const PADDLE_SANDBOX_API_BASE_URL = "https://sandbox-api.paddle.com"

function getPaddleApiKey() {
  const apiKey = process.env.PADDLE_API_KEY
  if (!apiKey) throw new Error("Missing env var: PADDLE_API_KEY")
  return apiKey
}

async function paddleRequest<T>(
  path: string,
  init?: Omit<RequestInit, "headers"> & { headers?: Record<string, string> }
): Promise<{ ok: boolean; status: number; bodyText: string; json: T | null }> {
  const url = `${PADDLE_SANDBOX_API_BASE_URL}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${getPaddleApiKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  const bodyText = await res.text().catch(() => "")
  let json: T | null = null
  try {
    json = bodyText ? (JSON.parse(bodyText) as T) : null
  } catch {
    json = null
  }

  console.log("[Paddle] Request", init?.method ?? "GET", url)
  console.log("[Paddle] Response", res.status, bodyText)

  return { ok: res.ok, status: res.status, bodyText, json }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { analysis_id?: unknown; email?: unknown }
      | null

    const analysisId = typeof body?.analysis_id === "string" ? body.analysis_id : null
    const email = typeof body?.email === "string" && body.email.trim() ? body.email.trim() : null

    if (!analysisId) {
      return Response.json({ error: "Missing analysis_id." }, { status: 400 })
    }

    const priceId = process.env.PADDLE_PRICE_ID
    if (!priceId) {
      return Response.json({ error: "Server misconfigured (missing PADDLE_PRICE_ID)." }, { status: 500 })
    }

    // Create transaction (catalog price).
    // NOTE: Paddle API uses snake_case fields.
    const createRes = await paddleRequest<{
      data?: { id?: string; checkout?: { url?: string | null } | null } | null
      error?: unknown
    }>("/transactions", {
      method: "POST",
      body: JSON.stringify({
        items: [{ price_id: priceId, quantity: 1 }],
        custom_data: { analysis_id: analysisId, email },
        checkout: { url: `${getAppUrl()}/?analysis_id=${encodeURIComponent(analysisId)}` },
      }),
    })

    if (!createRes.ok) {
      return Response.json({ error: "Paddle transaction creation failed." }, { status: 502 })
    }

    const transactionId = createRes.json?.data?.id
    if (!transactionId) {
      return Response.json({ error: "Paddle did not return a transaction id." }, { status: 502 })
    }

    // Update checkout redirect to include transaction_id for verification on return.
    const updateRes = await paddleRequest<{
      data?: { checkout?: { url?: string | null } | null } | null
      error?: unknown
    }>(`/transactions/${encodeURIComponent(transactionId)}`, {
      method: "PATCH",
      body: JSON.stringify({
        checkout: {
          url: `${getAppUrl()}/?analysis_id=${encodeURIComponent(analysisId)}&transaction_id=${encodeURIComponent(
            transactionId
          )}`,
        },
      }),
    })

    const checkoutUrl = updateRes.json?.data?.checkout?.url
    if (!checkoutUrl) {
      return Response.json({ error: "Paddle did not return a checkout URL." }, { status: 500 })
    }

    // Save payment reference on our side
    const { error } = await getSupabaseAdmin()
      .from("analyses")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ payment_id: transactionId } as any)
      .eq("id", analysisId)

    if (error) {
      return Response.json({ error: "Failed to attach payment to analysis." }, { status: 500 })
    }

    return Response.json({ checkoutUrl, transactionId })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}

// Called after checkout completes (simple redirect handler).
// Verifies transaction status and marks analysis as paid.
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const analysisId = url.searchParams.get("analysis_id")
    const transactionId = url.searchParams.get("transaction_id") ?? url.searchParams.get("tx")

    if (!analysisId) return Response.json({ error: "Missing analysis_id." }, { status: 400 })
    if (!transactionId) return Response.json({ error: "Missing transaction_id." }, { status: 400 })

    const getRes = await paddleRequest<{
      data?: { status?: string } | null
      error?: unknown
    }>(`/transactions/${encodeURIComponent(transactionId)}`, { method: "GET" })

    if (!getRes.ok) {
      return Response.json({ error: "Failed to fetch transaction status from Paddle." }, { status: 502 })
    }

    const status = getRes.json?.data?.status
    const okStatuses = new Set(["paid", "completed", "billed"])
    if (!status || !okStatuses.has(status)) {
      return Response.json({ error: `Transaction not successful (${status ?? "unknown"}).` }, { status: 402 })
    }

    const { error } = await getSupabaseAdmin()
      .from("analyses")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ paid: true, payment_id: transactionId } as any)
      .eq("id", analysisId)

    if (error) {
      return Response.json({ error: "Failed to mark analysis as paid." }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}

