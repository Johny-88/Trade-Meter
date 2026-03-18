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
type AppTheme = 'dark' | 'light'

const STORAGE_KEY = 'trade-meter-pro-v2'
const THEME_STORAGE_KEY = 'trade-meter-theme-v1'

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

const darkToneMap: Record<
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

const lightToneMap: Record<
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
    ring: 'text-emerald-700',
    soft: 'from-emerald-200/80 to-emerald-50',
    badge: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    pill: 'border-emerald-300 bg-emerald-50 text-emerald-700',
    button: 'bg-emerald-500 text-white hover:opacity-90',
    fill: 'bg-emerald-500',
  },
  lime: {
    ring: 'text-lime-700',
    soft: 'from-lime-200/80 to-lime-50',
    badge: 'border-lime-300 bg-lime-50 text-lime-700',
    pill: 'border-lime-300 bg-lime-50 text-lime-700',
    button: 'bg-lime-500 text-white hover:opacity-90',
    fill: 'bg-lime-500',
  },
  amber: {
    ring: 'text-amber-700',
    soft: 'from-amber-200/80 to-amber-50',
    badge: 'border-amber-300 bg-amber-50 text-amber-700',
    pill: 'border-amber-300 bg-amber-50 text-amber-700',
    button: 'bg-amber-500 text-white hover:opacity-90',
    fill: 'bg-amber-500',
  },
  orange: {
    ring: 'text-orange-700',
    soft: 'from-orange-200/80 to-orange-50',
    badge: 'border-orange-300 bg-orange-50 text-orange-700',
    pill: 'border-orange-300 bg-orange-50 text-orange-700',
    button: 'bg-orange-500 text-white hover:opacity-90',
    fill: 'bg-orange-500',
  },
  red: {
    ring: 'text-red-700',
    soft: 'from-red-200/80 to-red-50',
    badge: 'border-red-300 bg-red-50 text-red-700',
    pill: 'border-red-300 bg-red-50 text-red-700',
    button: 'bg-red-500 text-white hover:opacity-90',
    fill: 'bg-red-500',
  },
}

const toneMaps: Record<AppTheme, typeof darkToneMap> = {
  dark: darkToneMap,
  light: lightToneMap,
}

const themeClasses: Record<
  AppTheme,
  {
    main: string
    glowOne: string
    glowTwo: string
    glowThree: string
    liveOuter: string
    scorePanel: string
    card: string
    innerCard: string
    tag: string
    muted: string
    subtle: string
    primaryStrong: string
    secondaryStrong: string
    statBox: string
    statLabel: string
    statMeta: string
    barTrack: string
    input: string
    select: string
    secondaryBtn: string
    dangerBtn: string
    errorBox: string
    empty: string
    ruleUnchecked: string
    ruleChecked: string
    checkboxUnchecked: string
    ruleTextUnchecked: string
    ruleTextChecked: string
    deleteRule: string
    toggleShell: string
    toggleActive: string
    toggleInactive: string
  }
