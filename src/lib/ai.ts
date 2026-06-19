/**
 * 通用 AI 客户端 — 支持任意 OpenAI 兼容 API（智谱、DeepSeek、OpenAI、Ollama 等）
 *
 * 环境变量：
 *   AI_API_KEY   — API 密钥
 *   AI_BASE_URL  — API 基础地址（默认：https://open.bigmodel.cn/api/paas/v4）
 *   AI_MODEL     — 模型名称（默认：glm-4-flash）
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string | null
    }
  }>
}

function getConfig() {
  const apiKey = process.env.AI_API_KEY
  const baseUrl = (process.env.AI_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4').replace(/\/+$/, '')
  const model = process.env.AI_MODEL || 'glm-4-flash'

  if (!apiKey) {
    throw new Error(
      'AI_API_KEY 未配置。请在 .env.local 中设置你的 API 密钥。\n' +
      '支持：智谱 AI (https://open.bigmodel.cn)、DeepSeek、OpenAI、Ollama 等任意 OpenAI 兼容 API。'
    )
  }

  return { apiKey, baseUrl, model }
}

/**
 * 调用 OpenAI 兼容的 Chat Completions API
 * 自动重试 429 / 5xx 错误，最多重试 3 次（指数退避）
 */
export async function chatCompletion(
  messages: ChatMessage[],
  opts: { maxRetries?: number } = {}
): Promise<string> {
  const { apiKey, baseUrl, model } = getConfig()
  const maxRetries = opts.maxRetries ?? 3

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = Math.min(3000 * Math.pow(2, attempt - 1), 15000)
        console.log(`[AI] Retry ${attempt}/${maxRetries}, waiting ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      const url = `${baseUrl}/chat/completions`
      console.log(`[AI] Calling ${url} model=${model}...`)

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(120000), // 120s timeout
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        const errMsg = `AI API error ${res.status}: ${text.slice(0, 200)}`

        // Retry on rate limit (429) or server errors (5xx)
        if (res.status === 429 || res.status >= 500) {
          console.warn(`[AI] ${errMsg} — will retry`)
          lastError = new Error(errMsg)
          continue
        }

        throw new Error(errMsg)
      }

      const data = (await res.json()) as ChatCompletionResponse
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        console.warn('[AI] Empty response content, retrying...')
        lastError = new Error('AI 返回了空内容')
        continue
      }

      console.log(`[AI] Response received, length: ${content.length} chars`)
      return content

    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        lastError = new Error('AI 请求超时（120s）')
        continue
      }

      const msg = err instanceof Error ? err.message : String(err)

      // Retry network errors and rate limits
      if (msg.includes('ECONNREFUSED') || msg.includes('fetch') || msg.includes('429')) {
        lastError = new Error(msg)
        continue
      }

      // Non-retryable
      throw err
    }
  }

  throw lastError || new Error('AI 请求失败')
}
