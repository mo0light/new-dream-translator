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

    const dream = await db.dream.findUnique({ where: { id } })

    if (!dream) {
      return NextResponse.json({ error: '梦境不存在' }, { status: 404 })
    }

    const html = generateReportHtml({
      id: dream.id,
      title: dream.title,
      rawDescription: dream.rawDescription,
      organizedDream: dream.organizedDream,
      symbols: safeParse(dream.symbols),
      psychologyAnalysis: dream.psychologyAnalysis,
      emotionAnalysis: dream.emotionAnalysis,
      suggestions: safeParse(dream.suggestions),
      overallScore: dream.overallScore,
      moodTag: dream.moodTag,
      category: dream.category,
      reportHtml: dream.reportHtml,
      createdAt: dream.createdAt.toISOString(),
      updatedAt: dream.updatedAt.toISOString(),
    })

    const safeTitle = dream.title.replace(/[^\w一-鿿]/g, '_').slice(0, 30)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="dream-report-${safeTitle}.html"`,
      },
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return NextResponse.json(
      { error: '报告生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}