> = {
  dark: {
    main: 'bg-slate-950 text-white',
    glowOne: 'bg-emerald-500/10',
    glowTwo: 'bg-sky-500/10',
    glowThree: 'bg-violet-500/10',
    liveOuter: 'border border-white/10 bg-slate-950/88 shadow-2xl backdrop-blur-xl',
    scorePanel: 'border border-white/10 bg-slate-950/50',
    card: 'border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl',
    innerCard: 'border border-white/10 bg-slate-950/50',
    tag: 'border border-white/10 bg-white/5 text-slate-300',
    muted: 'text-slate-400',
    subtle: 'text-slate-300',
    primaryStrong: 'text-white',
    secondaryStrong: 'text-slate-200',
    statBox: 'border border-white/10 bg-slate-950/50',
    statLabel: 'text-slate-500',
    statMeta: 'text-slate-400',
    barTrack: 'bg-white/10',
    input: 'border border-white/10 bg-slate-950/70 text-white placeholder:text-slate-500 focus:border-slate-500',
    select: 'border border-white/10 bg-slate-950/70 text-white focus:border-slate-500',
    secondaryBtn: 'border border-white/10 bg-white/5 text-white hover:bg-white/10',
    dangerBtn: 'border border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/20',
    errorBox: 'border border-red-500/20 bg-red-500/10 text-red-200',
    empty: 'border border-dashed border-white/10 bg-slate-950/50 text-slate-400',
    ruleUnchecked: 'border border-white/10 bg-slate-950/50 hover:bg-white/5',
    ruleChecked: 'border border-emerald-500/20 bg-emerald-500/10',
    checkboxUnchecked: 'border border-white/10 bg-white/5 text-slate-400',
    ruleTextUnchecked: 'text-slate-200',
    ruleTextChecked: 'text-white',
    deleteRule: 'border border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white',
    toggleShell: 'border border-white/10 bg-slate-950/88 shadow-xl backdrop-blur-xl',
    toggleActive: 'bg-white text-slate-950 shadow-sm',
    toggleInactive: 'text-slate-300 hover:bg-white/10 hover:text-white',
  },
  light: {
    main: 'bg-slate-100 text-slate-950',
    glowOne: 'bg-emerald-400/12',
    glowTwo: 'bg-sky-400/12',
    glowThree: 'bg-violet-400/10',
    liveOuter: 'border border-slate-200 bg-white/90 shadow-xl backdrop-blur-xl',
    scorePanel: 'border border-slate-200 bg-white/90',
    card: 'border border-slate-200 bg-white/92 shadow-xl backdrop-blur-xl',
    innerCard: 'border border-slate-200 bg-slate-50/95',
    tag: 'border border-slate-200 bg-slate-100 text-slate-600',
    muted: 'text-slate-500',
    subtle: 'text-slate-600',
    primaryStrong: 'text-slate-950',
    secondaryStrong: 'text-slate-900',
    statBox: 'border border-slate-200 bg-white/90',
    statLabel: 'text-slate-500',
    statMeta: 'text-slate-500',
    barTrack: 'bg-slate-200',
    input: 'border border-slate-300 bg-white text-slate-950 placeholder:text-slate-400 focus:border-slate-500',
    select: 'border border-slate-300 bg-white text-slate-950 focus:border-slate-500',
    secondaryBtn: 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50',
    dangerBtn: 'border border-red-300 bg-red-50 text-red-700 hover:bg-red-100',
    errorBox: 'border border-red-300 bg-red-50 text-red-700',
    empty: 'border border-dashed border-slate-200 bg-slate-50 text-slate-500',
    ruleUnchecked: 'border border-slate-200 bg-white hover:bg-slate-50',
    ruleChecked: 'border border-emerald-300 bg-emerald-50',
    checkboxUnchecked: 'border border-slate-300 bg-white text-slate-400',
    ruleTextUnchecked: 'text-slate-800',
    ruleTextChecked: 'text-slate-950',
    deleteRule: 'border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-900',
    toggleShell: 'border border-slate-200 bg-white/90 shadow-md backdrop-blur-xl',
    toggleActive: 'bg-slate-900 text-white shadow-sm',
    toggleInactive: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
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

function getImportanceBadge(importance: Importance, theme: AppTheme) {
  if (importance === 'mandatory') {
    return {
      label: 'Mandatory',
      className:
        theme === 'light'
          ? 'border-red-300 bg-red-50 text-red-700'
          : 'border-red-500/20 bg-red-500/10 text-red-200',
    }
  }

  if (importance === 'bonus') {
    return {
      label: 'Bonus',
      className:
        theme === 'light'
          ? 'border-sky-300 bg-sky-50 text-sky-700'
          : 'border-sky-500/20 bg-sky-500/10 text-sky-200',
    }
  }

  return {
    label: 'Important',
    className:
      theme === 'light'
        ? 'border-amber-300 bg-amber-50 text-amber-700'
        : 'border-amber-500/20 bg-amber-500/10 text-amber-200',
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


function getScoreBandPhrase(label: string) {
  if (label === 'A+ Setup') return 'still rates as an A+ setup'
  if (label === 'Average Setup') return 'still rates as an Average setup'
  if (label === 'Good Setup') return 'still rates as a Good setup'
  if (label === 'Weak Setup') return 'still rates as a Weak setup'
  return 'still rates as a low-quality setup'
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
          ? `This setup has enough points according to your threshold and ${getScoreBandPhrase(scoreBand.label)}, but ${missingRequiredCount === 1 ? 'one Mandatory rule is' : `${missingRequiredCount} Mandatory rules are`} still missing.`
          : `This setup is below your minimum score and ${missingRequiredCount === 1 ? 'one Mandatory rule is' : `${missingRequiredCount} Mandatory rules are`} still missing.`,
      emoji: '🚫',
      action:
        score >= minScore
          ? 'Blocked setup. Do not take it until every Mandatory rule is confirmed.'
          : 'Blocked setup. It is below your minimum threshold and also missing Mandatory confirmation.',
      tone: 'red' as Tone,
      bandLabel: scoreBand.label,
      decisionLabel: 'BLOCKED — DO NOT TRADE',
      decisionTone: 'red' as Tone,
    }
  }

  if (score < minScore) {
    return {
      label: scoreBand.label,
      desc: `This setup rates as ${scoreBand.label}, and it does not meet your current minimum threshold of ${minScore}%.`,
      emoji: scoreBand.emoji,
      action:
        score >= 75
          ? 'Setup quality is strong, but it is still below your minimum threshold. Wait for a cleaner score or lower the threshold only if that change is intentional.'
          : score >= 55
          ? 'Setup quality is decent, but it still does not qualify under your current threshold. Be patient and wait for stronger alignment.'
          : 'This setup is below your current threshold. Wait for better alignment before taking the trade.',
      tone:
        score >= 55
          ? ('amber' as Tone)
          : score >= 35
          ? ('orange' as Tone)
          : ('red' as Tone),
      bandLabel: scoreBand.label,
      decisionLabel: 'NOT QUALIFIED BY THRESHOLD',
      decisionTone:
        score >= 55
          ? ('amber' as Tone)
          : score >= 35
          ? ('orange' as Tone)
          : ('red' as Tone),
    }
  }

  if (score >= 75) {
    return {
      ...scoreBand,
      desc: `This setup qualifies under your current minimum of ${minScore}% and rates as ${scoreBand.label}.`,
      bandLabel: scoreBand.label,
      decisionLabel: 'TRADE',
      decisionTone: scoreBand.tone,
    }
  }

  return {
    ...scoreBand,
    desc: `This setup qualifies under your current minimum of ${minScore}%, but its overall quality is still only ${scoreBand.label}.`,
    action:
      score >= 55
        ? 'Qualified by threshold, but be selective. This is still only an Average setup.'
        : score >= 35
        ? 'Qualified by threshold, but setup quality is still weak. Waiting is usually the better trade.'
        : 'Qualified by threshold, but quality is still too low. Standing aside is the better decision.',
    tone: scoreBand.tone,
    bandLabel: scoreBand.label,
    decisionLabel:
      score >= 55
        ? 'TRADE CAREFULLY'
        : score >= 35
        ? 'WAIT FOR MORE CONFIRMATION'
        : 'DO NOT TRADE',
    decisionTone:
      score >= 55
        ? ('amber' as Tone)
        : score >= 35
        ? ('orange' as Tone)
        : ('red' as Tone),
  }
}

export default function Home() {
  const title = 'Edge Check'
  const [theme, setTheme] = useState<AppTheme>('light')
  const [newRule, setNewRule] = useState('')
  const [newRuleImportance, setNewRuleImportance] = useState<Importance>('important')
  const [newRuleError, setNewRuleError] = useState('')
  const [minScore, setMinScore] = useState(50)
  const [rules, setRules] = useState<Rule[]>(starterRules.map((rule) => createRule(rule)))
  const [topOffset, setTopOffset] = useState(0)
  const liveScoreRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)

    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme)
    }
  }, [])

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

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

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
  const toneMap = toneMaps[theme]
  const ui = themeClasses[theme]
  const styles = toneMap[rating.tone]
  const scoreBandStyles = toneMap[scoreBand.tone]
  const decisionStyles = toneMap[rating.decisionTone]
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
      ? `${missingRequiredRules.length} Mandatory ${missingRequiredRules.length === 1 ? 'rule' : 'rules'} missing`
      : `${missingRequiredRules.length} Mandatory ${missingRequiredRules.length === 1 ? 'rule' : 'rules'} missing • Below threshold (${score}% vs ${minScore}% minimum)`
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
    theme,
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
    <main className={`min-h-screen overflow-x-hidden ${ui.main}`}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className={`absolute -top-24 left-0 h-72 w-72 rounded-full ${ui.glowOne} blur-3xl`} />
        <div className={`absolute right-0 top-0 h-72 w-72 rounded-full ${ui.glowTwo} blur-3xl`} />
        <div className={`absolute bottom-0 left-1/3 h-72 w-72 rounded-full ${ui.glowThree} blur-3xl`} />
      </div>

      <div
        ref={liveScoreRef}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-2 md:px-4"
      >
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-full rounded-b-[28px] ${
            theme === 'light'
              ? 'bg-slate-100/72 backdrop-blur-xl'
              : 'bg-slate-950/48 backdrop-blur-xl'
          }`}
        />

        <div className="relative z-10 mx-auto mb-2 flex max-w-7xl items-center justify-between gap-3">
          <div
            className={`text-lg font-bold md:text-xl ${
             theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}
              >
                 Edge Check
          </div>

          <div className={`inline-flex items-center gap-1 rounded-full p-1 ${ui.toggleShell}`}>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${theme === 'dark' ? ui.toggleActive : ui.toggleInactive}`}
              aria-pressed={theme === 'dark'}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${theme === 'light' ? ui.toggleActive : ui.toggleInactive}`}
              aria-pressed={theme === 'light'}
            >
              Light
            </button>
          </div>
        </div>

        <div className={`relative z-10 mx-auto max-w-7xl overflow-hidden rounded-[22px] ${ui.liveOuter}`}>
          <div className={`bg-gradient-to-r ${styles.soft} p-2.5 md:p-3`}>
            <div className="grid gap-2 md:grid-cols-[260px_minmax(0,1fr)_auto] lg:grid-cols-[280px_minmax(0,1fr)_auto] md:items-center">
              <div className={`rounded-[18px] p-2.5 ${ui.scorePanel}`}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className={`text-[10px] uppercase tracking-[0.18em] md:text-[11px] ${ui.muted}`}>
                    Your Setup Score
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold md:text-[11px] ${scoreBandStyles.badge}`}
                    >
                      {scoreBand.label}
                    </div>
                    <span className="text-base md:text-lg">{rating.emoji}</span>
                  </div>
                </div>

                <div className="mb-1.5">
                  <div className="text-2xl font-black leading-none md:text-[30px]">
                    {score}%
                  </div>
                </div>

                <div className={`h-2.5 overflow-hidden rounded-full ${ui.barTrack}`}>
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${styles.fill}`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>

              <div className="min-w-0 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  <div
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] md:text-[11px] ${decisionStyles.badge}`}
                  >
                    {rating.decisionLabel}
                  </div>

                  <div
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold md:text-[11px] ${qualificationStyles.badge}`}
                  >
                    {qualificationSummary}
                  </div>
                </div>

                <div className={`mt-1 text-xs font-semibold md:text-sm ${ui.primaryStrong}`}>
                  {rating.action}
                </div>

                <p className={`mt-1 line-clamp-2 text-[11px] leading-4 md:text-xs md:leading-5 ${ui.subtle}`}>
                  {rating.desc}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5 md:flex md:items-center md:justify-end">
                <div className={`min-w-0 rounded-xl px-2.5 py-2 md:min-w-[96px] md:px-2 md:py-1.5 ${ui.statBox}`}>
                  <div className={`text-[7px] uppercase tracking-[0.14em] md:text-[8px] ${ui.statLabel}`}>
                    Checked
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 md:block md:text-center">
                    <div className="text-xs font-bold leading-none md:text-sm">{checkedPoints} pts</div>
                    <div className={`text-[10px] md:mt-0.5 md:text-[11px] ${ui.statMeta}`}>{checkedCount} rules</div>
                  </div>
                </div>

                <div className={`min-w-0 rounded-xl px-2.5 py-2 md:min-w-[96px] md:px-2 md:py-1.5 ${ui.statBox}`}>
                  <div className={`text-[7px] uppercase tracking-[0.14em] md:text-[8px] ${ui.statLabel}`}>
                    Missing
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 md:block md:text-center">
                    <div className="text-xs font-bold leading-none md:text-sm">{missingPoints} pts</div>
                    <div className={`text-[10px] md:mt-0.5 md:text-[11px] ${ui.statMeta}`}>{missingCount} rules</div>
                  </div>
                </div>

                <div className={`min-w-0 rounded-xl px-2.5 py-2 md:min-w-[96px] md:px-2 md:py-1.5 ${ui.statBox}`}>
                  <div className={`text-[7px] uppercase tracking-[0.14em] md:text-[8px] ${ui.statLabel}`}>
                    Total
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 md:block md:text-center">
                    <div className="text-xs font-bold leading-none md:text-sm">{totalPoints} pts</div>
                    <div className={`text-[10px] md:mt-0.5 md:text-[11px] ${ui.statMeta}`}>{totalCount} rules</div>
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
        <div className={`mb-6 rounded-[28px] p-5 md:p-6 ${ui.card}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className={`mb-2 flex w-fit mx-auto items-center justify-center text-center rounded-full px-3 py-1 text-xs uppercase tracking-[0.3em] ${ui.tag}`}>
                 EdgeCheck - Trading Discipline App
              </div>

              <p className={`mt-3 max-w-2xl text-sm leading-6 md:text-base ${ui.subtle}`}>
                Build your own pre-trade checklist, score every setup in seconds,
                and stop entering trades that do not truly meet your standards.
              </p>
            </div>

      
          </div>
        </div>

        <div className="space-y-4">
          <div className={`rounded-[24px] p-3 md:p-4 ${ui.card}`}>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className={`rounded-[22px] p-3 ${ui.innerCard}`}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className={`text-sm font-semibold ${ui.secondaryStrong}`}>
                    Set your minimum setup quality threshold
                  </div>
                  <div className={`text-sm font-semibold ${ui.primaryStrong}`}>{minScore}%</div>
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
                  <div
                    className={`rounded-full border px-2.5 py-1 ${
                      theme === 'light'
                        ? 'border-red-300 bg-red-50 text-red-700'
                        : 'border-red-500/20 bg-red-500/10 text-red-200'
                    }`}
                  >
                    No Trade 0–34%
                  </div>
                  <div
                    className={`rounded-full border px-2.5 py-1 ${
                      theme === 'light'
                        ? 'border-orange-300 bg-orange-50 text-orange-700'
                        : 'border-orange-500/20 bg-orange-500/10 text-orange-200'
                    }`}
                  >
                    Weak 35–54%
                  </div>
                  <div
                    className={`rounded-full border px-2.5 py-1 ${
                      theme === 'light'
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-amber-500/20 bg-amber-500/10 text-amber-200'
                    }`}
                  >
                    Average 55–74%
                  </div>
                  <div
                    className={`rounded-full border px-2.5 py-1 ${
                      theme === 'light'
                        ? 'border-lime-300 bg-lime-50 text-lime-700'
                        : 'border-lime-500/20 bg-lime-500/10 text-lime-200'
                    }`}
                  >
                    Good 75–89%
                  </div>
                  <div
                    className={`rounded-full border px-2.5 py-1 ${
                      theme === 'light'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                    }`}
                  >
                    A+ 90–100%
                  </div>
                </div>
              </div>

              <div className={`rounded-[22px] p-3 ${ui.innerCard}`}>
                <div className={`mb-2 text-sm font-semibold ${ui.secondaryStrong}`}>
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
                    className={`w-full rounded-2xl px-3 py-2.5 text-sm outline-none transition ${ui.input}`}
                  />

                  <div className="flex items-center gap-2">
                    <select
                      value={newRuleImportance}
                      onChange={(e) => setNewRuleImportance(e.target.value as Importance)}
                      className={`h-10 rounded-2xl px-3 text-sm outline-none transition ${ui.select}`}
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
                  <div className={`mt-2 rounded-2xl px-3 py-2 text-[11px] leading-5 md:text-xs ${ui.errorBox}`}>
                    {newRuleError}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={loadStarterRules}
                    className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${ui.secondaryBtn}`}
                  >
                    Load Starter Set
                  </button>

                  <button
                    onClick={resetChecks}
                    className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${ui.secondaryBtn}`}
                  >
                    Reset
                  </button>

                  <button
                    onClick={clearAllRules}
                    className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${ui.dangerBtn}`}
                  >
                    Delete rules
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-[28px] p-4 md:p-5 ${ui.card}`}>
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold md:text-2xl">Checklist</h2>
                <p className={`mt-1 text-sm ${ui.muted}`}>
                  Tick only what is truly present in this setup. Not what you want to see, but what is actually on the charts!!!
                </p>
              </div>

              <div className={`rounded-full border px-4 py-2 text-sm font-medium ${styles.pill}`}>
                {checkedPoints} / {totalPoints} pts • {checkedCount} / {totalCount} rules
              </div>
            </div>

            {rules.length === 0 ? (
              <div className={`rounded-[24px] p-8 text-center ${ui.empty}`}>
                No rules yet. Add rules using the + button above.
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => {
                  const importanceBadge = getImportanceBadge(rule.importance, theme)

                  return (
                    <div
                      key={rule.id}
                      className={`group flex items-center gap-2.5 rounded-[20px] border p-3 transition md:gap-3 md:p-3.5 ${
                        rule.checked
                          ? ui.ruleChecked
                          : ui.ruleUnchecked
                      }`}
                    >
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className="flex flex-1 items-center gap-3 text-left md:gap-4"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold md:h-11 md:w-11 ${
                            rule.checked
                              ? 'border border-emerald-400 bg-emerald-400 text-slate-950'
                              : ui.checkboxUnchecked
                          }`}
                        >
                          {rule.checked ? '✓' : ''}
                        </div>

                        <div className="flex-1">
                          <div
                            className={`text-sm leading-5 md:text-base ${
                              rule.checked ? ui.ruleTextChecked : ui.ruleTextUnchecked
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
                          className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition md:h-10 md:w-10 ${ui.deleteRule}`}
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
