import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Terms of Service | ResumeAI",
}

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Card className="border-muted bg-muted/10">
        <CardHeader>
          <CardTitle className="text-2xl">Terms of Service</CardTitle>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toISOString().slice(0, 10)}</p>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none text-sm leading-6">
          <p>
            These Terms of Service (“Terms”) govern your access to and use of ResumeAI (“ResumeAI”, “we”, “us”).
            By accessing or using the service, you agree to these Terms.
          </p>

          <h2>1. The Service</h2>
          <p>
            ResumeAI provides an AI-assisted resume analysis tool intended to offer feedback and suggestions. The
            service is provided for informational purposes only and does not guarantee interview invites, job offers,
            or specific outcomes.
          </p>

          <h2>2. Eligibility</h2>
          <p>You must be at least 16 years old to use ResumeAI.</p>

          <h2>3. Your Content</h2>
          <p>
            You may submit resume text or PDF files to be analyzed (“Content”). You represent that you have the
            necessary rights to submit the Content and that it does not violate applicable law or third-party rights.
          </p>

          <h2>4. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>Use the service for unlawful, harmful, or abusive purposes.</li>
            <li>Attempt to reverse engineer, scrape, or interfere with the service.</li>
            <li>Upload malware or attempt unauthorized access to systems.</li>
          </ul>

          <h2>5. Payments</h2>
          <p>
            ResumeAI may offer paid features. Prices are shown at checkout. Payments are processed by a third‑party
            payment provider. We do not store your full payment card details.
          </p>

          <h2>6. Refunds</h2>
          <p>
            Please review our Refund Policy for details. If you have questions, contact{" "}
            <a href="mailto:guthbalint13@gmail.com">guthbalint13@gmail.com</a>.
          </p>

          <h2>7. Disclaimers</h2>
          <p>
            The service is provided “as is” and “as available”. AI output may be inaccurate, incomplete, or biased.
            You are responsible for reviewing and validating suggestions before using them.
          </p>

          <h2>8. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, ResumeAI will not be liable for any indirect, incidental, special,
            consequential, or punitive damages, or any loss of profits, data, or goodwill resulting from your use of
            the service.
          </p>

          <h2>9. Changes</h2>
          <p>
            We may update these Terms from time to time. Continued use of the service after changes become effective
            constitutes acceptance of the updated Terms.
          </p>

          <h2>10. Contact</h2>
          <p>
            If you have questions about these Terms, contact{" "}
            <a href="mailto:guthbalint13@gmail.com">guthbalint13@gmail.com</a>.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

