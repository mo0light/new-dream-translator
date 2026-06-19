'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Wand2, Globe } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const EXAMPLE_PROMPTS = [
  { label: '飞行之梦', text: '我梦见自己在天空中自由飞翔，穿过云层，俯瞰城市，感受到前所未有的自由和轻盈。突然风变大了，我开始有些害怕...' },
  { label: '坠落之梦', text: '梦见自己从一座很高的建筑物上坠落，周围的一切都在快速后退，心跳加速，但在即将落地的时候突然惊醒了。' },
  { label: '追逐之梦', text: '梦见被一个看不清面容的黑影追赶，我拼命地跑但总觉得跑不快，腿像灌了铅一样沉重，心跳得很快很害怕。' },
  { label: '海洋之梦', text: '梦见自己站在一片无边无际的海洋前，海水碧蓝清澈，我慢慢走进海里，水温柔地包围了我，感到平静又有些不安。' },
]

interface DreamInputProps {
  onSubmit: (title: string, description: string) => void
  isLoading: boolean
  loadingStage?: string
}

export function DreamInput({ onSubmit, isLoading, loadingStage }: DreamInputProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) return
    onSubmit(title.trim(), description.trim())
  }

  const handleExampleClick = (prompt: typeof EXAMPLE_PROMPTS[number]) => {
    setTitle(prompt.label)
    setDescription(prompt.text)
  }

  // Determine the loading display text
  const getLoadingText = () => {
    if (loadingStage) return loadingStage
    return 'AI深度解读中...'
  }

  return (
    <section id="dream-input" className="w-full max-w-2xl mx-auto px-4">
      <div className="relative">
        {/* Glass card */}
        <div className="rounded-2xl border border-purple-500/20 bg-purple-950/30 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-purple-900/20">
          {/* Glow effect */}
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-purple-500/20 via-transparent to-violet-500/10 pointer-events-none" />

          <div className="relative space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/30">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-purple-100">记录你的梦境</h2>
                <p className="text-sm text-purple-300/60">描述越详细，解读越精准</p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-200/80">
                  梦境标题
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="给梦境起个名字..."
                  className="bg-purple-900/30 border-purple-500/20 text-purple-100 placeholder:text-purple-400/40 focus-visible:border-purple-400/50 focus-visible:ring-purple-400/20 h-11"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-200/80">
                  梦境描述
                </label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述你的梦境...包括场景、人物、情感和细节"
                  className="bg-purple-900/30 border-purple-500/20 text-purple-100 placeholder:text-purple-400/40 focus-visible:border-purple-400/50 focus-visible:ring-purple-400/20 min-h-[140px] resize-none"
                  disabled={isLoading}
                />
              </div>

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isLoading || !title.trim() || !description.trim()}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-600/30 hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50 disabled:shadow-none border-0"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{getLoadingText()}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <Sparkles className="w-4 h-4" />
                    联网解读梦境
                  </span>
                )}
              </Button>
            </form>

            {/* Example prompts */}
            <div className="space-y-3">
              <p className="text-xs text-purple-300/50 font-medium">试试这些示例梦境：</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.label}
                    onClick={() => handleExampleClick(prompt)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs rounded-full border border-purple-500/20 bg-purple-900/20 text-purple-300/70 hover:bg-purple-800/30 hover:text-purple-200 hover:border-purple-400/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
