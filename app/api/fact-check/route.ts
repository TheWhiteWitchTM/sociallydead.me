import { generateText } from 'ai'

export async function POST(req: Request) {
  try {
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return Response.json({ error: 'Text is required' }, { status: 400 })
    }

    const result = await generateText({
      model: 'openai/gpt-4o-mini',
      system: `You are a fact-checking assistant. Analyze the given text and provide a fact-check analysis.

Your response should include:
1. **Claims Identified**: List the main claims made in the text
2. **Analysis**: For each claim, assess if it's:
   - Likely True
   - Likely False
   - Unverifiable (needs more context/evidence)
   - Opinion (not a factual claim)
3. **Summary**: A brief overall assessment

Be concise and balanced. If you can't verify something, say so. Don't make up facts.
Format your response in clean markdown.`,
      prompt: `Please fact-check the following social media post:\n\n"${text}"`,
      maxOutputTokens: 500,
    })

    return Response.json({ result: result.text })
  } catch (error) {
    console.error('Fact-check error:', error)
    return Response.json(
      { error: 'Failed to analyze post' },
      { status: 500 }
    )
  }
}
