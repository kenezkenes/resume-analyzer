import Anthropic from "@anthropic-ai/sdk"

import { getSupabaseAdmin } from "@/lib/supabase"

type Analysis = {
  ats_score: number
  strengths: [string, string, string]
  weaknesses: [string, string, string]
  improvements: [string, string, string, string, string]
}

function extractJsonObject(text: string): unknown {
  const trimmed = text.trim()
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return JSON.parse(trimmed)
  }

  const match = trimmed.match(/\{[\s\S]*\}/)
  if (!match) {
    throw new Error("Claude response did not contain a JSON object.")
  }

  return JSON.parse(match[0])
}

function assertValidAnalysis(value: unknown): asserts value is Analysis {
  if (!value || typeof value !== "object") {
    throw new Error("Analysis is not an object.")
  }

  const v = value as Record<string, unknown>
  const ats = v.ats_score
  if (typeof ats !== "number" || !Number.isFinite(ats) || ats < 0 || ats > 100) {
    throw new Error("Invalid ats_score.")
  }

  for (const key of ["strengths", "weaknesses", "improvements"] as const) {
    const arr = v[key]
    if (!Array.isArray(arr) || !arr.every((s) => typeof s === "string" && s.trim().length > 0)) {
      throw new Error(`Invalid ${key}.`)
    }
  }

  if ((v.strengths as unknown[]).length !== 3) throw new Error("strengths must be exactly 3 items.")
  if ((v.weaknesses as unknown[]).length !== 3) throw new Error("weaknesses must be exactly 3 items.")
  if ((v.improvements as unknown[]).length !== 5) throw new Error("improvements must be exactly 5 items.")
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | { resume_text?: unknown; email?: unknown }
      | null

    const resume_text = typeof body?.resume_text === "string" ? body.resume_text.trim() : ""
    const email = typeof body?.email === "string" && body.email.trim() ? body.email.trim() : null

    if (!resume_text) {
      return Response.json({ error: "Missing resume_text." }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json({ error: "Server misconfigured (missing ANTHROPIC_API_KEY)." }, { status: 500 })
    }

    const anthropic = new Anthropic({ apiKey })
    const prompt = `You are an expert resume reviewer and ATS specialist. Analyze this resume and return a JSON response with exactly this structure:
{
  ats_score: number (0-100),
  strengths: string[] (exactly 3),
  weaknesses: string[] (exactly 3),
  improvements: string[] (exactly 5)
}
Resume: ${resume_text}`

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 800,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    })

    const text = msg.content.find((b) => b.type === "text")?.text ?? ""
    const parsed = extractJsonObject(text)
    assertValidAnalysis(parsed)

    const analysisResult: Analysis = {
      ats_score: parsed.ats_score,
      strengths: parsed.strengths,
      weaknesses: parsed.weaknesses,
      improvements: parsed.improvements,
    }

    const insertPayload = {
      email,
      resume_text,
      analysis_result: analysisResult,
    }

    const { data, error } = await getSupabaseAdmin()
      .from("analyses")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert(insertPayload as any)
      .select("id")
      .single()

    if (error) {
      return Response.json({ error: "Failed to save analysis." }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Response.json({ analysisId: (data as any)?.id, analysis: analysisResult })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}

