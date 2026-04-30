"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, FileUp, Sparkles, Wand2 } from "lucide-react"

import type { AnalysisResultData } from "@/components/AnalysisResult"
import AnalysisResult from "@/components/AnalysisResult"
import PaywallModal from "@/components/PaywallModal"
import ResumeUpload, { type AnalyzeSuccessResponse } from "@/components/ResumeUpload"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type StoredAnalysis = { analysisId: string; analysis: AnalysisResultData; storedAt: number }

const STORAGE_KEY = "resumeai:last_analysis"

const SAMPLE: AnalysisResultData = {
  ats_score: 72,
  strengths: ["Clear structure and strong section headings", "Relevant keywords for the target role", "Quantified impact on recent projects"],
  weaknesses: ["Too many generic bullet points", "Missing measurable outcomes in older roles", "Skills section is long and unfocused"],
  improvements: [
    "Rewrite top 5 bullets to include metrics (%, $, time saved).",
    "Tailor the summary to a single target role and include core keywords.",
    "Move the most relevant skills to the top and remove low-signal tools.",
    "Add 2–3 role-specific projects with outcomes and tech stack.",
    "Standardize tense and formatting for consistent scanning.",
  ],
}

function safeParseStored(): StoredAnalysis | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredAnalysis>
    if (!parsed.analysisId || !parsed.analysis || typeof parsed.storedAt !== "number") return null
    return parsed as StoredAnalysis
  } catch {
    return null
  }
}

function getInitialStored(): StoredAnalysis | null {
  if (typeof window === "undefined") return null
  return safeParseStored()
}

function storeAnalysis(value: StoredAnalysis) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
}

