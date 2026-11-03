import type { Alternative, Change, Correction, Tone } from '../../shared/types'
import { json, type Env } from '../_lib/env'
import { getUser } from '../_lib/session'

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
const MAX_INPUT = 1200
const TONES: Tone[] = ['formal', 'casual', 'natural', 'concise']

const SCHEMA = {
  type: 'object',
  properties: {
    corrected: { type: 'string' },
    score: { type: 'number' },
    summary: { type: 'string' },
    changes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          original: { type: 'string' },
          corrected: { type: 'string' },
          explanation: { type: 'string' },
        },
        required: ['original', 'corrected', 'explanation'],
      },
    },
    alternatives: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tone: { type: 'string', enum: TONES },
          text: { type: 'string' },
          note: { type: 'string' },
        },
        required: ['tone', 'text', 'note'],
      },
    },
  },
  required: ['corrected', 'score', 'summary', 'changes', 'alternatives'],
}

const SYSTEM = `You are an expert English writing coach for Japanese learners.
Return ONLY JSON matching the schema.
- "corrected": the learner's text with grammar, word choice and naturalness fixed. Keep their meaning.
- "score": 0-100 accuracy/naturalness of the ORIGINAL text.
- "summary": 1-2 sentences in Japanese on the overall feedback.
- "changes": each concrete fix. "original" and "corrected" are short fragments, "explanation" is in Japanese and explains the grammar rule or nuance.
- "alternatives": exactly 4 rewrites with tones "formal", "casual", "natural", "concise". "note" is a short Japanese description of when to use it.
If the text is already perfect, return it unchanged with an empty "changes" array.`

const str = (v: unknown, max = 600) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export function normalize(raw: unknown, original: string): Correction {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const changes: Change[] = (Array.isArray(o.changes) ? o.changes : [])
    .map((c) => ({ original: str(c?.original), corrected: str(c?.corrected), explanation: str(c?.explanation) }))
    .filter((c) => c.corrected || c.explanation)
    .slice(0, 12)
  const alternatives: Alternative[] = (Array.isArray(o.alternatives) ? o.alternatives : [])
    .map((a) => ({
      tone: (TONES.includes(a?.tone) ? a.tone : 'natural') as Tone,
      text: str(a?.text),
      note: str(a?.note, 200),
    }))
    .filter((a) => a.text)
    .slice(0, 6)
  const score = Number(o.score)
  return {
    corrected: str(o.corrected, MAX_INPUT * 2) || original,
    score: Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0,
    summary: str(o.summary),
    changes,
    alternatives,
  }
}

function parseModelOutput(response: unknown) {
  if (response && typeof response === 'object') return response
  if (typeof response !== 'string') return null
  const start = response.indexOf('{')
  const end = response.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(response.slice(start, end + 1))
  } catch {
    return null
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await getUser(request, env)
  if (!user) return json({ error: 'unauthorized' }, { status: 401 })
  if (!env.AI) return json({ error: 'ai_unavailable' }, { status: 503 })

  const body = (await request.json().catch(() => null)) as { text?: unknown; context?: unknown } | null
  const text = str(body?.text, MAX_INPUT)
  if (!text) return json({ error: 'empty_text' }, { status: 400 })
  const context = str(body?.context, 300)

  const result = (await env.AI.run(MODEL as Parameters<Ai['run']>[0], {
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: context ? `Task: ${context}\n\nLearner text:\n${text}` : `Learner text:\n${text}` },
    ],
    response_format: { type: 'json_schema', json_schema: SCHEMA },
    max_tokens: 1400,
    temperature: 0.3,
  } as never)) as { response?: unknown }

  const parsed = parseModelOutput(result?.response)
  if (!parsed) return json({ error: 'bad_model_output' }, { status: 502 })
  return json(normalize(parsed, text))
}
