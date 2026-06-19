import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { chatCompletion } from '@/lib/ai'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `你是一位专业的梦境翻译官，拥有深厚的心理学知识背景，精通弗洛伊德精神分析理论、荣格分析心理学以及现代认知心理学。

你的任务是分析用户描述的梦境，从心理学角度进行深入解读，并提供实用建议。

【重要】你必须只返回一个合法的JSON对象，不要使用markdown代码块包裹，不要在JSON前后添加任何文字、标记或说明。直接返回纯JSON文本。

返回格式如下：
{
  "organizedDream": "将用户原始梦境描述整理为逻辑清晰、叙事流畅的梦境故事",
  "symbols": [
    {
      "name": "梦境中的意象/符号名称",
      "meaning": "该符号的心理学含义解读"
    }
  ],
  "psychologyAnalysis": "基于弗洛伊德、荣格及现代心理学的综合分析，深入解读梦境背后的潜意识含义、心理冲突和内在需求",
  "emotionAnalysis": "分析梦境反映的情感状态，包括主要情绪、情绪强度、情绪来源及可能的情绪模式",
  "suggestions": [
    {
      "title": "建议标题",
      "content": "具体、可操作的建议内容"
    }
  ],
  "overallScore": 75,
  "moodTag": "情绪标签",
  "category": "梦境分类"
}

分析要求：
1. organizedDream：保留原始细节，但以更加流畅、有逻辑的方式叙述梦境，补充合理的心理场景描述
2. symbols：识别3-5个核心梦境符号/意象，基于荣格原型理论和弗洛伊德象征理论解读其心理含义
3. psychologyAnalysis：结合多种心理学流派进行深度分析，至少200字，包含弗洛伊德视角、荣格视角、现代认知心理学视角
4. emotionAnalysis：详细分析梦中的情绪体验，识别核心情绪和次要情绪，分析情绪的心理功能
5. suggestions：提供3-5条实用建议，每条建议应具体可操作
6. overallScore：综合心理健康评分（0-100）
7. moodTag：用1-2个词概括梦境的主要情绪基调
8. category：根据梦境内容进行分类

再次强调：只返回纯JSON，不要用\`\`\`包裹，不要添加任何额外文字。`

/**
 * 从 LLM 响应中提取 JSON 字符串（处理 markdown 代码块等情况）
 */
