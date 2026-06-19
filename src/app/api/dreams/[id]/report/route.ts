import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReportHtml } from '@/lib/report-html'

/**
 * 安全地解析 JSON 字段（兼容字符串和已经是数组的情况）
 */
function safeParse<T>(field: unknown): T[] {
  if (!field) return []
  if (Array.isArray(field)) return field as T[]
  if (typeof field === 'string') {
    try { return JSON.parse(field) } catch { return [] }
  }
  return []
}

/**
 * 生成梦境解读报告
 * 返回格式：HTML（可直接在浏览器中通过 Ctrl+P 打印为 PDF）
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    console.log('[Report] Generating report for dream:', id)

    const dream = await db.dream.findUnique({ where: { id } })

    if (!dream) {
      return NextResponse.json({ error: '梦境不存在' }, { status: 404 })
    }

    const symbols = safeParse(dream.symbols)
    const suggestions = safeParse(dream.suggestions)
    console.log('[Report] Parsed symbols:', symbols.length, 'suggestions:', suggestions.length)

    const html = generateReportHtml({
      id: dream.id,
      title: dream.title,
      rawDescription: dream.rawDescription,
      organizedDream: dream.organizedDream,
      symbols,
      psychologyAnalysis: dream.psychologyAnalysis,
      emotionAnalysis: dream.emotionAnalysis,
      suggestions,
      overallScore: dream.overallScore,
      moodTag: dream.moodTag,
      category: dream.category,
      reportHtml: dream.reportHtml,
      createdAt: dream.createdAt.toISOString(),
      updatedAt: dream.updatedAt.toISOString(),
    })

    const filename = `dream-report-${id}.html`
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[Report] Error:', error instanceof Error ? error.message : error)
    console.error('[Report] Stack:', error instanceof Error ? error.stack : 'no stack')
    return NextResponse.json(
      { error: '报告生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}
