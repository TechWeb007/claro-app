'use client'

import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useSearchParams } from 'next/navigation'
import remarkGfm from 'remark-gfm'

type Role = 'user' | 'assistant'
interface Message { role: Role; content: string }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showQuoteButton, setShowQuoteButton] = useState(false)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '' })
  const [submitting, setSubmitting] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const companyDomain =
    searchParams.get('domain') || (typeof window !== 'undefined' ? window.location.hostname : '')


  // refs for autoscroll and autofocus
  const endRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

    useEffect(() => {
  inputRef.current?.focus()
}, [])

  const scrollToBottom = (smooth = true) => {
    endRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' })
  }

  useEffect(() => {
    scrollToBottom()
    inputRef.current?.focus()
  }, [messages, loading])

  // handle send
const handleSend = async () => {
  const text = input.trim()
  if (!text || loading) return

  const userMessage: Message = { role: 'user', content: text }
  const nextMessages = [...messages, userMessage]

  setMessages(nextMessages)
  setInput('')
  setLoading(true)

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
  domain: companyDomain,
  messages: nextMessages,
  conversationId,
}),
    })

    const data = await res.json()

    if (data.conversationId) {
      setConversationId(data.conversationId) // SAVE it
    }

    if (data.reply) {
      if (data.diagnostic) setShowQuoteButton(true)

      const aiMessage: Message = { role: 'assistant', content: data.reply }
      setMessages((prev) => [...prev, aiMessage])
    }
  } finally {
    setLoading(false)
    inputRef.current?.focus()
  }
}


  // quote submission
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
  domain: companyDomain,
  conversationId,
  ...formData,
}),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.message }])
        setShowQuoteForm(false)
        setShowQuoteButton(false)
      } else {
        alert('Something went wrong. Please try again.')
      }
    } catch {
      alert('There was an error submitting your quote.')
    } finally {
      setSubmitting(false)
      inputRef.current?.focus()
    }
  }

  const bubbleBase =
    'max-w-[80%] rounded-2xl px-4 py-3 shadow-sm transition-all will-change-transform'
  const userBubble = 'bg-blue-600 text-white ml-auto rounded-tr-sm md:rounded-tr-md'
  const aiBubble =
    'bg-white text-gray-800 border border-gray-100 rounded-tl-sm md:rounded-tl-md'

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="relative">
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white px-5 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-white/15 grid place-items-center shadow-inner">
                  <span className="text-white/90 text-sm">AI</span>
                </div>
                <div>
                  <div className="text-lg leading-tight font-medium">
                    Chat with our assistant
                  </div>
                  <div className="text-white/70 text-xs">Call It Now</div>
                </div>
              </div>

              {!showQuoteForm && showQuoteButton && (
                <button
                  onClick={() => setShowQuoteForm(true)}
                  className="hidden sm:inline-flex items-center gap-2 bg-white/95 text-blue-700 hover:bg-white px-3 py-2 rounded-lg text-sm font-medium shadow"
                >
                  Get a Quote
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-[68vh] md:h-[70vh] overflow-y-auto p-4 md:p-5 space-y-3 bg-slate-50">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 text-sm py-8">
              Tell us about your issue and we’ll help you understand the problem and provide an accurate quote. Your details are only used to assist you and are never shared.
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`${bubbleBase} ${msg.role === 'user' ? userBubble : aiBubble}`}>
                <div className="text-[13.5px] leading-relaxed prose prose-sm max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1 prose-a:text-blue-700 prose-a:underline">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h3: ({ children }) => (
                        <h3 className="font-semibold text-[15px] mt-2 mb-1">{children}</h3>
                      ),
                      h4: ({ children }) => (
                        <h4 className="font-medium text-[14px] mt-2 mb-1">{children}</h4>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside space-y-1 ml-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside space-y-1 ml-2">{children}</ol>
                      ),
                      li: ({ children }) => <li>{children}</li>,
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline hover:text-blue-800"
                        />
                      ),
                      p: ({ children }) => <p className="whitespace-pre-line">{children}</p>,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className={`${bubbleBase} ${aiBubble} flex items-center gap-2`}>
                <span className="inline-block h-[6px] w-[6px] rounded-full bg-slate-400 animate-bounce [animation-delay:-0.2s]" />
                <span className="inline-block h-[6px] w-[6px] rounded-full bg-slate-400 animate-bounce" />
                <span className="inline-block h-[6px] w-[6px] rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Input */}
        {!showQuoteForm && (
          <div className="border-t bg-white/70">
            <div className="flex items-center gap-2 p-3">
              <input
                ref={inputRef}
                type="text"
                className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm text-white shadow hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                    Sending
                  </>
                ) : (
                  'Send'
                )}
              </button>
            </div>

            {showQuoteButton && (
              <div className="px-3 pb-3">
                <button
                  className="w-full rounded-xl bg-emerald-600 text-white py-2.5 text-sm hover:bg-emerald-700 transition shadow"
                  onClick={() => setShowQuoteForm(true)}
                >
                  Get a Quote
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-500 py-2 bg-white/60 border-t">
          CLARO - Powered by TechWeb Solutions
        </div>
      </div>

      {/* Quote Modal */}
      {showQuoteForm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-[fadeIn_.18s_ease]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Request a Quote</h2>
              <button
                onClick={() => {
  setShowQuoteForm(false)
  setTimeout(() => inputRef.current?.focus(), 50)
}}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="space-y-4">
              {(['name', 'email', 'phone', 'address'] as const).map((field) => (
                <div key={field}>
                  <label className="text-sm text-slate-700 font-medium capitalize">{field}</label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    required
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  />
                </div>
              ))}

              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowQuoteForm(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 transition"
                >
                  {submitting ? 'Sending…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fade animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
