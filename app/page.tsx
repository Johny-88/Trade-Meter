'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

type Weight = 5 | 10 | 20
type Importance = 'mandatory' | 'important' | 'bonus'

type Rule = {
  id: string
  text: string
  checked: boolean
  weight: Weight
  required: boolean
  importance: Importance
}

type StarterRule = {
  text: string
  importance: Importance
}

type Tone = 'emerald' | 'lime' | 'amber' | 'orange' | 'red'

const STORAGE_KEY = 'trade-meter-pro-v2'

const starterRules: StarterRule[] = [
  {
    text: 'No emotional impulse is present',
    importance: 'mandatory',
  },
  {
    text: 'Stop loss is defined before entry',
    importance: 'mandatory',
  },
  {
    text: 'Risk is acceptable',
    importance: 'important',
  },
  {
    text: 'Reward is at least 2R',
    importance: 'important',
  },
  {
    text: 'Candlestick setup present',
    importance: 'bonus',
  },
  {
    text: 'Retested a previous level',
    importance: 'bonus',
  },
]

const toneMap: Record<
  Tone,
  {
    ring: string
    soft: string
    badge: string
    pill: string
    button: string
    fill: string
  }
> = {
  emerald: {
    ring: 'text-emerald-400',
    soft: 'from-emerald-500/20 to-emerald-400/5',
    badge: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
    pill: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    button: 'bg-emerald-400 text-slate-950 hover:opacity-90',
    fill: 'bg-emerald-400',
  },
  lime: {
    ring: 'text-lime-400',
    soft: 'from-lime-500/20 to-lime-400/5',
    badge: 'border-lime-500/25 bg-lime-500/10 text-lime-300',
    pill: 'border-lime-500/20 bg-lime-500/10 text-lime-200',
    button: 'bg-lime-400 text-slate-950 hover:opacity-90',
    fill: 'bg-lime-400',
  },
  amber: {
    ring: 'text-amber-400',
    soft: 'from-amber-500/20 to-amber-400/5',
    badge: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
    pill: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
    button: 'bg-amber-400 text-slate-950 hover:opacity-90',
    fill: 'bg-amber-400',
  },
  orange: {
    ring: 'text-orange-400',
    soft: 'from-orange-500/20 to-orange-400/5',
    badge: 'border-orange-500/25 bg-orange-500/10 text-orange-300',
    pill: 'border-orange-500/20 bg-orange-500/10 text-orange-200',
    button: 'bg-orange-400 text-slate-950 hover:opacity-90',
    fill: 'bg-orange-400',
  },
  red: {
    ring: 'text-red-400',
    soft: 'from-red-500/20 to-red-400/5',
    badge: 'border-red-500/25 bg-red-500/10 text-red-300',
    pill: 'border-red-500/20 bg-red-500/10 text-red-200',
    button: 'bg-red-400 text-slate-950 hover:opacity-90',
    fill: 'bg-red-400',
  },
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function normalizeRuleText(text: string) {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

function getImportanceConfig(importance: Importance) {
  if (importance === 'mandatory') {
    return {
      importance,
      weight: 20 as Weight,
      required: true,
    }
  }

  if (importance === 'bonus') {
    return {
      importance,
      weight: 5 as Weight,
      required: false,
    }
  }

  return {
    importance: 'important' as Importance,
    weight: 10 as Weight,
    required: false,
  }
}

function getImportanceFromWeight(weight: Weight, required: boolean) {
  if (required || weight === 20) return 'mandatory' as Importance
  if (weight === 5) return 'bonus' as Importance
  return 'important' as Importance
}

const importanceOptions: { value: Importance; label: string }[] = [
  { value: 'mandatory', label: 'Mandatory' },
  { value: 'important', label: 'Important' },
  { value: 'bonus', label: 'Bonus' },
]

function getImportanceBadge(importance: Importance) {
  if (importance === 'mandatory') {
    return {
      label: 'Mandatory',
      className: 'border-red-500/20 bg-red-500/10 text-red-200',
    }
  }

  if (importance === 'bonus') {
    return {
      label: 'Bonus',
      className: 'border-sky-500/20 bg-sky-500/10 text-sky-200',
    }
  }

  return {
    label: 'Important',
    className: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
  }
}

function getRuleDefaults(text: string) {
  const starterRule = starterRules.find((rule) => rule.text === text)

  if (starterRule) {
    return getImportanceConfig(starterRule.importance)
  }

  return getImportanceConfig('important')
}

function createRule(input: string | StarterRule, importance?: Importance): Rule {
  const text = typeof input === 'string' ? input : input.text
  const defaults =
    typeof input === 'string'
      ? importance
        ? getImportanceConfig(importance)
        : getRuleDefaults(input)
      : getImportanceConfig(input.importance)

  return {
    id: makeId(),
    text,
    checked: false,
    weight: defaults.weight,
    required: defaults.required,
    importance: defaults.importance,
  }
}

function normalizeRule(rule: Partial<Rule> & { text: string }): Rule {
  const defaults = getRuleDefaults(rule.text)
  const weight = rule.weight === 5 || rule.weight === 10 || rule.weight === 20 ? rule.weight : defaults.weight
  const required = typeof rule.required === 'boolean' ? rule.required : defaults.required
  const importance =
    rule.importance === 'mandatory' || rule.importance === 'important' || rule.importance === 'bonus'
      ? rule.importance
      : getImportanceFromWeight(weight, required)

  const normalizedImportance = getImportanceConfig(importance)

  return {
    id: typeof rule.id === 'string' && rule.id ? rule.id : makeId(),
    text: rule.text,
    checked: Boolean(rule.checked),
    weight: normalizedImportance.weight,
    required: normalizedImportance.required,
    importance: normalizedImportance.importance,
  }
}

function isStoredRule(value: unknown): value is Partial<Rule> & { text: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'text' in value &&
    typeof (value as { text?: unknown }).text === 'string'
  )
}

function parseRules(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function getScoreBand(score: number) {
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

function getDecisionRating(
  score: number,
  minScore: number,
  hasMissingRequired: boolean,
  missingRequiredCount: number
) {
  const scoreBand = getScoreBand(score)

  if (hasMissingRequired) {
    return {
      label: 'No Trade',
      desc:
        score >= minScore
          ? `This setup has enough points, but ${missingRequiredCount === 1 ? 'one Mandatory rule is' : 'Mandatory rules are'} still missing.`
          : `This setup is below your minimum score and ${missingRequiredCount === 1 ? 'one Mandatory rule is' : 'Mandatory rules are'} still missing.`,
      emoji: '🚫',
      action:
        score >= minScore
          ? 'Blocked setup. Do not take it until every Mandatory rule is confirmed.'
          : 'Blocked setup. It is below your minimum threshold and also missing Mandatory confirmation.',
      tone: 'red' as Tone,
      bandLabel: scoreBand.label,
    }
  }

  if (score < minScore) {
    return {
      label: scoreBand.label,
      desc: `Quality is currently ${scoreBand.label}. Score: ${score}% vs minimum ${minScore}%.`,
      emoji: scoreBand.emoji,
      action: `${scoreBand.label}, but below your minimum threshold. Wait for better alignment.`,
      tone: score >= Math.max(minScore - 10, 0) ? ('amber' as Tone) : ('red' as Tone),
      bandLabel: scoreBand.label,
    }
  }

  if (score >= 75) {
    return {
      ...scoreBand,
      desc: `This setup qualifies under your current minimum of ${minScore}% and rates as ${scoreBand.label}.`,
      bandLabel: scoreBand.label,
    }
  }

  return {
    ...scoreBand,
    desc: `This setup qualifies under your current minimum of ${minScore}%, but its overall quality is still only ${scoreBand.label}.`,
    action:
      score >= 55
        ? 'Qualified by threshold, but be selective. This is still only an Average setup.'
        : 'Qualified by threshold, but setup quality is still weak. Waiting is usually the better trade.',
    tone: scoreBand.tone,
    bandLabel: scoreBand.label,
  }
}

export default function Home() {
  const title = 'Trade Meter'
  const [newRule, setNewRule] = useState('')
  const [newRuleImportance, setNewRuleImportance] = useState<Importance>('important')
  const [newRuleError, setNewRuleError] = useState('')
  const [minScore, setMinScore] = useState(75)
  const [rules, setRules] = useState<Rule[]>(starterRules.map((rule) => createRule(rule)))
  const [topOffset, setTopOffset] = useState(0)
  const liveScoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)

      if (typeof parsed.minScore === 'number') {
        setMinScore(parsed.minScore)
      }

      if (Array.isArray(parsed.rules)) {
        setRules(parsed.rules.filter(isStoredRule).map((rule: Partial<Rule> & { text: string }) => normalizeRule(rule)))
      } else if (typeof parsed.bulkRules === 'string') {
        setRules(parseRules(parsed.bulkRules).map((rule: string) => createRule(rule)))
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
  const totalPoints = rules.reduce((sum, rule) => sum + rule.weight, 0)
  const checkedPoints = rules.reduce(
    (sum, rule) => sum + (rule.checked ? rule.weight : 0),
    0
  )
  const missingPoints = Math.max(totalPoints - checkedPoints, 0)
  const missingRequiredRules = rules.filter((rule) => rule.required && !rule.checked)
  const hasMissingRequired = missingRequiredRules.length > 0
  const score = totalPoints > 0 ? Math.round((checkedPoints / totalPoints) * 100) : 0
  const scoreBand = useMemo(() => getScoreBand(score), [score])
  const rating = useMemo(
    () => getDecisionRating(score, minScore, hasMissingRequired, missingRequiredRules.length),
    [score, minScore, hasMissingRequired, missingRequiredRules.length]
  )
  const styles = toneMap[rating.tone]
  const scoreBandStyles = toneMap[scoreBand.tone]
  const meetsMinScore = score >= minScore
  const qualifies = meetsMinScore && !hasMissingRequired

  const qualificationTone: Tone = hasMissingRequired
    ? 'red'
    : qualifies
    ? scoreBand.tone
    : rating.tone
  const qualificationStyles = toneMap[qualificationTone]

  const qualificationSummary = hasMissingRequired
    ? meetsMinScore
      ? `Blocked • ${missingRequiredRules.length} Mandatory ${missingRequiredRules.length === 1 ? 'rule' : 'rules'} missing`
      : `Blocked • ${missingRequiredRules.length} Mandatory ${missingRequiredRules.length === 1 ? 'rule' : 'rules'} missing • Below threshold (${score}% vs ${minScore}% minimum)`
    : qualifies
    ? `Qualified by threshold • ${score}% vs ${minScore}% minimum`
    : `Below threshold • ${score}% vs ${minScore}% minimum`

  useLayoutEffect(() => {
    const updateOffset = () => {
      if (!liveScoreRef.current) return
      setTopOffset(liveScoreRef.current.offsetHeight + 16)
    }

    updateOffset()
    window.addEventListener('resize', updateOffset)

    return () => {
      window.removeEventListener('resize', updateOffset)
    }
  }, [
    score,
    checkedCount,
    missingCount,
    totalCount,
    checkedPoints,
    missingPoints,
    totalPoints,
    minScore,
    qualifies,
    rating.label,
    rating.desc,
    rating.action,
    qualificationSummary,
  ])

  const loadStarterRules = () => {
    setRules(starterRules.map((rule) => createRule(rule)))
    setNewRuleError('')
  }

  const clearAllRules = () => {
    setRules([])
    setNewRule('')
    setNewRuleImportance('important')
    setNewRuleError('')
  }

  const resetChecks = () => {
    setRules((prev) => prev.map((rule) => ({ ...rule, checked: false })))
  }

  const addRule = () => {
    const trimmed = newRule.trim()
    if (!trimmed) return

    const normalizedNewRule = normalizeRuleText(trimmed)
    const alreadyExists = rules.some(
      (rule) => normalizeRuleText(rule.text) === normalizedNewRule
    )

    if (alreadyExists) {
      setNewRuleError('This rule already exists. Keep each condition only once so the score stays accurate.')
      return
    }

    const rule = createRule(trimmed, newRuleImportance)
    setRules((prev) => [...prev, rule])
    setNewRule('')
    setNewRuleImportance('important')
    setNewRuleError('')
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
    setNewRuleError('')
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-0 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div
        ref={liveScoreRef}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-2 md:px-4"
      >
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/88 shadow-2xl backdrop-blur-xl">
          <div className={`bg-gradient-to-r ${styles.soft} p-2.5 md:p-3`}>
            <div className="grid gap-2 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-center">
              <div className="rounded-[18px] border border-white/10 bg-slate-950/50 p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400 md:text-[11px]">
                    Your Setup Score
                  </span>
                  <span className="text-base md:text-lg">{rating.emoji}</span>
                </div>

                <div className="mb-1.5 flex items-end justify-between gap-2">
                  <div className="text-2xl font-black leading-none md:text-[30px]">
                    {score}%
                  </div>
                  <div
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold md:text-[11px] ${scoreBandStyles.badge}`}
                  >
                    {scoreBand.label}
                  </div>
                </div>

                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${styles.fill}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>

              <div className="min-w-0 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <div
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold md:text-[11px] ${scoreBandStyles.badge}`}
                  >
                    {scoreBand.label}
                  </div>

                  <div
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold md:text-[11px] ${qualificationStyles.badge}`}
                  >
                    {qualificationSummary}
                  </div>
                </div>

                <div className="mt-1 text-xs font-semibold text-white md:text-sm">
                  {rating.action}
                </div>

                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-300 md:text-xs md:leading-5">
                  {rating.desc}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5 md:flex md:items-center md:justify-end">
                <div className="min-w-0 rounded-xl border border-white/10 bg-slate-950/50 px-2.5 py-2 md:min-w-[96px] md:px-2 md:py-1.5">
                  <div className="text-[7px] uppercase tracking-[0.14em] text-slate-500 md:text-[8px]">
                    Checked
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 md:block md:text-center">
                    <div className="text-xs font-bold leading-none md:text-sm">{checkedPoints} pts</div>
                    <div className="text-[10px] text-slate-400 md:mt-0.5 md:text-[11px]">{checkedCount} rules</div>
                  </div>
                </div>

                <div className="min-w-0 rounded-xl border border-white/10 bg-slate-950/50 px-2.5 py-2 md:min-w-[96px] md:px-2 md:py-1.5">
                  <div className="text-[7px] uppercase tracking-[0.14em] text-slate-500 md:text-[8px]">
                    Missing
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 md:block md:text-center">
                    <div className="text-xs font-bold leading-none md:text-sm">{missingPoints} pts</div>
                    <div className="text-[10px] text-slate-400 md:mt-0.5 md:text-[11px]">{missingCount} rules</div>
                  </div>
                </div>

                <div className="min-w-0 rounded-xl border border-white/10 bg-slate-950/50 px-2.5 py-2 md:min-w-[96px] md:px-2 md:py-1.5">
                  <div className="text-[7px] uppercase tracking-[0.14em] text-slate-500 md:text-[8px]">
                    Total
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 md:block md:text-center">
                    <div className="text-xs font-bold leading-none md:text-sm">{totalPoints} pts</div>
                    <div className="text-[10px] text-slate-400 md:mt-0.5 md:text-[11px]">{totalCount} rules</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="relative mx-auto max-w-7xl px-4 pb-6 md:px-6 lg:px-8 lg:pb-8"
        style={{ paddingTop: topOffset }}
      >
        <div className="mb-6 rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-2 flex w-fit mx-auto items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-300">
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

      
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-xl md:p-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="rounded-[22px] border border-white/10 bg-slate-950/50 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-200">
                    Set your minimum setup quality threshold
                  </div>
                  <div className="text-sm font-semibold text-white">{minScore}%</div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full accent-emerald-400"
                />


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
                  Add your own rules to checklist
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={newRule}
                    onChange={(e) => {
                      setNewRule(e.target.value)
                      if (newRuleError) setNewRuleError('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addRule()
                    }}
                    placeholder="Example: Reward is at least 2R"
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-sm text-white outline-none transition focus:border-slate-500"
                  />

                  <div className="flex items-center gap-2">
                    <select
                      value={newRuleImportance}
                      onChange={(e) => setNewRuleImportance(e.target.value as Importance)}
                      className="h-10 rounded-2xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none transition focus:border-slate-500"
                    >
                      {importanceOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={addRule}
                      aria-label="Add rule"
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xl font-bold transition ${styles.button}`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {newRuleError && (
                  <div className="mt-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-[11px] leading-5 text-red-200 md:text-xs">
                    {newRuleError}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={loadStarterRules}
                    className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
                  >
                    Load Starter Set
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
                    Delete rules
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
                  Tick only what is truly present in this setup. Not what you want to see, but what is actually on the charts!!!
                </p>
              </div>

              <div className={`rounded-full border px-4 py-2 text-sm font-medium ${styles.pill}`}>
                {checkedPoints} / {totalPoints} pts • {checkedCount} / {totalCount} rules
              </div>
            </div>

            {rules.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-slate-950/50 p-8 text-center text-slate-400">
                No rules yet. Add rules using the + button above.
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => {
                  const importanceBadge = getImportanceBadge(rule.importance)

                  return (
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
                          {rule.checked ? '✓' : ''}
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

                      <div className="flex items-center gap-2">
                        <div
                          className={`rounded-xl border px-2.5 py-2 text-[11px] font-medium md:text-xs ${importanceBadge.className}`}
                        >
                          {importanceBadge.label}
                        </div>

                        <button
                          onClick={() => deleteRule(rule.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg text-slate-400 transition hover:bg-white/10 hover:text-white md:h-10 md:w-10"
                          aria-label="Delete rule"
                        >
                          -
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
