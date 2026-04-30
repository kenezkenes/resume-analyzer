"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function PaywallModal({
  open,
  onOpenChange,
  analysisId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  analysisId: string
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startCheckout() {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis_id: analysisId }),
      })

      const data = (await res.json().catch(() => null)) as
        | { checkoutUrl?: unknown; error?: unknown }
        | null

      if (!res.ok) {
        const msg = typeof data?.error === "string" ? data.error : "Failed to start checkout."
        throw new Error(msg)
      }

      const checkoutUrl = typeof data?.checkoutUrl === "string" ? data.checkoutUrl : null
      if (!checkoutUrl) throw new Error("Missing checkout URL.")

      window.location.href = checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout.")
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unlock Full Analysis</DialogTitle>
          <DialogDescription>
            One-time purchase. Instant access after checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border bg-muted/20 p-4">
            <div className="text-sm text-muted-foreground">Price</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight">€7</div>
            <div className="text-sm text-muted-foreground">one-time</div>
          </div>

          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-foreground/60" />
              <span>Full ATS Score</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-foreground/60" />
              <span>Detailed Feedback</span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-foreground/60" />
              <span>Improvement Plan</span>
            </li>
          </ul>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={startCheckout} disabled={isLoading}>
            {isLoading ? "Opening checkout…" : "Get Full Analysis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PaywallModal

