// pdf2json can be wrapped under `.default` depending on bundling.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf2json = require("pdf2json") as unknown
const PDFParser = (pdf2json as { default?: unknown }).default ?? pdf2json

async function extractTextFromPdfBuffer(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parser = new (PDFParser as any)(null, true)

  await new Promise<void>((resolve, reject) => {
    parser.on("pdfParser_dataError", (err: unknown) => {
      const e = err instanceof Error ? err : (err as { parserError?: Error })?.parserError
      reject(e ?? new Error("Failed to parse PDF."))
    })

    parser.on("pdfParser_dataReady", () => resolve())

    parser.parseBuffer(buffer)
  })

  return parser.getRawTextContent().trim()
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData().catch(() => null)
    const file = formData?.get("file")

    if (!(file instanceof File)) {
      return Response.json({ error: "Missing PDF file." }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return Response.json({ error: "File must be a PDF." }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const text = await extractTextFromPdfBuffer(buffer)

    if (!text) {
      return Response.json({ error: "Could not extract text from PDF." }, { status: 422 })
    }

    return Response.json({ text })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return Response.json({ error: message }, { status: 500 })
  }
}

