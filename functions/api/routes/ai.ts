import { Hono } from 'hono'
import type { Env } from '../[[route]]'

export const aiRoute = new Hono<{ Bindings: Env }>()

const MODEL = '@cf/meta/llama-3.1-8b-instruct' as const

aiRoute.post('/explain', async (c) => {
  const { code, language = 'unknown' } = await c.req.json<{ code: string; language?: string }>()
  if (!code?.trim()) return c.json({ success: false, error: 'code is required' }, 400)
  if (code.length > 4000) return c.json({ success: false, error: 'Code too long (max 4000 chars)' }, 400)

  const messages = [
    { role: 'system', content: 'You are a senior developer. Explain code clearly and concisely in Chinese. Focus on what it does, key concepts, and any notable patterns or issues.' },
    { role: 'user', content: `请解释以下 ${language} 代码：\n\n\`\`\`${language}\n${code}\n\`\`\`` }
  ]

  const result = await c.env.AI.run(MODEL as keyof AiModels, { messages }) as { response: string }
  return c.json({ success: true, data: { explanation: result.response } })
})

aiRoute.post('/regex', async (c) => {
  const { description } = await c.req.json<{ description: string }>()
  if (!description?.trim()) return c.json({ success: false, error: 'description is required' }, 400)

  const messages = [
    { role: 'system', content: 'You are a regex expert. Given a description, return ONLY a JSON object with: {"pattern": "regex_here", "flags": "gi", "explanation": "brief explanation in Chinese"}. No markdown, no extra text.' },
    { role: 'user', content: description }
  ]

  const result = await c.env.AI.run(MODEL as keyof AiModels, { messages }) as { response: string }
  try {
    const parsed = JSON.parse(result.response.replace(/```json?|```/g, '').trim())
    return c.json({ success: true, data: parsed })
  } catch {
    return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  }
})

aiRoute.post('/sql', async (c) => {
  const { description, schema } = await c.req.json<{ description: string; schema?: string }>()
  if (!description?.trim()) return c.json({ success: false, error: 'description is required' }, 400)

  const schemaContext = schema ? `\n\nDatabase schema:\n\`\`\`sql\n${schema}\n\`\`\`` : ''
  const messages = [
    { role: 'system', content: 'You are a SQL expert. Generate clean, optimized SQL based on the description. Return ONLY a JSON object: {"sql": "SQL_HERE", "explanation": "brief explanation in Chinese"}. No markdown.' },
    { role: 'user', content: `${description}${schemaContext}` }
  ]

  const result = await c.env.AI.run(MODEL as keyof AiModels, { messages }) as { response: string }
  try {
    const parsed = JSON.parse(result.response.replace(/```json?|```/g, '').trim())
    return c.json({ success: true, data: parsed })
  } catch {
    return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  }
})

aiRoute.post('/review', async (c) => {
  const { code, language = 'unknown' } = await c.req.json<{ code: string; language?: string }>()
  if (!code?.trim()) return c.json({ success: false, error: 'code is required' }, 400)
  if (code.length > 4000) return c.json({ success: false, error: 'Code too long (max 4000 chars)' }, 400)

  const messages = [
    {
      role: 'system',
      content: `You are a senior code reviewer. Analyze the code and return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
{
  "security": { "score": 0-100, "issues": ["issue1"], "suggestions": ["suggestion1"] },
  "performance": { "score": 0-100, "issues": ["issue1"], "suggestions": ["suggestion1"] },
  "readability": { "score": 0-100, "issues": ["issue1"], "suggestions": ["suggestion1"] },
  "overall": "综合评价文字"
}
Score rules: 80-100 = good, 60-79 = needs improvement, 0-59 = poor.
All text must be in Chinese. Be specific and actionable.`
    },
    { role: 'user', content: `请审查以下 ${language} 代码：\n\n\`\`\`${language}\n${code}\n\`\`\`` }
  ]

  const result = await c.env.AI.run(MODEL as keyof AiModels, { messages }) as { response: string }
  try {
    const parsed = JSON.parse(result.response.replace(/```json?|```/g, '').trim())
    return c.json({ success: true, data: parsed })
  } catch {
    return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  }
})
