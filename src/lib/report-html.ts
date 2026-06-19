import type { Dream, DreamSymbol, Suggestion } from '@/types/dream'

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

function getScoreLabel(score: number): string {
  if (score >= 90) return '极佳'
  if (score >= 75) return '良好'
  if (score >= 60) return '一般'
  if (score >= 40) return '较低'
  return '需关注'
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981'
  if (score >= 75) return '#8b5cf6'
  if (score >= 60) return '#f59e0b'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

export function generateReportHtml(dream: Dream): string {
  const symbols = parseJsonField<DreamSymbol>(dream.symbols)
  const suggestions = parseJsonField<Suggestion>(dream.suggestions)
  const score = dream.overallScore ?? 0
  const scoreLabel = getScoreLabel(score)
  const scoreColor = getScoreColor(score)
  const dreamDate = formatDate(dream.createdAt)

  // SVG score ring (same logic as frontend ScoreRing)
  const circumference = 2 * Math.PI * 45
  const progress = (score / 100) * circumference
  const dashOffset = circumference - progress

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>梦境解读报告 - ${escapeHtml(dream.title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=Noto+Serif+SC:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --c-primary: #7c3aed;
      --c-primary-light: #a78bfa;
      --c-primary-dark: #5b21b6;
      --c-accent: #c084fc;
      --c-bg-page: #0f0a1e;
      --c-bg-card: rgba(88, 28, 135, 0.15);
      --c-bg-card-border: rgba(139, 92, 246, 0.2);
      --c-text-primary: #e8e0f0;
      --c-text-secondary: rgba(216, 180, 254, 0.7);
      --c-text-muted: rgba(167, 139, 250, 0.5);
      --c-divider: rgba(139, 92, 246, 0.15);
    }

    @page {
      size: A4;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      margin: 0;
      padding: 0;
      background: var(--c-bg-page);
      color: var(--c-text-primary);
      font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    @media screen {
      html {
        display: flex;
        justify-content: center;
        background: #1a1a2e;
      }
      body {
        width: 210mm;
        box-shadow: 0 0 40px rgba(0,0,0,0.5);
      }
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 0;
      position: relative;
      page-break-after: always;
    }

    .page:last-child {
      page-break-after: auto;
    }

    /* ── Cover Page ── */
    .cover-page {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 297mm;
      padding: 60px 70px;
      position: relative;
      background: linear-gradient(160deg, #0f0a1e 0%, #1a0e30 40%, #160b28 70%, #0f0a1e 100%);
    }

    .cover-page::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -20%;
      width: 140%;
      height: 200%;
      background: radial-gradient(ellipse at 30% 40%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
                  radial-gradient(ellipse at 70% 60%, rgba(192, 132, 252, 0.06) 0%, transparent 40%);
      pointer-events: none;
    }

    .cover-moon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #a78bfa, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 40px;
      box-shadow: 0 0 40px rgba(139, 92, 246, 0.3), 0 0 80px rgba(139, 92, 246, 0.1);
      position: relative;
      z-index: 1;
    }

    .cover-moon svg {
      width: 40px;
      height: 40px;
      fill: white;
    }

    .cover-subtitle {
      font-family: 'Noto Serif SC', serif;
      font-size: 14px;
      font-weight: 400;
      color: var(--c-text-muted);
      letter-spacing: 6px;
      text-transform: uppercase;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }

    .cover-title {
      font-family: 'Noto Serif SC', serif;
      font-size: 38px;
      font-weight: 700;
      background: linear-gradient(135deg, #c4b5fd, #a78bfa, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-align: center;
      margin-bottom: 50px;
      position: relative;
      z-index: 1;
      line-height: 1.4;
    }

    .cover-dream-title {
      font-family: 'Noto Serif SC', serif;
      font-size: 24px;
      font-weight: 600;
      color: var(--c-text-primary);
      text-align: center;
      margin-bottom: 30px;
      position: relative;
      z-index: 1;
      padding: 0 20px;
    }

    .cover-meta {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      position: relative;
      z-index: 1;
    }

    .cover-meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--c-text-secondary);
    }

    .cover-meta-item .label {
      color: var(--c-text-muted);
    }

    .cover-meta-item .value {
      color: var(--c-accent);
      font-weight: 500;
    }

    .cover-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 16px;
      border-radius: 20px;
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.25);
      font-size: 13px;
      color: var(--c-accent);
    }

    .cover-divider {
      width: 60px;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--c-primary-light), transparent);
      margin: 30px 0;
      position: relative;
      z-index: 1;
    }

    .cover-footer {
      position: absolute;
      bottom: 50px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 11px;
      color: var(--c-text-muted);
      letter-spacing: 2px;
    }

    /* ── Content Page ── */
    .content-page {
      padding: 50px 60px;
      min-height: 297mm;
      background: linear-gradient(180deg, #0f0a1e 0%, #120c24 50%, #0f0a1e 100%);
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--c-divider);
      margin-bottom: 30px;
    }

    .page-header-title {
      font-family: 'Noto Serif SC', serif;
      font-size: 12px;
      color: var(--c-text-muted);
      letter-spacing: 3px;
    }

    .page-header-date {
      font-size: 11px;
      color: var(--c-text-muted);
    }

    /* ── Section ── */
    .section {
      margin-bottom: 32px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .section-icon {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(139, 92, 246, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .section-icon svg {
      width: 16px;
      height: 16px;
      stroke: var(--c-accent);
      fill: none;
      stroke-width: 2;
    }

    .section-title {
      font-family: 'Noto Serif SC', serif;
      font-size: 18px;
      font-weight: 600;
      color: var(--c-text-primary);
    }

    .section-body {
      padding-left: 44px;
    }

    .section-text {
      font-size: 13px;
      line-height: 1.8;
      color: var(--c-text-secondary);
      white-space: pre-wrap;
      word-break: break-word;
    }

    /* ── Symbols Table ── */
    .symbols-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    .symbols-table thead th {
      background: rgba(139, 92, 246, 0.2);
      color: var(--c-accent);
      font-size: 12px;
      font-weight: 500;
      padding: 10px 16px;
      text-align: left;
      border-bottom: 1px solid rgba(139, 92, 246, 0.3);
    }

    .symbols-table thead th:first-child {
      border-radius: 8px 0 0 0;
    }

    .symbols-table thead th:last-child {
      border-radius: 0 8px 0 0;
    }

    .symbols-table tbody td {
      padding: 10px 16px;
      font-size: 12.5px;
      line-height: 1.6;
      color: var(--c-text-secondary);
      border-bottom: 1px solid var(--c-divider);
    }

    .symbols-table tbody tr:nth-child(even) {
      background: rgba(139, 92, 246, 0.05);
    }

    .symbols-table tbody tr:last-child td:first-child {
      border-radius: 0 0 0 8px;
    }

    .symbols-table tbody tr:last-child td:last-child {
      border-radius: 0 0 8px 0;
    }

    .symbol-name {
      color: var(--c-accent);
      font-weight: 500;
    }

    /* ── Score Section ── */
    .score-container {
      display: flex;
      align-items: center;
      gap: 30px;
      padding-left: 44px;
    }

    .score-ring-wrapper {
      position: relative;
      width: 120px;
      height: 120px;
      flex-shrink: 0;
    }

    .score-ring-svg {
      width: 120px;
      height: 120px;
      transform: rotate(-90deg);
    }

    .score-ring-bg {
      fill: none;
      stroke: rgba(139, 92, 246, 0.15);
      stroke-width: 8;
    }

    .score-ring-progress {
      fill: none;
      stroke: ${scoreColor};
      stroke-width: 8;
      stroke-linecap: round;
      stroke-dasharray: ${circumference};
      stroke-dashoffset: ${dashOffset};
      transition: stroke-dashoffset 0.5s ease;
    }

    .score-value {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
    }

    .score-number {
      font-size: 28px;
      font-weight: 700;
      color: ${scoreColor};
      line-height: 1;
    }

    .score-label {
      font-size: 12px;
      color: var(--c-text-muted);
      margin-top: 4px;
    }

    .score-details {
      flex: 1;
    }

    .score-detail-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--c-text-primary);
      margin-bottom: 8px;
    }

    .score-detail-desc {
      font-size: 12.5px;
      line-height: 1.7;
      color: var(--c-text-secondary);
    }

    .score-bar {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: rgba(139, 92, 246, 0.15);
      margin-top: 16px;
      overflow: hidden;
    }

    .score-bar-fill {
      height: 100%;
      border-radius: 3px;
      background: linear-gradient(90deg, ${scoreColor}, var(--c-primary-light));
      width: ${score}%;
    }

    /* ── Suggestions ── */
    .suggestion-item {
      display: flex;
      gap: 14px;
      margin-bottom: 18px;
    }

    .suggestion-number {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: rgba(139, 92, 246, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: var(--c-accent);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .suggestion-content {
      flex: 1;
    }

    .suggestion-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--c-text-primary);
      margin-bottom: 4px;
    }

    .suggestion-text {
      font-size: 12.5px;
      line-height: 1.7;
      color: var(--c-text-secondary);
    }

    /* ── Tags ── */
    .tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding-left: 44px;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12.5px;
      font-weight: 500;
    }

    .tag-category {
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.25);
      color: var(--c-accent);
    }

    .tag-mood {
      background: rgba(192, 132, 252, 0.12);
      border: 1px solid rgba(192, 132, 252, 0.2);
      color: #d8b4fe;
    }

    /* ── Footer ── */
    .report-footer {
      text-align: center;
      padding: 24px 0 0;
      border-top: 1px solid var(--c-divider);
      margin-top: 40px;
    }

    .report-footer p {
      font-size: 10px;
      color: var(--c-text-muted);
      letter-spacing: 1px;
    }

    /* ── Page break helpers ── */
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <!-- ─── Cover Page ─── -->
  <div class="page cover-page">
    <div class="cover-moon">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="white" stroke="white"/>
      </svg>
    </div>

    <div class="cover-subtitle">DREAM TRANSLATION REPORT</div>

    <h1 class="cover-title">梦境解读报告</h1>

    <div class="cover-divider"></div>

    <h2 class="cover-dream-title">${escapeHtml(dream.title)}</h2>

    <div class="cover-meta">
      ${dream.moodTag ? `
      <div class="cover-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        ${escapeHtml(dream.moodTag)}
      </div>
      ` : ''}
      ${dream.category ? `
      <div class="cover-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
        </svg>
        ${escapeHtml(dream.category)}
      </div>
      ` : ''}
      <div class="cover-meta-item">
        <span class="label">评分</span>
        <span class="value" style="color: ${scoreColor}">${score} 分 · ${scoreLabel}</span>
      </div>
      <div class="cover-meta-item">
        <span class="label">日期</span>
        <span class="value">${dreamDate}</span>
      </div>
    </div>

    <div class="cover-footer">梦境翻译官 © 2025</div>
  </div>

  <!-- ─── Content Page 1 ─── -->
  <div class="page content-page">
    <div class="page-header">
      <div class="page-header-title">梦境解读报告</div>
      <div class="page-header-date">${dreamDate}</div>
    </div>

    <!-- 梦境整理 -->
    ${dream.organizedDream ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">
          <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        </div>
        <h3 class="section-title">梦境整理</h3>
      </div>
      <div class="section-body">
        <p class="section-text">${escapeHtml(dream.organizedDream)}</p>
      </div>
    </div>
    ` : ''}

    <!-- 意象解读 -->
    ${symbols.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">
          <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </div>
        <h3 class="section-title">意象解读</h3>
      </div>
      <div class="section-body">
        <table class="symbols-table">
          <thead>
            <tr>
              <th style="width: 30%;">意象符号</th>
              <th style="width: 70%;">心理学含义</th>
            </tr>
          </thead>
          <tbody>
            ${symbols.map(s => `
            <tr>
              <td><span class="symbol-name">${escapeHtml(s.name)}</span></td>
              <td>${escapeHtml(s.meaning)}</td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    <!-- 综合评分 -->
    <div class="section">
      <div class="section-header">
        <div class="section-icon">
          <svg viewBox="0 0 24 24"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
        </div>
        <h3 class="section-title">综合评分</h3>
      </div>
      <div class="score-container">
        <div class="score-ring-wrapper">
          <svg class="score-ring-svg" viewBox="0 0 120 120">
            <circle class="score-ring-bg" cx="60" cy="60" r="45"/>
            <circle class="score-ring-progress" cx="60" cy="60" r="45"/>
          </svg>
          <div class="score-value">
            <div class="score-number">${score}</div>
            <div class="score-label">${scoreLabel}</div>
          </div>
        </div>
        <div class="score-details">
          <div class="score-detail-title">心理健康指数</div>
          <div class="score-detail-desc">
            综合评分基于梦境内容的多维度分析，包括情绪稳定性、心理压力水平、潜意识冲突程度等指标。
            ${score >= 75 ? '当前评分表明您的心理状态较为健康，继续保持积极的生活方式。' : score >= 60 ? '当前评分提示部分心理指标需要关注，建议适当调整生活节奏。' : '当前评分显示需要重视心理健康，建议寻求专业心理支持。'}
          </div>
          <div class="score-bar">
            <div class="score-bar-fill"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="report-footer">
      <p>梦境翻译官 © 2025 | 探索内心世界</p>
    </div>
  </div>

  <!-- ─── Content Page 2 ─── -->
  <div class="page content-page">
    <div class="page-header">
      <div class="page-header-title">梦境解读报告</div>
      <div class="page-header-date">${dreamDate}</div>
    </div>

    <!-- 心理分析 -->
    ${dream.psychologyAnalysis ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">
          <svg viewBox="0 0 24 24"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2z"/></svg>
        </div>
        <h3 class="section-title">心理分析</h3>
      </div>
      <div class="section-body">
        <p class="section-text">${escapeHtml(dream.psychologyAnalysis)}</p>
      </div>
    </div>
    ` : ''}

    <!-- 情感分析 -->
    ${dream.emotionAnalysis ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">
          <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </div>
        <h3 class="section-title">情感分析</h3>
      </div>
      <div class="section-body">
        <p class="section-text">${escapeHtml(dream.emotionAnalysis)}</p>
      </div>
    </div>
    ` : ''}

    <!-- 梦境分类 -->
    ${(dream.category || dream.moodTag) ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">
          <svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        </div>
        <h3 class="section-title">梦境分类</h3>
      </div>
      <div class="tags-container">
        ${dream.category ? `<span class="tag tag-category">${escapeHtml(dream.category)}</span>` : ''}
        ${dream.moodTag ? `<span class="tag tag-mood">${escapeHtml(dream.moodTag)}</span>` : ''}
      </div>
    </div>
    ` : ''}

    <!-- 建议指导 -->
    ${suggestions.length > 0 ? `
    <div class="section">
      <div class="section-header">
        <div class="section-icon">
          <svg viewBox="0 0 24 24"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
        </div>
        <h3 class="section-title">建议指导</h3>
      </div>
      <div class="section-body">
        ${suggestions.map((s, i) => `
        <div class="suggestion-item">
          <div class="suggestion-number">${i + 1}</div>
          <div class="suggestion-content">
            <div class="suggestion-title">${escapeHtml(s.title)}</div>
            <div class="suggestion-text">${escapeHtml(s.content)}</div>
          </div>
        </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="report-footer">
      <p>梦境翻译官 © 2025 | 探索内心世界</p>
    </div>
  </div>
</body>
</html>`
}
