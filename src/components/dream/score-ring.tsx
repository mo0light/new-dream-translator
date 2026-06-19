'use client'

import { useEffect, useState } from 'react'

interface ScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
}

export function ScoreRing({ score, size = 140, strokeWidth = 10 }: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedScore(score)
    }, 100)
    return () => clearTimeout(timer)
  }, [score])

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#a855f7'
    if (s >= 60) return '#8b5cf6'
    if (s >= 40) return '#7c3aed'
    if (s >= 20) return '#6d28d9'
    return '#5b21b6'
  }

  const getScoreLabel = (s: number) => {
    if (s >= 80) return '极佳'
    if (s >= 60) return '良好'
    if (s >= 40) return '一般'
    if (s >= 20) return '较低'
    return '需关注'
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="-rotate-90"
          style={{ filter: `drop-shadow(0 0 8px ${getScoreColor(score)}40)` }}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-purple-900/20"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getScoreColor(score)}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-violet-400 bg-clip-text text-transparent">
            {animatedScore}
          </span>
          <span className="text-xs text-purple-300/70 mt-0.5">分</span>
        </div>
      </div>
      <span
        className="text-sm font-medium px-3 py-1 rounded-full"
        style={{
          background: `${getScoreColor(score)}20`,
          color: getScoreColor(score),
        }}
      >
        {getScoreLabel(score)}
      </span>
    </div>
  )
}
