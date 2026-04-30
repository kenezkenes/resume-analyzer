"use client"

import { CheckCircle2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

export type AnalysisResultData = {
  ats_score: number
  strengths: [string, string, string] | string[]
  weaknesses: [string, string, string] | string[]
  improvements: [string, string, string, string, string] | string[]
}

export function AnalysisResult({
  analysis,
  onReset,
  className,
}: {
  analysis: AnalysisResultData
  onReset: () => void
  className?: string
}) {
  const score = clamp(Math.round(analysis.ats_score), 0, 100)
  const color = score < 50 ? "red" : score <= 75 ? "yellow" : "green"

  const strokeClass =
    color === "red"
      ? "stroke-destructive"
      : color === "yellow"
        ? "stroke-yellow-500"
        : "stroke-emerald-500"

  const ringBgClass =
    color === "red"
      ? "text-destructive/20"
      : color === "yellow"
        ? "text-yellow-500/20"
        : "text-emerald-500/20"

  return (
    <Card className={cn("mx-auto w-full max-w-3xl", className)}>
      <CardHeader>
        <CardTitle>Analysis results</CardTitle>
        <CardDescription>Your ATS score and the most actionable improvements.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-stretch">
          <ScoreRing score={score} ringBgClass={ringBgClass} strokeClass={strokeClass} />

          <div className="grid w-full gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="text-sm font-medium">Top strengths</div>
              <Separator className="my-3" />
              <ul className="space-y-2 text-sm">
                {analysis.strengths.slice(0, 3).map((item, idx) => (
                  <li key={`strength-${idx}`} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border bg-muted/20 p-4">
              <div className="text-sm font-medium">Top weaknesses</div>
              <Separator className="my-3" />
              <ul className="space-y-2 text-sm">
                {analysis.weaknesses.slice(0, 3).map((item, idx) => (
                  <li key={`weakness-${idx}`} className="flex items-start gap-2">
                    <XCircle className="mt-0.5 size-4 text-destructive" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <div className="text-sm font-medium">5 specific improvement suggestions</div>
          <Separator className="my-3" />
          <ol className="space-y-2 pl-5 text-sm">
            {analysis.improvements.slice(0, 5).map((item, idx) => (
              <li key={`improvement-${idx}`} className="list-decimal">
                {item}
              </li>
            ))}
          </ol>
        </div>
      </CardContent>

      <CardFooter className="justify-end">
        <Button onClick={onReset} variant="secondary">
          Analyze Another Resume
        </Button>
      </CardFooter>
    </Card>
  )
}

function ScoreRing({
  score,
  ringBgClass,
  strokeClass,
}: {
  score: number
  ringBgClass: string
  strokeClass: string
}) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const dashOffset = circumference - progress

  return (
    <div className="flex w-full flex-col items-center justify-center rounded-xl border bg-muted/20 p-6 md:w-[260px]">
      <div className="relative size-32">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className={ringBgClass}
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            className={cn("transition-[stroke-dashoffset] duration-700 ease-out", strokeClass)}
          />
        </svg>

        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="text-4xl font-semibold tracking-tight">{score}</div>
            <div className="text-xs text-muted-foreground">ATS score</div>
          </div>
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        Aim for <span className="font-medium text-foreground">75+</span> for strong ATS compatibility.
      </div>
    </div>
  )
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export default AnalysisResult