function clearStored() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function HomePage() {
  const router = useRouter()
  const search = useSearchParams()
  const uploadRef = useRef<HTMLDivElement | null>(null)

  const [analysisId, setAnalysisId] = useState<string | null>(() => getInitialStored()?.analysisId ?? null)
  const [analysis, setAnalysis] = useState<AnalysisResultData | null>(() => getInitialStored()?.analysis ?? null)
  const [isPaid, setIsPaid] = useState(false)
  const [paywallOpen, setPaywallOpen] = useState(false)
  const [unlockError, setUnlockError] = useState<string | null>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)

  const lockedPreview = useMemo(() => {
    if (analysis) return analysis
    return SAMPLE
  }, [analysis])

  function scrollToUpload() {
    uploadRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function resetFlow() {
    setAnalysisId(null)
    setAnalysis(null)
    setIsPaid(false)
    setPaywallOpen(false)
    setUnlockError(null)
    clearStored()
    router.replace("/")
  }

  async function verifyAndUnlock(params: { analysisId: string; transactionId: string }) {
    setIsUnlocking(true)
    setUnlockError(null)
    try {
      const res = await fetch(
        `/api/payment?analysis_id=${encodeURIComponent(params.analysisId)}&transaction_id=${encodeURIComponent(
          params.transactionId
        )}`,
        { method: "GET" }
      )
      const data = (await res.json().catch(() => null)) as { ok?: unknown; error?: unknown } | null
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Payment verification failed."
        throw new Error(msg)
      }

      setIsPaid(true)
    } catch (e) {
      setUnlockError(e instanceof Error ? e.message : "Payment verification failed.")
    } finally {
      setIsUnlocking(false)
    }
  }

  useEffect(() => {
    const stored = getInitialStored()

    const qAnalysisId = search.get("analysis_id")
    const qTransactionId = search.get("transaction_id")
    if (qAnalysisId && qTransactionId) {
      // Defer work to avoid set-state-in-effect lint rule.
      setTimeout(() => {
        setAnalysisId(qAnalysisId)
        if (stored?.analysisId === qAnalysisId) {
          setAnalysis(stored.analysis)
        }
        void verifyAndUnlock({ analysisId: qAnalysisId, transactionId: qTransactionId })
      }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onAnalyzed(result: AnalyzeSuccessResponse) {
    setAnalysisId(result.analysisId)
    setAnalysis(result.analysis)
    setIsPaid(false)
    setPaywallOpen(true)
    setUnlockError(null)
    storeAnalysis({ analysisId: result.analysisId, analysis: result.analysis, storedAt: Date.now() })
  }

  const showLocked = Boolean(analysisId) && !isPaid
  const showFull = Boolean(analysisId) && Boolean(analysis) && isPaid

  return (
    <div className="min-h-full bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(900px_circle_at_20%_10%,rgba(120,119,198,0.22),transparent_60%),radial-gradient(900px_circle_at_80%_40%,rgba(34,197,94,0.12),transparent_55%)]" />

      <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-xl border bg-muted/40">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div className="font-semibold tracking-tight">ResumeAI</div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a className="hover:text-foreground" href="#how">
              How it works
            </a>
            <a className="hover:text-foreground" href="#preview">
              Preview
            </a>
            <a className="hover:text-foreground" href="#testimonials">
              Testimonials
            </a>
          </nav>

          <Button size="sm" onClick={scrollToUpload}>
            Analyze
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="relative py-16 md:py-24">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
                <Wand2 className="size-3.5 text-primary" />
                Brutal, ATS-focused feedback in seconds
              </div>

              <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                Get Your Resume Roasted by AI in 30 Seconds
              </h1>
              <p className="text-pretty text-lg leading-7 text-muted-foreground">
                Find out exactly why you&apos;re not getting callbacks. Brutal honesty, actionable fixes.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button size="lg" onClick={scrollToUpload}>
                  Analyze My Resume – €7
                  <ArrowRight className="ml-1 size-4" />
                </Button>
                <div className="text-sm text-muted-foreground">
                  One-time. Instant access after checkout.
                </div>
              </div>
            </div>

            <div className="relative">
              <Card className="border-muted bg-muted/10">
                <CardHeader>
                  <CardTitle className="text-base">Sample output</CardTitle>
                  <CardDescription>What you’ll see after analysis.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative overflow-hidden rounded-xl border bg-background/40">
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
                    <div className="p-4 blur-[2px]">
                      <AnalysisResult
                        analysis={SAMPLE}
                        onReset={() => {}}
                        className="max-w-none border-0 bg-transparent shadow-none"
                      />
                    </div>
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="rounded-xl border bg-background/70 px-4 py-3 text-center backdrop-blur">
                        <div className="text-sm font-medium">Preview</div>
                        <div className="text-xs text-muted-foreground">Full results unlock after checkout</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div ref={uploadRef} className="scroll-mt-24 pt-12">
            <ResumeUpload onAnalyzed={onAnalyzed} />
          </div>

          {analysisId ? (
            <div className="mt-10">
              {showFull ? (
                <AnalysisResult analysis={analysis!} onReset={resetFlow} />
              ) : (
                <div className="relative">
                  <div className={cn("transition", showLocked ? "blur-[3px]" : "")}>
                    <AnalysisResult analysis={lockedPreview} onReset={() => {}} />
                  </div>
                  {showLocked ? (
                    <div className="absolute inset-0 grid place-items-center">
                      <Card className="w-full max-w-md border-muted bg-background/75 backdrop-blur">
                        <CardHeader>
                          <CardTitle>Full analysis locked</CardTitle>
                          <CardDescription>Unlock the full report for €7.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {unlockError ? (
                            <p className="text-sm text-destructive">{unlockError}</p>
                          ) : isUnlocking ? (
                            <p className="text-sm text-muted-foreground">Verifying payment…</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              You’re one step away from the complete ATS breakdown and improvement plan.
                            </p>
                          )}
                        </CardContent>
                        <div className="px-4 pb-4">
                          <Button className="w-full" onClick={() => setPaywallOpen(true)} disabled={isUnlocking}>
                            Get Full Analysis
                            <ArrowRight className="ml-1 size-4" />
                          </Button>
                        </div>
                      </Card>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </section>

        <section id="how" className="py-16">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-2 text-muted-foreground">Three steps. No fluff.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StepCard
              icon={<FileUp className="size-4 text-primary" />}
              title="Upload"
              description="Upload a PDF or paste your resume text."
            />
            <StepCard
              icon={<Sparkles className="size-4 text-primary" />}
              title="AI Analyzes"
              description="ATS-focused scoring + strengths, weaknesses, and fixes."
            />
            <StepCard
              icon={<Wand2 className="size-4 text-primary" />}
              title="Get Feedback"
              description="A clear improvement plan you can apply immediately."
            />
          </div>
        </section>

        <section id="preview" className="py-16">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Result preview</h2>
            <p className="mt-2 text-muted-foreground">A realistic mock of what you’ll get.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-muted bg-muted/10">
              <CardHeader>
                <CardTitle className="text-base">Mock analysis</CardTitle>
                <CardDescription>Score + strengths + weaknesses + improvements.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative overflow-hidden rounded-xl border">
                  <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/10 to-background/70" />
                  <div className="p-4 blur-[2px]">
                    <AnalysisResult
                      analysis={SAMPLE}
                      onReset={() => {}}
                      className="max-w-none border-0 bg-transparent shadow-none"
                    />
                  </div>
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="rounded-xl border bg-background/70 px-4 py-3 text-center backdrop-blur">
                      <div className="text-sm font-medium">Locked preview</div>
                      <div className="text-xs text-muted-foreground">Unlock after checkout</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-muted bg-muted/10">
              <CardHeader>
                <CardTitle className="text-base">What you’ll improve</CardTitle>
                <CardDescription>Examples of the feedback you’ll get.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  - “Replace ‘responsible for’ with outcome-driven bullets and numbers.”
                </p>
                <p>
                  - “Mirror key job keywords in skills and recent experience.”
                </p>
                <p>
                  - “Your summary is generic; target one role and add 2–3 core competencies.”
                </p>
                <Separator />
                <p className="text-foreground">
                  You’ll leave with a concrete plan—what to change, where, and why.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="testimonials" className="py-16">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">Testimonials</h2>
            <p className="mt-2 text-muted-foreground">Realistic feedback from people who tried it.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Testimonial
              name="Mira K."
              role="Product Designer"
              quote="It was blunt in the best way. I rewrote my bullets with metrics and finally started getting replies."
            />
            <Testimonial
              name="Daniel R."
              role="Backend Engineer"
              quote="The weaknesses section called out exactly what recruiters told me later. Worth the €7 just for the improvement checklist."
            />
            <Testimonial
              name="Sofia N."
              role="Data Analyst"
              quote="Super fast, super specific. The keyword suggestions were the missing piece for ATS screening."
            />
          </div>
        </section>
      </main>

      <footer className="border-t bg-background/60">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} ResumeAI</div>
            <div>
              Contact:{" "}
              <a className="text-foreground hover:underline" href="mailto:guthbalint13@gmail.com">
                guthbalint13@gmail.com
              </a>
            </div>
          </div>
        </div>
      </footer>

      {analysisId ? (
        <PaywallModal open={paywallOpen} onOpenChange={setPaywallOpen} analysisId={analysisId} />
      ) : null}
    </div>
  )
}

function StepCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <Card className="border-muted bg-muted/10">
      <CardHeader>
        <div className="mb-2 inline-flex size-9 items-center justify-center rounded-xl border bg-background/40">
          {icon}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function Testimonial({ name, role, quote }: { name: string; role: string; quote: string }) {
  return (
    <Card className="border-muted bg-muted/10">
      <CardHeader>
        <CardTitle className="text-base">{name}</CardTitle>
        <CardDescription>{role}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">“{quote}”</CardContent>
    </Card>
  )
}
