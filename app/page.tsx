'use client'

import { useEffect, useMemo, useState } from 'react'

type Rule = {
  id: number
  text: string
  checked: boolean
}

const STORAGE_KEY = 'trade-meter-v2'

const starterRules = [
  'Trend is clear on my timeframe',
  'Entry is at a key level',
  'Risk is acceptable',
  'Stop loss is defined before entry',
  'No revenge trading emotion present',
  'Trade matches my strategy exactly',
]

function getRating(score: number) {
  if (score >= 90) {
    return {
      label: 'A+ Setup',
      desc: 'Everything is aligned. This is the kind of trade worth waiting for.',
      emoji: '😎',
      action: 'Take only if execution is clean.',
      tone: 'emerald',
    }
  }

  if (score >= 75) {
    return {
      label: 'Good Setup',
      desc: 'Most conditions are aligned. Solid quality, but stay precise.',
      emoji: '🙂',
      action: 'Valid trade if entry stays disciplined.',
      tone: 'lime',
    }
  }

  if (score >= 55) {
    return {
      label: 'Average Setup',
      desc: 'Some things are there, but not enough to feel fully confident.',
      emoji: '😐',
      action: 'Be selective. This may be a pass.',
      tone: 'yellow',
    }
  }

  if (score >= 35) {
    return {
      label: 'Weak Setup',
      desc: 'Too many key conditions are missing.',
      emoji: '⚠️',
      action: 'Most likely not worth the risk.',
      tone: 'orange',
    }
  }

  return {
    label: 'No Trade',
    desc: 'This is low-quality and should usually be avoided.',
    emoji: '🚫',
    action: 'Stay out. Protect capital.',
    tone: 'red',
  }
}

function toneClasses(tone: string) {
  switch (tone) {
    case 'emerald':
      return {
        badge: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
        glow: 'from-emerald-500/25 to-emerald-400/5',
        progress: 'from-emerald-400 to-emerald-500',
      }
    case 'lime':
      return {
        badge: 'border-lime-500/30 bg-lime-500/15 text-lime-300',
        glow: 'from-lime-500/25 to-lime-400/5',
        progress: 'from-lime-300 to-lime-500',
      }
    case 'yellow':
      return {
        badge: 'border-yellow-500/30 bg-yellow-500/15 text-yellow-300',
        glow: 'from-yellow-500/25 to-yellow-400/5',
        progress: 'from-yellow-300 to-yellow-500',
      }
    case 'orange':
      return {
        badge: 'border-orange-500/30 bg-orange-500/15 text-orange-300',
        glow: 'from-orange-500/25 to-orange-400/5',
        progress: 'from-orange-300 to-orange-500',
      }
    default:
      return {
        badge: 'border-red-500/30 bg-red-500/15 text-red-300',
        glow: 'from-red-500/25 to-red-400/5',
        progress: 'from-red-300 to-red-500',
      }
  }
}

