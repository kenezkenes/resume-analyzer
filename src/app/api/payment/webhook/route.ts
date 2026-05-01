import { createHmac, timingSafeEqual } from "crypto"

import { getSupabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"

/** Register in Paddle: https://…/api/payment/webhook (notification destination URL). */
function getWebhookSecret() {
  const secret = process.env.PADDLE_WEBHOOK_SECRET
  if (!secret) throw new Error("Missing env var: PADDLE_WEBHOOK_SECRET")
  return secret
}

function parsePaddleSignatureHeader(header: string | null): { ts: string; h1: string } | null {
  if (!header) return null
  let ts: string | null = null
  let h1: string | null = null
  for (const part of header.split(";")) {
    const eq = part.indexOf("=")
    if (eq === -1) continue
    const key = part.slice(0, eq).trim()
    const value = part.slice(eq + 1).trim()
    if (key === "ts") ts = value
    if (key === "h1") h1 = value
  }
  if (!ts || !h1) return null
  return { ts, h1 }
}

function verifyPaddleSignature(rawBody: string, paddleSignatureHeader: string | null): boolean {
  const parsed = parsePaddleSignatureHeader(paddleSignatureHeader)
  if (!parsed) return false

  const tsNum = Number(parsed.ts)
  if (Number.isFinite(tsNum)) {
    const skewSec = Math.abs(Math.floor(Date.now() / 1000) - tsNum)
    if (skewSec > 300) return false
  }

  const signedPayload = `${parsed.ts}:${rawBody}`
  const expectedHex = createHmac("sha256", getWebhookSecret()).update(signedPayload, "utf8").digest("hex")

  try {
    const a = Buffer.from(expectedHex, "hex")
    const b = Buffer.from(parsed.h1, "hex")
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

type PaddleWebhookBody = {
  event_type?: string
  data?: {
    id?: string
    custom_data?: Record<string, unknown> | null
  }
}

function analysisIdFromCustomData(custom: Record<string, unknown> | null | undefined): string | null {
  if (!custom || typeof custom !== "object") return null
  const id = custom.analysis_id ?? custom.analysisId
  return typeof id === "string" && id.trim() ? id.trim() : null
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text()
    const sig = request.headers.get("paddle-signature")

    if (!verifyPaddleSignature(rawBody, sig)) {
      return new Response(null, { status: 401 })
    }

    let body: PaddleWebhookBody
    try {
      body = JSON.parse(rawBody) as PaddleWebhookBody
    } catch {
      return new Response(null, { status: 400 })
    }

    if (body.event_type !== "transaction.completed") {
      return new Response(null, { status: 200 })
    }

    const analysisId = analysisIdFromCustomData(body.data?.custom_data ?? undefined)
    if (!analysisId) {
      console.warn("[Paddle webhook] transaction.completed missing custom_data.analysis_id")
      return new Response(null, { status: 200 })
    }

    const { error } = await (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getSupabaseAdmin() as any
    )
      .from("analyses")
      .update({ paid: true })
      .eq("id", analysisId)

    if (error) {
      console.error("[Paddle webhook] Supabase update failed", error)
      return new Response(null, { status: 500 })
    }

    return new Response(null, { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[Paddle webhook]", message)
    return new Response(null, { status: 500 })
  }
}
