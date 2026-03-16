'use client'

import { useEffect, useMemo, useState } from 'react'

type Rule = {
  id: string
  text: string
  checked: boolean
}

type Tone = 'emerald' | 'lime' | 'amber' | 'orange' | 'red'

const STORAGE_KEY = 'trade-meter-pro-v2'

const starterRules = [
  'Trend is clear on my timeframe',
  'Entry is at a key level',
  'Risk is acceptable',
  'Stop loss is defined before entry',
  'Trade matches my strategy exactly',
  'No emotional impulse is present',
]

const toneMap: Record<
  Tone,
  {
    ring: string
    soft: string
    badge: string
    pill: string
    button: string
  }
> = {
  emerald: {
    ring: 'text-emerald-400',
    soft: 'from-emerald-500/20 to-emerald-400/5',
    badge: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    pill: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    button: 'bg-emerald-400 text-slate-950 hover:opacity-90',
  },
  lime: {
    ring: 'text-lime-400',
    soft: 'from-lime-500/20 to-lime-400/5',
    badge: 'border-lime-500/25 bg-lime-500/10 text-lime-300',
    pill: 'border-lime-500/20 bg-lime-500/10 text-lime-200',
    button: 'bg-lime-400 text-slate-950 hover:opacity-90',
  },
  amber: {
    ring: 'text-amber-400',
    soft: 'from-amber-500/20 to-amber-400/5',
    badge: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
    pill: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    button: 'bg-amber-400 text-slate-950 hover:opacity-90',
  },
  orange: {
    ring: 'text-orange-400',
    soft: 'from-orange-500/20 to-orange-400/5',
    badge: 'border-orange-500/25 bg-orange-500/10 text-orange-300',
    pill: 'border-orange-500/20 bg-orange-500/10 text-orange-200',
    button: 'bg-orange-400 text-slate-950 hover:opacity-90',
  },
  red: {
    ring: 'text-red-400',
    soft: 'from-red-500/20 to-red-400/5',
    badge: 'border-red-500/25 bg-red-500/10 text-red-300',
    pill: 'border-red-500/20 bg-red-500/10 text-red-200',
    button: 'bg-red-400 text-slate-950 hover:opacity-90',
  },
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createRule(text: string): Rule {
  return {
    id: makeId(),
    text,
    checked: false,
  }
}

function parseRules(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function getRating(score: number) {
  if (score >= 90) {
    return {
      label: 'A+ Setup',
      desc: 'Everything is aligned. This is the kind of trade worth waiting for.',
      emoji: '😎',
      action: 'High-quality setup. Execute only if the entry itself is still clean.',
      tone: 'emerald' as Tone,
    }
  }

  if (score >= 75) {
    return {
      label: 'Good Setup',
      desc: 'Most conditions are aligned. Solid quality, but precision still matters.',
      emoji: '🙂',
      action: 'This can qualify, but do not get careless with execution.',
      tone: 'lime' as Tone,
    }
  }

  if (score >= 55) {
    return {
      label: 'Average Setup',
      desc: 'Some conditions are there, but it is not fully convincing.',
      emoji: '😐',
      action: 'Be selective. This is where unnecessary trades usually happen.',
      tone: 'amber' as Tone,
    }
  }

  if (score >= 35) {
    return {
      label: 'Weak Setup',
      desc: 'Too many key conditions are missing.',
      emoji: '⚠️',
      action: 'Most likely not worth the risk. Patience is the better trade.',
      tone: 'orange' as Tone,
    }
  }

  return {
    label: 'No Trade',
    desc: 'This setup is low-quality and should usually be avoided.',
    emoji: '🚫',
    action: 'Protect capital. Passing is also a winning decision.',
    tone: 'red' as Tone,
  }
}

export default function Home() {
  const title = 'Trade Meter'
  const [newRule, setNewRule] = useState('')
  const [minScore, setMinScore] = useState(75)
  const [rules, setRules] = useState<Rule[]>(starterRules.map(createRule))

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)

      if (typeof parsed.minScore === 'number') setMinScore(parsed.minScore)

      if (Array.isArray(parsed.rules)) {
        setRules(parsed.rules)
      } else if (typeof parsed.bulkRules === 'string') {
        setRules(parseRules(parsed.bulkRules).map(createRule))
      }
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        minScore,
        rules,
        bulkRules: rules.map((rule) => rule.text).join('\n'),
      })
    )
  }, [minScore, rules])

  const checkedCount = rules.filter((rule) => rule.checked).length
  const totalCount = rules.length
  const missingCount = Math.max(totalCount - checkedCount, 0)
  const score = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0
  const rating = useMemo(() => getRating(score), [score])
  const styles = toneMap[rating.tone]
  const qualifies = score >= minScore

  const circleRadius = 46
  const circumference = 2 * Math.PI * circleRadius
  const dashOffset = circumference - (score / 100) * circumference

  const loadStarterRules = () => {
    setRules(starterRules.map(createRule))
  }

  const clearAllRules = () => {
    setRules([])
    setNewRule('')
  }

  const resetChecks = () => {
    setRules((prev) => prev.map((rule) => ({ ...rule, checked: false })))
  }

  const addRule = () => {
    const trimmed = newRule.trim()
    if (!trimmed) return

    const rule = createRule(trimmed)
    setRules((prev) => [...prev, rule])
    setNewRule('')
  }

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, checked: !rule.checked } : rule
      )
    )
  }

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id))
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
                Trading Discipline App
              </div>

              <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
                {title}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                Build your own pre-trade checklist, score every setup in seconds,
                and stop entering trades that do not truly meet your standards.
              </p>
            </div>

            <div className={`rounded-2xl border px-4 py-3 text-sm ${styles.badge}`}>
              {rating.action}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="sticky top-3 z-20 overflow-hidden rounded-[30px] border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl">
            <div className={`bg-gradient-to-br ${styles.soft} p-4 md:p-5`}>
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm uppercase tracking-[0.25em] text-slate-300">
                  Live Score
                </div>
                <div className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${styles.badge}`}>
                  {rating.label}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-center">
                <div className="flex items-center justify-center">
                  <div className="relative h-32 w-32 md:h-36 md:w-36">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r={circleRadius}
                        fill="transparent"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r={circleRadius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        className={`${styles.ring} transition-all duration-500`}
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-3xl font-black md:text-4xl">{score}%</div>
                      <div className="mt-1 text-2xl md:text-3xl">{rating.emoji}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-center lg:text-left">
                    <div className="text-lg font-semibold md:text-xl">{rating.label}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{rating.desc}</p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 md:gap-3">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 md:text-[11px]">
                        Confirmed
                      </div>
                      <div className="mt-1 text-xl font-bold md:text-2xl">{checkedCount}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 md:text-[11px]">
                        Missing
                      </div>
                      <div className="mt-1 text-xl font-bold md:text-2xl">{missingCount}</div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 md:text-[11px]">
                        Rules
                      </div>
                      <div className="mt-1 text-xl font-bold md:text-2xl">{totalCount}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 p-4 md:p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-200">
                    <span>No Trade</span>
                    <span>0–34%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-orange-200">
                    <span>Weak</span>
                    <span>35–54%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-200">
                    <span>Average</span>
                    <span>55–74%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-lime-500/20 bg-lime-500/10 px-3 py-2 text-lime-200">
                    <span>Good</span>
                    <span>75–89%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-200">
                    <span>A+ Setup</span>
                    <span>90–100%</span>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="mb-2 text-sm font-semibold text-slate-200">
                    Minimum score to qualify
                  </div>

                  <div className="mb-3 flex items-center justify-between text-sm text-slate-400">
                    <span>Your rule</span>
                    <span className="font-semibold text-white">{minScore}%</span>
                  </div>

                  <input
                    type="range"
                    min={50}
                    max={95}
                    step={5}
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-full accent-emerald-400"
                  />

                  <div
                    className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-medium ${
                      qualifies
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                        : 'border-red-500/20 bg-red-500/10 text-red-200'
                    }`}
                  >
                    {qualifies
                      ? 'This trade passes your minimum quality requirement.'
                      : 'This trade does not yet qualify under your rule.'}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/50 p-3 md:p-4">
                <div className="mb-3 text-sm font-semibold text-slate-200">
                  Add rule directly to checklist
                </div>

                <div className="flex items-center gap-3">
                  <input
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addRule()
                    }}
                    placeholder="Example: Reward is at least 2R"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-slate-500"
                  />

                  <button
                    onClick={addRule}
                    aria-label="Add rule"
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold transition ${styles.button}`}
                  >
                    +
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={loadStarterRules}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Load Starter
                  </button>

                  <button
                    onClick={resetChecks}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Reset Checks
                  </button>

                  <button
                    onClick={clearAllRules}
                    className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl md:p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold md:text-2xl">Checklist</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Tick only what is truly present in this setup.
                </p>
              </div>

              <div className={`rounded-full border px-4 py-2 text-sm font-medium ${styles.pill}`}>
                {checkedCount} of {totalCount} confirmed
              </div>
            </div>

            {rules.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-slate-950/50 p-8 text-center text-slate-400">
                No rules yet. Add rules using the + button above.
              </div>
            ) : (
              <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                {rules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className={`group flex items-center gap-2.5 rounded-[20px] border p-3 transition md:gap-3 md:p-3.5 ${
                      rule.checked
                        ? 'border-emerald-500/20 bg-emerald-500/10'
                        : 'border-white/10 bg-slate-950/50 hover:bg-white/5'
                    }`}
                  >
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className="flex flex-1 items-center gap-3 text-left md:gap-4"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold md:h-11 md:w-11 ${
                          rule.checked
                            ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                            : 'border-white/10 bg-white/5 text-slate-400'
                        }`}
                      >
                        {rule.checked ? '✓' : index + 1}
                      </div>

                      <div className="flex-1">
                        <div
                          className={`text-sm leading-5 md:text-base ${
                            rule.checked ? 'text-white' : 'text-slate-200'
                          }`}
                        >
                          {rule.text}
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => deleteRule(rule.id)}
                      className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white md:text-sm"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
