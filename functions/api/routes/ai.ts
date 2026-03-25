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

aiRoute.post('/json-schema', async (c) => {
  const { json } = await c.req.json<{ json: string }>()
  if (!json?.trim()) return c.json({ success: false, error: 'json is required' }, 400)
  if (json.length > 8000) return c.json({ success: false, error: 'JSON too long (max 8000 chars)' }, 400)

  const messages = [
    {
      role: 'system',
      content: `You are a JSON Schema expert. Given a JSON sample, generate a comprehensive JSON Schema with Chinese descriptions. Return ONLY a valid JSON object (no markdown, no extra text) with this structure:
{
  "schema": "the complete JSON Schema as a formatted string with proper indentation",
  "explanation": "brief explanation in Chinese about the schema structure"
}
The schema should include:
- Proper type definitions
- Required fields
- Descriptions in Chinese for each property
- Appropriate constraints (minLength, maxLength, minimum, maximum, pattern, etc.)
- Handle nested objects and arrays correctly
- Use Draft-07 JSON Schema format`
    },
    { role: 'user', content: `请为以下JSON生成JSON Schema：\n\n${json}` }
  ]

  const result = await c.env.AI.run(MODEL as keyof AiModels, { messages }) as { response: string }
  try {
    const parsed = JSON.parse(result.response.replace(/```json?|```/g, '').trim())
    return c.json({ success: true, data: parsed })
  } catch {
    return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  }
})

aiRoute.post('/commit-msg', async (c) => {
  const { diff } = await c.req.json<{ diff: string }>()
  if (!diff?.trim()) return c.json({ success: false, error: 'diff is required' }, 400)
  if (diff.length > 8000) return c.json({ success: false, error: 'Diff too long (max 8000 chars)' }, 400)

  const messages = [
    {
      role: 'system',
      content: `You are a Git expert. Analyze the diff and generate a Conventional Commits message. Return ONLY a valid JSON object (no markdown, no extra text) with this structure:
{
  "message": "the complete commit message in Conventional Commits format",
  "type": "feat/fix/docs/style/refactor/perf/test/chore",
  "scope": "affected scope (optional, e.g., api, ui, auth)",
  "description": "brief description in Chinese",
  "body": "optional detailed explanation in Chinese if the change is complex"
}
Conventional Commits format: type(scope): description\n\n[optional body]\n\n[optional footer]
Rules:
- Use Chinese for description and body
- Keep description under 50 characters
- Use imperative mood (添加, 修复, 更新, etc.)
- Be specific and concise`
    },
    { role: 'user', content: `请分析以下Git diff并生成提交信息：\n\n${diff}` }
  ]

  const result = await c.env.AI.run(MODEL as keyof AiModels, { messages }) as { response: string }
  try {
    const parsed = JSON.parse(result.response.replace(/```json?|```/g, '').trim())
    return c.json({ success: true, data: parsed })
  } catch {
    return c.json({ success: false, error: 'Failed to parse AI response' }, 500)
  }
})
