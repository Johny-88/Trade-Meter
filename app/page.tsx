'use client'

import { useMemo, useState } from 'react'

type Rule = {
  id: number
  text: string
  checked: boolean
}

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
      label: 'A+ setup',
      desc: 'Excellent quality. Very strong trade conditions.',
      emoji: '😎',
    }
  }
  if (score >= 75) {
    return {
      label: 'Good setup',
      desc: 'Solid trade. Conditions are mostly aligned.',
      emoji: '🙂',
    }
  }
  if (score >= 55) {
    return {
      label: 'Average setup',
      desc: 'Decent, but not fully convincing yet.',
      emoji: '😐',
    }
  }
  if (score >= 35) {
    return {
      label: 'Weak setup',
      desc: 'Too many things are missing. Be careful.',
      emoji: '⚠️',
    }
  }

  return {
    label: 'Avoid trade',
    desc: 'Low quality. Better to stay out.',
    emoji: '🚫',
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

  const checkedCount = rules.filter((rule) => rule.checked).length
  const totalCount = rules.length
  const score = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0
  const rating = useMemo(() => getRating(score), [score])

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

    setRules((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: trimmed,
        checked: false,
      },
    ])

    setBulkRules((prev) => (prev.trim() ? `${prev}\n${trimmed}` : trimmed))
    setNewRule('')
  }

  const resetChecks = () => {
    setRules((prev) => prev.map((rule) => ({ ...rule, checked: false })))
  }

  const progressColor =
    score >= 75
      ? 'bg-emerald-500'
      : score >= 55
      ? 'bg-yellow-400'
      : score >= 35
      ? 'bg-orange-500'
      : 'bg-red-500'

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <p className="mb-2 text-sm uppercase tracking-[0.25em] text-slate-400">
              Trading checklist tool
            </p>

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="w-full">
                <label className="mb-2 block text-sm text-slate-300">
                  Tool title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                />
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-center md:min-w-[180px]">
                <div className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                  Trade quality
                </div>
                <div className="mt-1 flex items-center justify-center gap-2 text-4xl font-bold text-emerald-400">
                  <span>{score}%</span>
                  <span>{rating.emoji}</span>
                </div>
              </div>
            </div>

            <h1 className="mb-4 text-3xl font-bold">{title}</h1>

            <div className="mb-4 h-4 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full ${progressColor} transition-all duration-300`}
                style={{ width: `${score}%` }}
              />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="text-xl font-semibold">{rating.label}</div>
              <div className="mt-1 text-sm text-slate-400">{rating.desc}</div>
              <div className="mt-3 text-sm text-slate-300">
                {checkedCount} of {totalCount} rules confirmed
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-4 text-2xl font-bold">How it works</h2>

            <div className="space-y-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                1. Write your personal trading rules.
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                2. Press <strong>Apply Rules</strong>.
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                3. Tick the boxes that match your setup.
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                4. The percentage shows how strong the trade is.
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-100">
                This helps reduce random entries and forces discipline.
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h2 className="mb-4 text-2xl font-bold">Create your rules</h2>

            <label className="mb-2 block text-sm text-slate-300">
              One rule per line
            </label>

            <textarea
              value={bulkRules}
              onChange={(e) => setBulkRules(e.target.value)}
              className="min-h-[260px] w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
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

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="mb-3 text-sm font-medium text-slate-200">
                Add one extra rule
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  placeholder="Example: Reward is at least 2R"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addRule()
                  }}
                />

                <button
                  onClick={addRule}
                  className="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-black transition hover:opacity-90"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Checklist</h2>
              <div className="text-sm text-slate-400">
                Tick what matches this trade
              </div>
            </div>

            {rules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center text-slate-400">
                No rules yet. Add your rules and press Apply Rules.
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${
                      rule.checked
                        ? 'border-emerald-500/30 bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-950'
                    }`}
                  >
                    <button
                      onClick={() => toggleRule(rule.id)}
                      className="flex flex-1 items-center gap-3 text-left"
                    >
                      <span className="text-2xl">
                        {rule.checked ? '✅' : '⬜'}
                      </span>
                      <span className="text-base text-slate-200">
                        {rule.text}
                      </span>
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