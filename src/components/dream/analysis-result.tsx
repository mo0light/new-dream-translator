'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Brain,
  Heart,
  Lightbulb,
  Star,
  Tag,
  Hash,
  Download,
  Eye,
  Loader2,
  Globe,
  ExternalLink,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScoreRing } from './score-ring'
import type { Dream, DreamSymbol, Suggestion, SearchSource } from '@/types/dream'

interface AnalysisResultProps {
  dream: Dream
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

function parseJsonField<T>(field: T[] | string | null): T[] {
  if (!field) return []
  if (Array.isArray(field)) return field
  try {
    const parsed = JSON.parse(field as unknown as string)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function GlassCard({
  children,
  className = '',
  icon: Icon,
  title,
  gradient,
}: {
  children: React.ReactNode
  className?: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  gradient: string
}) {
  return (
    <motion.div variants={itemVariants}>
      <Card className={`border-purple-500/15 bg-purple-950/20 backdrop-blur-lg overflow-hidden ${className}`}>
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${gradient}`} />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2.5 text-base">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/15">
              <Icon className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-purple-100">{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  )
}

export function AnalysisResult({ dream }: AnalysisResultProps) {
  const symbols = parseJsonField<DreamSymbol>(dream.symbols)
  const suggestions = parseJsonField<Suggestion>(dream.suggestions)
  const searchSources = parseJsonField<SearchSource>(dream.searchSources)
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadReport = async () => {
    setIsDownloading(true)
    try {
      const res = await fetch(`/api/dreams/${dream.id}/report`, { method: 'POST' })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || '报告生成失败')
      }

      // 下载 HTML 报告（可在浏览器中按 Ctrl+P 打印为 PDF）
      const htmlContent = await res.text()
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `梦境解读报告-${dream.title}.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Download report error:', err)
      alert(err instanceof Error ? err.message : '报告下载失败，请稍后重试')
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePreviewReport = async () => {
    try {
      const res = await fetch(`/api/dreams/${dream.id}/report`, { method: 'POST' })
      if (!res.ok) throw new Error('报告生成失败')
      const html = await res.text()
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '预览失败，请稍后重试')
    }
  }

  return (
    <section id="analysis-result" className="w-full max-w-4xl mx-auto px-4 py-8">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-300 via-violet-300 to-purple-400 bg-clip-text text-transparent">
          梦境解读报告
        </h2>
        <p className="text-sm text-purple-300/50 mt-2">{dream.title}</p>

        {/* Report buttons */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <motion.button
            onClick={handlePreviewReport}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg border border-purple-500/30 bg-purple-950/40 text-purple-200 text-sm font-medium hover:bg-purple-900/50 transition-all duration-300"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Eye className="w-4 h-4" />
            预览报告
          </motion.button>
          <motion.button
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600/80 to-violet-600/80 text-white text-sm font-medium shadow-lg shadow-purple-600/20 hover:from-purple-500 hover:to-violet-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isDownloading ? 1 : 1.02 }}
            whileTap={{ scale: isDownloading ? 1 : 0.98 }}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                下载 HTML 报告
              </>
            )}
          </motion.button>
        </div>
        <p className="mt-2 text-xs text-purple-400/40">报告可在浏览器中按 Ctrl+P 打印为 PDF</p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6"
      >
        {/* Organized Dream */}
        <GlassCard
          icon={BookOpen}
          title="梦境整理"
          gradient="from-purple-500/60 via-violet-500/40 to-transparent"
          className="md:col-span-2"
        >
          <p className="text-purple-200/80 leading-relaxed text-sm whitespace-pre-wrap">
            {dream.organizedDream || '暂无整理结果'}
          </p>
        </GlassCard>

        {/* Symbol Interpretation */}
        <GlassCard
          icon={Star}
          title="意象解读"
          gradient="from-violet-500/60 via-purple-500/40 to-transparent"
        >
          {symbols.length > 0 ? (
            <div className="space-y-3">
              {symbols.map((symbol, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-purple-400/30 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 text-xs"
                    >
                      {symbol.name}
                    </Badge>
                  </div>
                  <p className="text-xs text-purple-200/60 leading-relaxed pl-1">
                    {symbol.meaning}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-purple-300/40 text-sm">暂无意象解读</p>
          )}
        </GlassCard>

        {/* Score */}
        <GlassCard
          icon={Hash}
          title="综合评分"
          gradient="from-fuchsia-500/60 via-violet-500/40 to-transparent"
        >
          <div className="flex items-center justify-center py-2">
            <ScoreRing score={dream.overallScore ?? 0} />
          </div>
        </GlassCard>

        {/* Psychology Analysis */}
        <GlassCard
          icon={Brain}
          title="心理分析"
          gradient="from-purple-500/60 via-fuchsia-500/40 to-transparent"
          className="md:col-span-2"
        >
          <p className="text-purple-200/80 leading-relaxed text-sm whitespace-pre-wrap">
            {dream.psychologyAnalysis || '暂无心理分析'}
          </p>
        </GlassCard>

        {/* Emotion Analysis */}
        <GlassCard
          icon={Heart}
          title="情感分析"
          gradient="from-pink-500/60 via-purple-500/40 to-transparent"
        >
          <p className="text-purple-200/80 leading-relaxed text-sm whitespace-pre-wrap">
            {dream.emotionAnalysis || '暂无情感分析'}
          </p>
        </GlassCard>

        {/* Category & Mood Tags */}
        <GlassCard
          icon={Tag}
          title="梦境分类"
          gradient="from-violet-500/60 via-fuchsia-500/40 to-transparent"
        >
          <div className="flex flex-wrap gap-2">
            {dream.category && (
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/20 hover:bg-purple-500/30">
                {dream.category}
              </Badge>
            )}
            {dream.moodTag && (
              <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/20 hover:bg-violet-500/30">
                {dream.moodTag}
              </Badge>
            )}
            {!dream.category && !dream.moodTag && (
              <p className="text-purple-300/40 text-sm">暂无分类信息</p>
            )}
          </div>
        </GlassCard>

        {/* Suggestions */}
        <GlassCard
          icon={Lightbulb}
          title="建议指导"
          gradient="from-amber-500/40 via-purple-500/30 to-transparent"
          className="md:col-span-2"
        >
          {suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((suggestion, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/15 flex items-center justify-center mt-0.5">
                    <span className="text-xs font-medium text-purple-400">{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-purple-200/90">
                      {suggestion.title}
                    </h4>
                    <p className="text-xs text-purple-200/60 mt-1 leading-relaxed">
                      {suggestion.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-purple-300/40 text-sm">暂无建议指导</p>
          )}
        </GlassCard>

        {/* Web Search Sources */}
        {searchSources.length > 0 && (
          <GlassCard
            icon={Globe}
            title="参考来源"
            gradient="from-emerald-500/40 via-purple-500/30 to-transparent"
            className="md:col-span-2"
          >
            <p className="text-xs text-purple-300/50 mb-3">
              以下内容经由互联网搜索获取，分析中已参考相关资料
            </p>
            <div className="space-y-2.5">
              {searchSources.map((source, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-purple-900/20 hover:bg-purple-800/25 transition-colors group"
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded bg-purple-500/15 flex items-center justify-center mt-0.5">
                    <span className="text-[10px] font-medium text-purple-400">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-purple-200/80 hover:text-purple-100 truncate transition-colors"
                      >
                        {source.title}
                      </a>
                      <ExternalLink className="w-3 h-3 text-purple-400/40 group-hover:text-purple-300 transition-colors flex-shrink-0" />
                    </div>
                    <p className="text-[11px] text-purple-200/50 mt-0.5 line-clamp-2 leading-relaxed">
                      {source.snippet}
                    </p>
                    <p className="text-[10px] text-purple-300/30 mt-1">
                      {source.hostName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </motion.div>
    </section>
  )
}
