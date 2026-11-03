export type Tone = 'formal' | 'casual' | 'natural' | 'concise'

export interface Change {
  original: string
  corrected: string
  explanation: string
}

export interface Alternative {
  tone: Tone
  text: string
  note: string
}

export interface Correction {
  corrected: string
  score: number
  summary: string
  changes: Change[]
  alternatives: Alternative[]
}

export type TaskKind = 'translate' | 'use' | 'rewrite'

export interface StudyTask {
  id: string
  kind: TaskKind
  prompt: string
  hint: string
}

export interface User {
  sub: string
  email: string
  name: string
  picture?: string
}
