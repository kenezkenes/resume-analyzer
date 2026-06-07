import { getSupabaseAdmin } from "@/lib/supabase"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data, error } = await getSupabaseAdmin()
    .from("analyses")
    .select("analysis_result, paid")
    .eq("id", id)
    .single()

  if (error || !data)
    return Response.json({ error: "Analysis not found." }, { status: 404 })

  if (!(data as any).paid)
    return Response.json({ error: "Payment required." }, { status: 402 })

  return Response.json({ analysis: (data as any).analysis_result })
}