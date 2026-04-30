import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Refund Policy | ResumeAI",
}

export default function RefundPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Card className="border-muted bg-muted/10">
        <CardHeader>
          <CardTitle className="text-2xl">Refund Policy</CardTitle>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toISOString().slice(0, 10)}</p>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none text-sm leading-6">
          <p>
            ResumeAI sells a one‑time purchase to unlock the full resume analysis. Because the service delivers
            digital content immediately, refunds are handled case‑by‑case.
          </p>

          <h2>When refunds may be granted</h2>
          <ul>
            <li>Duplicate charges for the same purchase.</li>
            <li>Technical failure that prevents delivering the paid analysis.</li>
            <li>Accidental purchase (contact us promptly).</li>
          </ul>

          <h2>When refunds are generally not granted</h2>
          <ul>
            <li>Unsatisfaction with the content of AI-generated feedback after delivery.</li>
            <li>Inability to obtain job interviews or offers.</li>
          </ul>

          <h2>How to request a refund</h2>
          <p>
            Email{" "}
            <a href="mailto:guthbalint13@gmail.com">guthbalint13@gmail.com</a> with:
          </p>
          <ul>
            <li>The email used at checkout (if provided)</li>
            <li>Transaction ID (if available)</li>
            <li>A brief description of the issue</li>
          </ul>

          <h2>Processing time</h2>
          <p>
            If approved, refunds are issued to the original payment method. Timing depends on your payment provider
            and bank.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