function extractJsonFromResponse(response: string): string {
  const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*)```/)
  if (codeBlockMatch) return codeBlockMatch[1].trim()

  const firstBrace = response.indexOf('{')
  if (firstBrace !== -1) {
    let depth = 0, inString = false, escapeNext = false, lastBrace = -1
    for (let i = firstBrace; i < response.length; i++) {
      const ch = response[i]
      if (escapeNext) { escapeNext = false; continue }
      if (ch === '\\') { escapeNext = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') depth++
      else if (ch === '}') { depth--; if (depth === 0) { lastBrace = i; break } }
    }
    if (lastBrace > firstBrace) return response.substring(firstBrace, lastBrace + 1)
  }

  return response.trim()
}

/**
 * 清理常见 JSON 格式问题（仅处理字符串外的字符）
 */
function cleanJsonString(jsonStr: string): string {
  let result = jsonStr.replace(/^﻿/, '')
  result = result.replace(/,\s*([}\]])/g, '$1')

  let cleaned = '', inStr = false, escape = false
  for (let i = 0; i < result.length; i++) {
    const ch = result[i]
    if (escape) { cleaned += ch; escape = false; continue }
    if (ch === '\\') { cleaned += ch; escape = true; continue }
    if (ch === '"') { inStr = !inStr; cleaned += ch; continue }
    if (!inStr && ch.charCodeAt(0) >= 0 && ch.charCodeAt(0) <= 0x1f) { cleaned += ' '; continue }
    cleaned += ch
  }
  return cleaned.trim()
}

/**
 * 更激进的 JSON 修复
 */
function aggressiveJsonRepair(jsonStr: string): string {
  let result = jsonStr.replace(/'/g, '"')
  result = result.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
  result = result.replace(/""(\w+)""/g, '"$1"')
  return result
}

/**
 * 多策略解析 LLM 返回的 JSON
 */
function parseLLMResponse(response: string): Record<string, unknown> {
  const extracted = extractJsonFromResponse(response)

  try { return JSON.parse(extracted) } catch { /* fall through */ }
  try { return JSON.parse(cleanJsonString(extracted)) } catch { /* fall through */ }
  try { return JSON.parse(aggressiveJsonRepair(cleanJsonString(extracted))) } catch { /* fall through */ }

  const simple = response.substring(response.indexOf('{'), response.lastIndexOf('}') + 1)
  try { return JSON.parse(simple) } catch { /* fall through */ }

  console.error('[Parse] All strategies failed. Response:', response.substring(0, 500))
  throw new Error('无法解析 AI 返回的 JSON')
}

/**
 * 当 AI 调用完全失败时，返回基础分析
 */
function createFallbackAnalysis(title: string, description: string): Record<string, unknown> {
  return {
    organizedDream: description,
    symbols: [
      { name: '梦境主体', meaning: '这个梦境反映了潜意识中的某种心理需求或情感体验，建议结合自身现实情况进行反思。' }
    ],
    psychologyAnalysis: `关于"${title}"的梦境：从精神分析角度来看，梦境是潜意识欲望和冲突的表达。这个梦境可能与您近期的心理状态、压力或内心冲突有关。建议您关注梦中的情感体验，思考它们与现实生活的联系。由于 AI 服务暂时不可用，以上仅为初步分析，请稍后重新尝试获取更详细的解读。`,
    emotionAnalysis: '梦境中的情感体验值得进一步探索，建议关注梦中的核心情绪及其与日常生活的关联。',
    suggestions: [
      { title: '记录梦境细节', content: '建议每天醒来后立即记录梦境，包括场景、人物、情感等细节，有助于理解潜意识活动。' },
      { title: '反思情感联系', content: '思考梦境中的情感体验是否与现实生活中的某些情境相关，这有助于发现潜意识的表达。' },
      { title: '稍后重试', content: '当前 AI 服务暂时不可用，建议您稍后重新提交梦境描述，获取更详细的心理学解读。' }
    ],
    overallScore: 50,
    moodTag: '待分析',
    category: '待分类',
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: '标题不能为空' }, { status: 400 })
    }
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json({ error: '梦境描述不能为空' }, { status: 400 })
    }

    const trimmedTitle = title.trim()
    const trimmedDesc = description.trim()
    console.log(`[Analyze] Starting: "${trimmedTitle}"`)

    let parsed: Record<string, unknown> | null = null

    // 调用 AI 模型
    try {
      const content = await chatCompletion([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `梦境标题：${trimmedTitle}\n梦境描述：${trimmedDesc}` },
      ])
      parsed = parseLLMResponse(content)
      console.log('[Analyze] AI response parsed successfully')
    } catch (err) {
      console.warn('[Analyze] AI call failed:', err instanceof Error ? err.message : String(err))
    }

    // AI 完全失败时使用 fallback
    if (!parsed) {
      console.warn('[Analyze] Using fallback analysis')
      parsed = createFallbackAnalysis(trimmedTitle, trimmedDesc)
    }

    const organizedDream = typeof parsed.organizedDream === 'string' ? parsed.organizedDream : ''
    const symbols = Array.isArray(parsed.symbols) ? JSON.stringify(parsed.symbols) : JSON.stringify([])
    const psychologyAnalysis = typeof parsed.psychologyAnalysis === 'string' ? parsed.psychologyAnalysis : ''
    const emotionAnalysis = typeof parsed.emotionAnalysis === 'string' ? parsed.emotionAnalysis : ''
    const suggestions = Array.isArray(parsed.suggestions) ? JSON.stringify(parsed.suggestions) : JSON.stringify([])
    const overallScore = typeof parsed.overallScore === 'number'
      ? Math.max(0, Math.min(100, parsed.overallScore))
      : 50
    const moodTag = typeof parsed.moodTag === 'string' ? parsed.moodTag : ''
    const category = typeof parsed.category === 'string' ? parsed.category : ''

    const dream = await db.dream.create({
      data: {
        title: trimmedTitle,
        rawDescription: trimmedDesc,
        organizedDream,
        symbols,
        psychologyAnalysis,
        emotionAnalysis,
        suggestions,
        overallScore,
        moodTag,
        category,
      },
    })

    console.log(`[Analyze] Done, dream ID: ${dream.id}`)
    return NextResponse.json({ dream }, { status: 201 })
  } catch (error) {
    console.error('[Analyze] Error:', error)

    const errorMessage = error instanceof Error ? error.message : String(error)

    // 如果是 AI_API_KEY 未配置的特定错误，给出友好提示
    if (errorMessage.includes('AI_API_KEY')) {
      return NextResponse.json(
        { error: errorMessage, detail: '请检查 .env.local 中的 AI_API_KEY 配置' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: '梦境分析过程中出现错误，请稍后重试', detail: errorMessage },
      { status: 500 }
    )
  }
}
