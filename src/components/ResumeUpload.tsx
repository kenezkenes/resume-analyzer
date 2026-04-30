"use client"

import type { ChangeEvent } from "react"
import { useRef, useState } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type Analysis = {
  ats_score: number
  strengths: string[]
  weaknesses: string[]
  improvements: string[]
}

export type AnalyzeSuccessResponse = { analysisId: string; analysis: Analysis }
type AnalyzeResponse = AnalyzeSuccessResponse | { error: string }

function isAnalysis(value: unknown): value is Analysis {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    typeof v.ats_score === "number" &&
    Array.isArray(v.strengths) &&
    Array.isArray(v.weaknesses) &&
    Array.isArray(v.improvements)
  )
}

function isAnalyzeSuccess(value: unknown): value is AnalyzeSuccessResponse {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return typeof v.analysisId === "string" && isAnalysis(v.analysis)
}

export function ResumeUpload({
  onAnalyzed,
  className,
}: {
  onAnalyzed: (result: AnalyzeSuccessResponse) => void
  className?: string
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [tab, setTab] = useState<"pdf" | "text">("pdf")
  const [resumeText, setResumeText] = useState("")
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const [isExtracting, setIsExtracting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [error, setError] = useState<string | null>(null)

  const charCount = resumeText.length
  const canSubmit = charCount > 0 && !isAnalyzing && !isExtracting

  async function extractPdfText(file: File) {
    setIsExtracting(true)
    setError(null)

    try {
      const form = new FormData()
      form.set("file", file)

      const res = await fetch("/api/extract-pdf-text", {
        method: "POST",
        body: form,
      })

      const data = (await res.json().catch(() => null)) as { text?: unknown; error?: unknown } | null
      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Failed to extract text from PDF."
        throw new Error(msg)
      }

      const text = typeof data?.text === "string" ? data.text : ""
      if (!text.trim()) throw new Error("No text extracted from the PDF.")

      setResumeText(text)
    } finally {
      setIsExtracting(false)
    }
  }

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setSelectedFileName(file?.name ?? null)

    if (!file) return
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file.")
      return
    }

    try {
      await extractPdfText(file)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract PDF text.")
    }
  }

  async function onSubmit() {
    setIsAnalyzing(true)
    setError(null)

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText }),
      })

      const data = (await res.json().catch(() => null)) as AnalyzeResponse | null
      if (!res.ok) {
        const msg = data && "error" in data && typeof data.error === "string" ? data.error : "Analysis failed."
        throw new Error(msg)
      }

      if (!isAnalyzeSuccess(data)) {
        throw new Error("Unexpected response format from /api/analyze.")
      }

      onAnalyzed(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.")
    } finally {
      setIsAnalyzing(false)
    }
  }

  function onClear() {
    setResumeText("")
    setSelectedFileName(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <Card className={cn("mx-auto w-full max-w-3xl", className)}>
      <CardHeader>
        <CardTitle>Resume analysis</CardTitle>
        <CardDescription>Upload a PDF or paste text to get an ATS-style review.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "pdf" | "text")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
            <TabsTrigger value="text">Paste text</TabsTrigger>
          </TabsList>

          <TabsContent value="pdf" className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="resume-pdf">PDF file</Label>
              <Input
                ref={fileInputRef}
                id="resume-pdf"
                type="file"
                accept="application/pdf"
                onChange={onFileChange}
                disabled={isExtracting || isAnalyzing}
              />
              <div className="text-sm text-muted-foreground">
                {selectedFileName ? (
                  <span>
                    Selected: <span className="font-medium text-foreground">{selectedFileName}</span>
                  </span>
                ) : (
                  <span>Tip: Use a text-based PDF for best results.</span>
                )}
              </div>
            </div>

            {isExtracting ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                Extracting text from PDF…
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="text" className="mt-4 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="resume-text">Resume text</Label>
              <Textarea
                id="resume-text"
                placeholder="Paste your resume text here…"
                className="min-h-[220px]"
                value={resumeText}
                onChange={(e) => {
                  setResumeText(e.target.value)
                }}
                disabled={isExtracting || isAnalyzing}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Character count: <span className="font-medium text-foreground">{charCount.toLocaleString()}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClear} disabled={isAnalyzing || isExtracting}>
              Clear
            </Button>
            <Button onClick={onSubmit} disabled={!canSubmit}>
              {isAnalyzing ? "Analyzing…" : "Analyze resume"}
            </Button>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  )
}

export default ResumeUpload

