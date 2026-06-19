'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sparkles, ArrowDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { DreamInput } from '@/components/dream/dream-input'
import { AnalysisResult } from '@/components/dream/analysis-result'
import { DreamHistory } from '@/components/dream/dream-history'
import type { Dream } from '@/types/dream'

export default function Home() {
  const [currentDream, setCurrentDream] = useState<Dream | null>(null)
  const [dreams, setDreams] = useState<Dream[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
  const [isHistoryLoading, setIsHistoryLoading] = useState(true)
  const resultRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Fetch dream history
  const fetchDreams = useCallback(async () => {
    setIsHistoryLoading(true)
    try {
      const res = await fetch('/api/dreams')
      if (res.ok) {
        const data = await res.json()
        setDreams(data.dreams || [])
      }
    } catch {
      // Silently handle - history is non-critical
    } finally {
      setIsHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDreams()
  }, [fetchDreams])

  /**
   * Make a fetch request with automatic retry for transient errors.
   * Retries on: network errors, 429, 503, 500, and non-JSON responses
   */
  const fetchWithRetry = async (
    url: string,
    options: RequestInit,
    maxRetries = 3
  ): Promise<Response> => {
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = 3000 * attempt // 3s, 6s, 9s
          setLoadingStage(`连接不稳定，第${attempt}次重试中...`)
          console.log(`[DreamAnalyzer] Retry attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          setLoadingStage('正在连接AI解读服务...')
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 120000)

        const res = await fetch(url, {
          ...options,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        console.log('[DreamAnalyzer] Response received:', res.status, res.statusText)

        // If response is OK, verify it's valid JSON before returning
        if (res.ok) {
          // Clone the response so we can read the body without consuming it
          const cloned = res.clone()
          try {
            await cloned.json()
            // Valid JSON response - return original response
            return res
          } catch {
            // Response claimed to be OK but body is not valid JSON
            // This can happen when server restarts mid-response
            console.warn('[DreamAnalyzer] Response OK but not valid JSON, retrying...')
            if (attempt < maxRetries) continue
            throw new Error('服务器返回了无效的响应格式')
          }
        }

        // For server errors, try to parse the error body
        let errorMsg = '解读失败，请稍后重试'
        let isRetryable = false

        try {
          const errorData = await res.json()
          errorMsg = errorData.error || errorData.detail || errorMsg
        } catch {
          // Response body is not JSON (e.g., HTML error page from proxy)
          // This is usually retryable
          errorMsg = `服务器错误(${res.status})`
          isRetryable = true
        }

        // Determine if this error is retryable
        if (!isRetryable) {
          isRetryable = res.status === 429 || res.status === 503 || res.status === 500
        }

        if (isRetryable && attempt < maxRetries) {
          console.warn(`[DreamAnalyzer] Retryable error ${res.status}, will retry...`)
          lastError = new Error(errorMsg)
          continue
        }

        // Non-retryable error or max retries exhausted
        throw new Error(errorMsg)

      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          if (attempt < maxRetries) {
            console.warn('[DreamAnalyzer] Request timed out, retrying...')
            lastError = new Error('请求超时')
            continue
          }
          throw new Error('请求超时，分析时间过长，请稍后重试')
        }

        if (err instanceof TypeError) {
          // Network error (fetch failed entirely)
          if (attempt < maxRetries) {
            console.warn('[DreamAnalyzer] Network error, retrying...')
            lastError = new Error('网络连接失败')
            continue
          }
          throw new Error('网络连接失败，请检查网络后重试')
        }

        // Our own thrown errors - these should not be retried
        // (they already went through the retry logic above)
        throw err
      }
    }

    throw lastError || new Error('请求失败，请稍后重试')
  }

  // Submit dream for analysis
  const handleSubmit = async (title: string, description: string) => {
    setIsLoading(true)
    setCurrentDream(null)
    setLoadingStage('正在连接AI解读服务...')

    try {
      console.log('[DreamAnalyzer] Starting analysis...', { title })

      const res = await fetchWithRetry('/api/dreams/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      }, 3)

      setLoadingStage('正在解析解读结果...')

      const data = await res.json()
      console.log('[DreamAnalyzer] Analysis complete:', data.dream?.id)

      if (!data.dream) {
        console.error('[DreamAnalyzer] No dream data in response')
        throw new Error('解读结果异常，请稍后重试')
      }

      setCurrentDream(data.dream)
      await fetchDreams()

      toast({
        title: '解读完成 ✨',
        description: '你的梦境已被成功解读',
      })

      // Scroll to result after a short delay
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 300)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '请稍后重试'
      console.error('[DreamAnalyzer] Final error:', errorMsg)

      toast({
        title: '解读失败',
        description: errorMsg,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setLoadingStage('')
    }
  }

  // Delete a dream
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/dreams/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      setDreams((prev) => prev.filter((d) => d.id !== id))
      if (currentDream?.id === id) setCurrentDream(null)
      toast({
        title: '已删除',
        description: '梦境记录已删除',
      })
    } catch {
      toast({
        title: '删除失败',
        description: '请稍后重试',
        variant: 'destructive',
      })
    }
  }

  // View a dream from history
  const handleView = (dream: Dream) => {
    setCurrentDream(dream)
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  // Scroll to input section
  const scrollToInput = () => {
    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a1a]">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/dream-bg.png')" }}
        />

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a]/60 via-[#0a0a1a]/40 to-[#0a0a1a]" />
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-violet-900/20" />

        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-purple-600/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-violet-600/10 blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full bg-fuchsia-600/8 blur-[60px] animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-purple-600/30">
                  <Moon className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-400 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                梦境翻译官
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-purple-200/60 mb-8 max-w-lg mx-auto leading-relaxed">
              探索潜意识的秘密，解读梦境的密码
            </p>

            {/* CTA button */}
            <motion.button
              onClick={scrollToInput}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 text-white font-semibold shadow-xl shadow-purple-600/25 hover:shadow-purple-500/40 hover:from-purple-500 hover:to-violet-500 transition-all duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkles className="w-5 h-5" />
              开始解读梦境
            </motion.button>
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ArrowDown className="w-5 h-5 text-purple-400/40" />
        </motion.div>
      </section>

      {/* Main content area */}
      <main className="flex-1 relative">
        {/* Ambient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a1a] via-[#0d0d22] to-[#0a0a1a]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-purple-800/8 blur-[120px]" />

        <div className="relative z-10 py-12 space-y-6">
          {/* Dream Input */}
          <div ref={inputRef}>
            <DreamInput onSubmit={handleSubmit} isLoading={isLoading} loadingStage={loadingStage} />
          </div>

          {/* Analysis Result */}
          <div ref={resultRef}>
            <AnimatePresence mode="wait">
              {currentDream && (
                <motion.div
                  key={currentDream.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <AnalysisResult dream={currentDream} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* History */}
          <DreamHistory
            dreams={dreams}
            onDelete={handleDelete}
            onView={handleView}
            isLoading={isHistoryLoading}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-purple-500/10 bg-[#08081a]">
        <div className="max-w-4xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-purple-300/30">
            梦境翻译官 © 2025 | 探索内心世界
          </p>
        </div>
      </footer>
    </div>
  )
}
