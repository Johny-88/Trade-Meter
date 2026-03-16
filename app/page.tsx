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

      if (typeof parsed.minScore === 'number') {
        setMinScore(parsed.minScore)
      }

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

  const circleRadius = 34
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
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
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

        <div className="space-y-4">
          <div className="sticky top-2 z-40 rounded-[24px] border border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur-xl">
            <div className={`bg-gradient-to-r ${styles.soft} p-3 md:p-4`}>
              <div className="grid gap-3 md:grid-cols-[92px_minmax(0,1fr)_auto] md:items-center">
                <div className="mx-auto flex items-center justify-center md:mx-0">
                  <div className="relative h-20 w-20 md:h-24 md:w-24">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r={circleRadius}
                        fill="transparent"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r={circleRadius}
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        className={`${styles.ring} transition-all duration-500`}
                      />
                    </svg>

                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-xl font-black md:text-2xl">{score}%</div>
                      <div className="mt-0.5 text-lg md:text-xl">{rating.emoji}</div>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                    <div
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles.badge}`}
                    >
                      {rating.label}
                    </div>

                    <div
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                        qualifies
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                          : 'border-red-500/20 bg-red-500/10 text-red-200'
                      }`}
                    >
                      {qualifies ? 'Qualified' : 'Not Qualified'}
                    </div>
                  </div>

                  <div className="mt-2 text-sm font-semibold text-white md:text-base">
                    {rating.action}
                  </div>

                  <p className="mt-1 text-xs leading-5 text-slate-300 md:text-sm">
                    {rating.desc}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-center">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500 md:text-[10px]">
                      Yes
                    </div>
                    <div className="mt-1 text-base font-bold md:text-lg">{checkedCount}</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-center">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500 md:text-[10px]">
                      No
                    </div>
                    <div className="mt-1 text-base font-bold md:text-lg">{missingCount}</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-center">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-slate-500 md:text-[10px]">
                      Total
                    </div>
                    <div className="mt-1 text-base font-bold md:text-lg">{totalCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-xl md:p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="rounded-[22px] border border-white/10 bg-slate-950/50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-200">
                    Minimum score
                  </div>
                  <div className="text-sm font-semibold text-white">{minScore}%</div>
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
                  className={`mt-3 rounded-2xl border px-3 py-2 text-xs font-medium md:text-sm ${
                    qualifies
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                      : 'border-red-500/20 bg-red-500/10 text-red-200'
                  }`}
                >
                  {qualifies
                    ? 'This trade passes your minimum quality requirement.'
                    : 'This trade does not yet qualify under your rule.'}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] md:text-xs">
                  <div className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-red-200">
                    No Trade 0–34%
                  </div>
                  <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-orange-200">
                    Weak 35–54%
                  </div>
                  <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-amber-200">
                    Average 55–74%
                  </div>
                  <div className="rounded-full border border-lime-500/20 bg-lime-500/10 px-2.5 py-1 text-lime-200">
                    Good 75–89%
                  </div>
                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">
                    A+ 90–100%
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-slate-950/50 p-3">
                <div className="mb-2 text-sm font-semibold text-slate-200">
                  Add rule directly to checklist
                </div>

                <div className="flex items-center gap-2">
                  <input
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addRule()
                    }}
                    placeholder="Example: Reward is at least 2R"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-slate-500"
                  />

                  <button
                    onClick={addRule}
                    aria-label="Add rule"
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xl font-bold transition ${styles.button}`}
                  >
                    +
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={loadStarterRules}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                  >
                    Load Starter
                  </button>

                  <button
                    onClick={resetChecks}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                  >
                    Reset
                  </button>

                  <button
                    onClick={clearAllRules}
                    className="rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl md:p-5">
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
              <div className="max-h-[640px] space-y-2 overflow-y-auto pr-1">
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
