'use client'

import { useEffect, useMemo, useState } from 'react'

type Rule = {
  id: string
  text: string
  checked: boolean
}

type Tone = 'emerald' | 'lime' | 'amber' | 'orange' | 'red'
type View = 'builder' | 'checklist'

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
    progress: string
  }
> = {
  emerald: {
    ring: 'text-emerald-400',
    soft: 'from-emerald-500/20 to-emerald-400/5',
    badge: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    pill: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    button: 'bg-emerald-400 text-slate-950 hover:opacity-90',
    progress: 'bg-emerald-400',
  },
  lime: {
    ring: 'text-lime-400',
    soft: 'from-lime-500/20 to-lime-400/5',
    badge: 'border-lime-500/25 bg-lime-500/10 text-lime-300',
    pill: 'border-lime-500/20 bg-lime-500/10 text-lime-200',
    button: 'bg-lime-400 text-slate-950 hover:opacity-90',
    progress: 'bg-lime-400',
  },
  amber: {
    ring: 'text-amber-400',
    soft: 'from-amber-500/20 to-amber-400/5',
    badge: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
    pill: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    button: 'bg-amber-400 text-slate-950 hover:opacity-90',
    progress: 'bg-amber-400',
  },
  orange: {
    ring: 'text-orange-400',
    soft: 'from-orange-500/20 to-orange-400/5',
    badge: 'border-orange-500/25 bg-orange-500/10 text-orange-300',
    pill: 'border-orange-500/20 bg-orange-500/10 text-orange-200',
    button: 'bg-orange-400 text-slate-950 hover:opacity-90',
    progress: 'bg-orange-400',
  },
  red: {
    ring: 'text-red-400',
    soft: 'from-red-500/20 to-red-400/5',
    badge: 'border-red-500/25 bg-red-500/10 text-red-300',
    pill: 'border-red-500/20 bg-red-500/10 text-red-200',
    button: 'bg-red-400 text-slate-950 hover:opacity-90',
    progress: 'bg-red-400',
  },
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createRule(text: string, checked = false): Rule {
  return {
    id: makeId(),
    text,
    checked,
  }
}

function parseRules(text: string) {
  return Array.from(
    new Set(
      text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    )
  )
}

function buildRulesFromText(text: string, previousRules: Rule[] = []) {
  const checkedMap = new Map(previousRules.map((rule) => [rule.text, rule.checked]))
  return parseRules(text).map((ruleText) =>
    createRule(ruleText, checkedMap.get(ruleText) ?? false)
  )
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
  const [hydrated, setHydrated] = useState(false)

  const [view, setView] = useState<View>('builder')
  const [title, setTitle] = useState('Trade Meter')
  const [bulkRules, setBulkRules] = useState(starterRules.join('\n'))
  const [newRule, setNewRule] = useState('')
  const [minScore, setMinScore] = useState(75)
  const [rules, setRules] = useState<Rule[]>(starterRules.map((rule) => createRule(rule)))

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)

    if (saved) {
      try {
        const parsed = JSON.parse(saved)

        if (parsed?.view === 'builder' || parsed?.view === 'checklist') {
          setView(parsed.view)
        }

        if (typeof parsed?.title === 'string') {
          setTitle(parsed.title)
        }

        if (typeof parsed?.bulkRules === 'string') {
          setBulkRules(parsed.bulkRules)
        }

        if (typeof parsed?.minScore === 'number') {
          setMinScore(parsed.minScore)
        }

        if (Array.isArray(parsed?.rules)) {
          const safeRules = parsed.rules
            .filter(
              (rule: unknown) =>
                typeof rule === 'object' &&
                rule !== null &&
                typeof (rule as Rule).id === 'string' &&
                typeof (rule as Rule).text === 'string' &&
                typeof (rule as Rule).checked === 'boolean'
            )
            .map((rule: Rule) => ({
              id: rule.id,
              text: rule.text,
              checked: rule.checked,
            }))

          if (safeRules.length > 0 || parsed.bulkRules === '') {
            setRules(safeRules)
          }
        }
      } catch {}
    }

    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        view,
        title,
        bulkRules,
        minScore,
        rules,
      })
    )
  }, [hydrated, view, title, bulkRules, minScore, rules])

  useEffect(() => {
    if (hydrated && view === 'checklist' && rules.length === 0) {
      setView('builder')
    }
  }, [hydrated, view, rules.length])

  const checkedCount = rules.filter((rule) => rule.checked).length
  const totalCount = rules.length
  const missingCount = Math.max(totalCount - checkedCount, 0)
  const score = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0
  const rating = useMemo(() => getRating(score), [score])
  const styles = toneMap[rating.tone]
  const qualifies = score >= minScore
  const draftRuleCount = parseRules(bulkRules).length

  const circleRadius = 52
  const circumference = 2 * Math.PI * circleRadius
  const dashOffset = circumference - (score / 100) * circumference

  const syncRulesFromBuilder = () => {
    const cleaned = parseRules(bulkRules)
    const cleanedText = cleaned.join('\n')
    const nextRules = buildRulesFromText(cleanedText, rules)

    setBulkRules(cleanedText)
    setRules(nextRules)

    return nextRules
  }

  const startChecklist = () => {
    const nextRules = syncRulesFromBuilder()
    if (nextRules.length === 0) return
    setView('checklist')
  }

  const applyRules = () => {
    syncRulesFromBuilder()
  }

  const loadStarterRules = () => {
    const text = starterRules.join('\n')
    setBulkRules(text)
    setRules(starterRules.map((rule) => createRule(rule)))
    setView('builder')
  }

  const clearAllRules = () => {
    setBulkRules('')
    setRules([])
    setNewRule('')
    setView('builder')
  }

  const resetChecks = () => {
    setRules((prev) => prev.map((rule) => ({ ...rule, checked: false })))
  }

  const addRule = () => {
    const trimmed = newRule.trim()
    if (!trimmed) return

    const current = parseRules(bulkRules)
    if (current.includes(trimmed)) {
      setNewRule('')
      return
    }

    const updatedText = bulkRules.trim() ? `${bulkRules}\n${trimmed}` : trimmed
    setBulkRules(updatedText)
    setRules((prev) => [...prev, createRule(trimmed)])
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
    setRules((prev) => {
      const updated = prev.filter((rule) => rule.id !== id)
      setBulkRules(updated.map((rule) => rule.text).join('\n'))
      return updated
    })
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl px-4 py-5 md:px-6 md:py-8">
        {view === 'builder' ? (
          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl md:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
                    Step 1 of 2 — Build Your Rules
                  </div>

                  <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
                    {title}
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                    Create your own pre-trade checklist first. Then move into a
                    dedicated scoring screen where the live score stays visible while
                    you tick your setup conditions.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      Draft Rules
                    </div>
                    <div className="mt-2 text-2xl font-bold">{draftRuleCount}</div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                      Minimum Score
                    </div>
                    <div className="mt-2 text-2xl font-bold">{minScore}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl md:p-6">
              <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">App Name</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mb-5 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-slate-500"
                  />

                  <label className="mb-2 block text-sm text-slate-300">
                    Rule Builder — one rule per line
                  </label>

                  <textarea
                    value={bulkRules}
                    onChange={(e) => setBulkRules(e.target.value)}
                    className="min-h-[300px] w-full rounded-[26px] border border-white/10 bg-slate-950/60 px-4 py-4 text-white outline-none transition focus:border-slate-500"
                    placeholder={`Trend is clear on my timeframe
Entry is at a key level
Risk is acceptable
Trade matches my strategy exactly`}
                  />

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={applyRules}
                      className={`rounded-2xl px-5 py-3 font-semibold transition ${styles.button}`}
                    >
                      Apply Rules
                    </button>

                    <button
                      onClick={startChecklist}
                      disabled={draftRuleCount === 0}
                      className={`rounded-2xl px-5 py-3 font-semibold transition ${
                        draftRuleCount === 0
                          ? 'cursor-not-allowed bg-white/10 text-slate-500'
                          : styles.button
                      }`}
                    >
                      Start Checklist
                    </button>

                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                      Auto-saves locally
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[26px] border border-white/10 bg-slate-950/50 p-4 md:p-5">
                    <div className="text-lg font-semibold">Quick Add Rule</div>
                    <p className="mt-1 text-sm text-slate-400">
                      Add a new condition without rewriting your full list.
                    </p>

                    <div className="mt-4 flex flex-col gap-3">
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
                        className={`rounded-2xl px-5 py-3 font-semibold transition ${styles.button}`}
                      >
                        Add Rule
                      </button>
                    </div>
                  </div>

                  <div className="rounded-[26px] border border-white/10 bg-slate-950/50 p-4 md:p-5">
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

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                      Only trades at or above this score should qualify.
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                      Good rules reduce hesitation and emotional entries.
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                      Your score should reflect quality, not excitement.
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                      A skipped low-quality trade is still a professional decision.
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={loadStarterRules}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white transition hover:bg-white/10"
                    >
                      Load Starter Rules
                    </button>

                    <button
                      onClick={clearAllRules}
                      className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 font-semibold text-red-200 transition hover:bg-red-500/20"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {rules.length > 0 && (
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl md:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold">Checklist Preview</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      These are the rules that will appear on the live scoring screen.
                    </p>
                  </div>

                  <div className={`rounded-full border px-4 py-2 text-sm font-medium ${styles.pill}`}>
                    {rules.length} rules ready
                  </div>
                </div>

                <div className="space-y-3">
                  {rules.map((rule, index) => (
                    <div
                      key={rule.id}
                      className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-slate-950/50 p-4"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-sm font-bold text-slate-300">
                        {index + 1}
                      </div>

                      <div className="flex-1 text-slate-200">{rule.text}</div>

                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="sticky top-3 z-30">
              <div className="overflow-hidden rounded-[30px] border border-white/10 bg-slate-950/85 shadow-2xl backdrop-blur-xl">
                <div className={`bg-gradient-to-br ${styles.soft} p-4 md:p-5`}>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="mb-2 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-slate-300">
                        Step 2 of 2 — Live Checklist
                      </div>
                      <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
                      <p className="mt-1 text-sm text-slate-300">
                        Tick only what is truly present in this setup.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setView('builder')}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Edit Rules
                      </button>

                      <button
                        onClick={resetChecks}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Reset Checks
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[140px_minmax(0,1fr)_auto]">
                    <div className="mx-auto flex items-center justify-center lg:mx-0">
                      <div className="relative h-32 w-32">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
                          <circle
                            cx="70"
                            cy="70"
                            r={circleRadius}
                            fill="transparent"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="12"
                          />
                          <circle
                            cx="70"
                            cy="70"
                            r={circleRadius}
                            fill="transparent"
                            stroke="currentColor"
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashOffset}
                            className={`${styles.ring} transition-all duration-500`}
                          />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className="text-3xl font-black">{score}%</div>
                          <div className="mt-1 text-2xl">{rating.emoji}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-center">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${styles.badge}`}>
                          {rating.label}
                        </div>

                        <div
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            qualifies
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                              : 'border-red-500/20 bg-red-500/10 text-red-200'
                          }`}
                        >
                          {qualifies ? 'Qualified' : 'Not Qualified'}
                        </div>
                      </div>

                      <div className="text-lg font-semibold md:text-xl">{rating.action}</div>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                        {rating.desc}
                      </p>

                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${styles.progress}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
                      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-center lg:min-w-[110px]">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                          Confirmed
                        </div>
                        <div className="mt-1 text-2xl font-bold">{checkedCount}</div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-center lg:min-w-[110px]">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                          Missing
                        </div>
                        <div className="mt-1 text-2xl font-bold">{missingCount}</div>
                      </div>

                      <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-3 text-center lg:min-w-[110px]">
                        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                          Rules
                        </div>
                        <div className="mt-1 text-2xl font-bold">{totalCount}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-200">
                      No Trade: 0–34%
                    </div>
                    <div className="rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-orange-200">
                      Weak: 35–54%
                    </div>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-amber-200">
                      Average: 55–74%
                    </div>
                    <div className="rounded-xl border border-lime-500/20 bg-lime-500/10 px-3 py-2 text-lime-200">
                      Good: 75–89%
                    </div>
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-200">
                      A+: 90–100%
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl md:p-6">
              {rules.length === 0 ? (
                <div className="rounded-[26px] border border-dashed border-white/10 bg-slate-950/50 p-10 text-center text-slate-400">
                  No rules yet. Go back and add your rules first.
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule, index) => (
                    <button
                      key={rule.id}
                      onClick={() => toggleRule(rule.id)}
                      className={`group flex w-full items-center gap-3 rounded-[24px] border p-4 text-left transition md:p-5 ${
                        rule.checked
                          ? 'border-emerald-500/20 bg-emerald-500/10'
                          : 'border-white/10 bg-slate-950/50 hover:bg-white/5'
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold ${
                          rule.checked
                            ? 'border-emerald-400 bg-emerald-400 text-slate-950'
                            : 'border-white/10 bg-white/5 text-slate-400'
                        }`}
                      >
                        {rule.checked ? '✓' : index + 1}
                      </div>

                      <div className="flex-1">
                        <div
                          className={`text-base leading-6 md:text-lg ${
                            rule.checked ? 'text-white' : 'text-slate-200'
                          }`}
                        >
                          {rule.text}
                        </div>
                      </div>

                      <div
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          rule.checked
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                            : 'border-white/10 bg-white/5 text-slate-400'
                        }`}
                      >
                        {rule.checked ? 'Confirmed' : 'Tap'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
