'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Moon,
  Eye,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScoreRing } from './score-ring'
import type { Dream } from '@/types/dream'

interface DreamHistoryProps {
  dreams: Dream[]
  onDelete: (id: string) => void
  onView: (dream: Dream) => void
  isLoading: boolean
}

export function DreamHistory({ dreams, onDelete, onView, isLoading }: DreamHistoryProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <section id="dream-history" className="w-full max-w-4xl mx-auto px-4 py-6">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 px-5 rounded-xl border border-purple-500/15 bg-purple-950/20 backdrop-blur-lg hover:bg-purple-900/30 transition-all duration-300 group"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-500/15">
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-purple-100">历史梦境</h3>
            <p className="text-xs text-purple-300/50">
              {dreams.length > 0 ? `共 ${dreams.length} 条记录` : '暂无记录'}
            </p>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-5 h-5 text-purple-400/60 group-hover:text-purple-300 transition-colors" />
        </motion.div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                </div>
              ) : dreams.length === 0 ? (
                <div className="text-center py-12">
                  <Moon className="w-10 h-10 text-purple-500/30 mx-auto mb-3" />
                  <p className="text-sm text-purple-300/40">还没有梦境记录</p>
                  <p className="text-xs text-purple-300/30 mt-1">记录你的第一个梦境，开启潜意识探索之旅</p>
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                  {dreams.map((dream) => (
                    <DreamCard
                      key={dream.id}
                      dream={dream}
                      onDelete={onDelete}
                      onView={onView}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}

function DreamCard({
  dream,
  onDelete,
  onView,
}: {
  dream: Dream
  onDelete: (id: string) => void
  onView: (dream: Dream) => void
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleting(true)
    await onDelete(dream.id)
    setIsDeleting(false)
  }

  const dateStr = (() => {
    try {
      return format(new Date(dream.createdAt), 'yyyy-MM-dd HH:mm')
    } catch {
      return dream.createdAt
    }
  })()

  return (
    <Card className="border-purple-500/10 bg-purple-950/15 backdrop-blur-sm hover:bg-purple-900/20 transition-all duration-200 cursor-pointer group py-3 gap-0">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Score mini ring */}
          <div className="flex-shrink-0 hidden sm:block">
            <ScoreRing score={dream.overallScore ?? 0} size={56} strokeWidth={4} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-semibold text-purple-100 truncate">
                {dream.title}
              </h4>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-purple-400/40 hover:text-purple-300 hover:bg-purple-500/10"
                  onClick={() => onView(dream)}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-purple-400/40 hover:text-red-400 hover:bg-red-500/10"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <p className="text-xs text-purple-200/40 mt-1 line-clamp-2">
              {dream.rawDescription}
            </p>

            <div className="flex items-center gap-2 mt-2.5 flex-wrap">
              <span className="text-[10px] text-purple-300/30 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {dateStr}
              </span>
              {dream.moodTag && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 border-violet-400/20 bg-violet-500/10 text-violet-300/70 px-1.5"
                >
                  {dream.moodTag}
                </Badge>
              )}
              {dream.category && (
                <Badge
                  variant="outline"
                  className="text-[10px] h-5 border-purple-400/20 bg-purple-500/10 text-purple-300/70 px-1.5"
                >
                  {dream.category}
                </Badge>
              )}
              <span className="text-[10px] text-purple-400/50 sm:hidden">
                评分: {dream.overallScore ?? '-'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
