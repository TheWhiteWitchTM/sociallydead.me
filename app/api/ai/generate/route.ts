import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 })
    }

    const { text } = await generateText({
      model: "openai/gpt-4o-mini",
      prompt,
      maxTokens: 500,
    })

    return Response.json({ text })
  } catch (error) {
    console.error("AI generation error:", error)
    return Response.json(
      { error: "Failed to generate text" },
      { status: 500 }
    )
  }
}
