import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Privacy Policy | ResumeAI",
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Card className="border-muted bg-muted/10">
        <CardHeader>
          <CardTitle className="text-2xl">Privacy Policy</CardTitle>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toISOString().slice(0, 10)}</p>
        </CardHeader>
        <CardContent className="prose prose-invert max-w-none text-sm leading-6">
          <p>
            This Privacy Policy explains how ResumeAI (“ResumeAI”, “we”, “us”) collects, uses, and shares information
            when you use our AI resume analysis service.
          </p>

          <h2>1. Information We Collect</h2>
          <ul>
            <li>
              <strong>Resume content</strong>: text or PDFs you upload for analysis.
            </li>
            <li>
              <strong>Contact info (optional)</strong>: if you provide an email address.
            </li>
            <li>
              <strong>Usage data</strong>: basic logs needed to operate and secure the service (e.g., request
              timestamps, error logs).
            </li>
          </ul>

          <h2>2. How We Use Information</h2>
          <ul>
            <li>To provide resume analysis and generate feedback.</li>
            <li>To process payments and unlock paid features.</li>
            <li>To maintain, secure, and improve the service.</li>
          </ul>

          <h2>3. AI Processing</h2>
          <p>
            Resume content is processed by our AI provider(s) to generate an analysis. AI outputs may be inaccurate.
            You should review and validate suggestions before using them.
          </p>

          <h2>4. Sharing</h2>
          <p>We may share information with:</p>
          <ul>
            <li>
              <strong>Service providers</strong> that help us run ResumeAI (hosting, database, payments, analytics).
            </li>
            <li>
              <strong>Legal/Compliance</strong> if required by law or to protect rights, safety, and security.
            </li>
          </ul>

          <h2>5. Data Retention</h2>
          <p>
            We retain resume analyses for as long as needed to provide the service and for legitimate business and
            compliance purposes. You can request deletion by emailing{" "}
            <a href="mailto:guthbalint13@gmail.com">guthbalint13@gmail.com</a>.
          </p>

          <h2>6. Security</h2>
          <p>
            We use reasonable safeguards to protect data. However, no method of transmission or storage is 100%
            secure.
          </p>

          <h2>7. Your Choices</h2>
          <ul>
            <li>You may choose not to provide an email.</li>
            <li>You may request access, correction, or deletion of your data by contacting us.</li>
          </ul>

          <h2>8. Contact</h2>
          <p>
            For privacy questions or requests, email{" "}
            <a href="mailto:guthbalint13@gmail.com">guthbalint13@gmail.com</a>.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}