export default function Home() {
  const [title, setTitle] = useState('Trade Meter')
  const [bulkRules, setBulkRules] = useState(starterRules.join('\n'))
  const [newRule, setNewRule] = useState('')
  const [rules, setRules] = useState<Rule[]>(
    starterRules.map((text, index) => ({
      id: Date.now() + index,
      text,
      checked: false,
    }))
  )

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      if (parsed.title) setTitle(parsed.title)
      if (parsed.bulkRules) setBulkRules(parsed.bulkRules)
      if (Array.isArray(parsed.rules) && parsed.rules.length > 0) {
        setRules(parsed.rules)
      }
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        title,
        bulkRules,
        rules,
      })
    )
  }, [title, bulkRules, rules])

  const checkedCount = rules.filter((rule) => rule.checked).length
  const totalCount = rules.length
  const score = totalCount ? Math.round((checkedCount / totalCount) * 100) : 0
  const rating = useMemo(() => getRating(score), [score])
  const palette = toneClasses(rating.tone)

  const applyRules = () => {
    const cleanedRules = bulkRules
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    setRules(
      cleanedRules.map((text, index) => ({
        id: Date.now() + index,
        text,
        checked: false,
      }))
    )
  }

  const toggleRule = (id: number) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id ? { ...rule, checked: !rule.checked } : rule
      )
    )
  }

  const addRule = () => {
    const trimmed = newRule.trim()
    if (!trimmed) return

    const newItem = {
      id: Date.now(),
      text: trimmed,
      checked: false,
    }

    setRules((prev) => [...prev, newItem])
    setBulkRules((prev) => (prev.trim() ? `${prev}\n${trimmed}` : trimmed))
    setNewRule('')
  }

  const deleteRule = (id: number) => {
    setRules((prev) => {
      const updated = prev.filter((rule) => rule.id !== id)
      setBulkRules(updated.map((rule) => rule.text).join('\n'))
      return updated
    })
  }

  const resetChecks = () => {
    setRules((prev) => prev.map((rule) => ({ ...rule, checked: false })))
  }

  const loadStarterRules = () => {
    setBulkRules(starterRules.join('\n'))
    setRules(
      starterRules.map((text, index) => ({
        id: Date.now() + index,
        text,
        checked: false,
      }))
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8 lg:py-8">
        <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.3em] text-slate-400">
              Trading Discipline Tool
            </div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400 md:text-base">
              Build your personal trade checklist, score every setup, and stop
              taking low-quality entries out of emotion.
            </p>
          </div>

          <div className={`rounded-2xl border px-4 py-3 text-sm ${palette.badge}`}>
            {rating.action}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-900/80 shadow-2xl backdrop-blur">
              <div className={`bg-gradient-to-br p-5 ${palette.glow}`}>
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm uppercase tracking-[0.25em] text-slate-400">
                    Trade Quality
                  </div>
                  <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${palette.badge}`}>
                    {rating.label}
                  </div>
                </div>

                <div className="mb-4 flex items-end gap-3">
                  <div className="text-6xl font-black leading-none">{score}</div>
                  <div className="pb-2 text-2xl font-bold text-slate-300">%</div>
                  <div className="pb-1 text-4xl">{rating.emoji}</div>
                </div>

                <div className="mb-4 h-4 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r transition-all duration-300 ${palette.progress}`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                <p className="text-sm leading-6 text-slate-300">{rating.desc}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t border-slate-800 p-5">
                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Confirmed
                  </div>
                  <div className="mt-2 text-3xl font-bold">{checkedCount}</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    Total Rules
                  </div>
                  <div className="mt-2 text-3xl font-bold">{totalCount}</div>
                </div>
              </div>

              <div className="border-t border-slate-800 p-5">
                <div className="mb-3 text-sm font-semibold text-slate-200">
                  Score Guide
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-200">
                    <span>No Trade</span>
                    <span>0–34%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-orange-200">
                    <span>Weak</span>
                    <span>35–54%</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-yellow-200">
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
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5 shadow-2xl backdrop-blur md:p-6">
              <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="w-full">
                  <label className="mb-2 block text-sm text-slate-300">
                    Tool Name
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-slate-500"
                  />
                </div>

                <button
                  onClick={loadStarterRules}
                  className="rounded-2xl border border-slate-700 px-4 py-3 font-semibold text-white transition hover:bg-slate-800"
                >
                  Load Starter Rules
                </button>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Write one rule per line
                  </label>
                  <textarea
                    value={bulkRules}
                    onChange={(e) => setBulkRules(e.target.value)}
                    className="min-h-[260px] w-full rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4 text-white outline-none transition focus:border-slate-500"
                    placeholder="Trend is clear
Entry is at key level
Risk is acceptable"
                  />

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      onClick={applyRules}
                      className="rounded-2xl bg-white px-5 py-3 font-semibold text-black transition hover:opacity-90"
                    >
                      Apply Rules
                    </button>

                    <button
                      onClick={resetChecks}
                      className="rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
                    >
                      Reset Checks
                    </button>
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="mb-3 text-lg font-semibold">Quick Add Rule</div>

                  <div className="flex flex-col gap-3">
                    <input
                      value={newRule}
                      onChange={(e) => setNewRule(e.target.value)}
                      placeholder="Example: Reward is at least 2R"
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-slate-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addRule()
                      }}
                    />

                    <button
                      onClick={addRule}
                      className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-black transition hover:opacity-90"
                    >
                      Add Rule
                    </button>
                  </div>

                  <div className="mt-6">
                    <div className="mb-3 text-sm font-semibold text-slate-200">
                      Why this tool helps
                    </div>

                    <div className="space-y-3 text-sm text-slate-400">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                        It forces you to slow down before entry.
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                        It makes your own rules visible and measurable.
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                        It reduces impulsive trades driven by boredom or emotion.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-800 bg-slate-900/80 p-5 shadow-2xl backdrop-blur md:p-6">
              <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Checklist</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Tick only the conditions that are truly present in this trade.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-sm text-slate-300">
                  {checkedCount} / {totalCount} confirmed
                </div>
              </div>

              {rules.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-10 text-center text-slate-400">
                  No rules yet. Add your rules and press Apply Rules.
                </div>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className={`group flex items-center gap-3 rounded-3xl border p-4 transition ${
                        rule.checked
                          ? 'border-emerald-500/30 bg-emerald-500/10'
                          : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                      }`}
                    >
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className="flex flex-1 items-center gap-4 text-left"
                      >
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-xl border text-lg ${
                            rule.checked
                              ? 'border-emerald-400 bg-emerald-400 text-black'
                              : 'border-slate-700 bg-slate-900 text-slate-500'
                          }`}
                        >
                          {rule.checked ? '✓' : ''}
                        </span>

                        <span
                          className={`text-base ${
                            rule.checked ? 'text-white' : 'text-slate-200'
                          }`}
                        >
                          {rule.text}
                        </span>
                      </button>

                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
