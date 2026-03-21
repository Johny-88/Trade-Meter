'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'

type Weight = 5 | 10 | 20
type Importance = 'mandatory' | 'important' | 'bonus'
type RuleCategory = 'structure' | 'risk' | 'confirmation' | 'psychology' | 'execution'
type AppTheme = 'dark' | 'light'
type AppMode = 'standard' | 'pro'
type Tone = 'emerald' | 'lime' | 'amber' | 'orange' | 'red'
type EmotionState = 'calm' | 'focused' | 'slightly-emotional' | 'fomo' | 'revenge' | 'tired'
type SessionType = 'London' | 'New York' | 'Asia' | 'After-hours'
type SetupType = 'Breakout' | 'Reversal' | 'Support Bounce' | 'Trendline Break' | 'Pullback'
type JournalOutcome = 'unknown' | 'win' | 'loss' | 'no-trade' | 'saved-me'
type FollowedVerdict = 'yes' | 'no' | 'partially'

type Rule = {
  id: string
  text: string
  checked: boolean
  weight: Weight
  required: boolean
  importance: Importance
  category: RuleCategory
}

type StarterRule = {
  text: string
  importance: Importance
  category: RuleCategory
}

type RulePack = {
  id: string
  name: string
  minScore: number
  rules: StarterRule[]
  defaultCheckedIndexes?: number[]
  session?: SessionType
  instrument?: string
  setupType?: SetupType
}

type SavedTemplate = {
  id: string
  name: string
  minScore: number
  rules: Rule[]
  session: SessionType
  instrument: string
  setupType: SetupType
  emotion: EmotionState
}

type JournalEntry = {
  id: string
  createdAt: string
  score: number
  threshold: number
  verdict: string
  quality: string
  outcome: JournalOutcome
  followedVerdict: FollowedVerdict
  note: string
  screenshotDataUrl: string
  session: SessionType
  instrument: string
  setupType: SetupType
  emotion: EmotionState
  missingRuleTexts: string[]
  missingCategories: RuleCategory[]
  respectedVerdict: boolean
}

type SetupSnapshot = {
  score: number
  threshold: number
  verdict: string
  quality: string
  missingMandatoryCount: number
  checkedCount: number
}

const STORAGE_KEY = 'trade-meter-pro-v2'
const THEME_STORAGE_KEY = 'trade-meter-theme-v1'
const MODE_STORAGE_KEY = 'edge-check-mode-v1'
const PRO_STORAGE_KEY = 'edge-check-pro-context-v1'
const TEMPLATE_STORAGE_KEY = 'edge-check-templates-v1'
const JOURNAL_STORAGE_KEY = 'edge-check-journal-v1'

const starterRules: StarterRule[] = [
  {
    text: 'No emotional impulse is present',
    importance: 'mandatory',
    category: 'psychology',
  },
  {
    text: 'Stop loss is defined before entry',
    importance: 'mandatory',
    category: 'risk',
  },
  {
    text: 'Risk is acceptable',
    importance: 'important',
    category: 'risk',
  },
  {
    text: 'Reward is at least 2R',
    importance: 'important',
    category: 'risk',
  },
  {
    text: 'Candlestick setup present',
    importance: 'bonus',
    category: 'confirmation',
  },
  {
    text: 'Retested a previous level',
    importance: 'bonus',
    category: 'structure',
  },
]

const defaultCheckedStarterRuleIndexes = new Set([0, 1, 3])

const defaultRulePacks: RulePack[] = [
  {
    id: 'breakout',
    name: 'Breakout Pack',
    minScore: 60,
    session: 'London',
    instrument: 'ES',
    setupType: 'Breakout',
    defaultCheckedIndexes: [0, 1],
    rules: [
      { text: 'No emotional impulse is present', importance: 'mandatory', category: 'psychology' },
      { text: 'Stop loss is defined before entry', importance: 'mandatory', category: 'risk' },
      { text: 'Range or level is clearly defined', importance: 'important', category: 'structure' },
      { text: 'Breakout candle closes beyond level', importance: 'important', category: 'confirmation' },
      { text: 'Reward is at least 2R', importance: 'important', category: 'risk' },
      { text: 'Retest holds after breakout', importance: 'bonus', category: 'confirmation' },
    ],
  },
  {
    id: 'reversal',
    name: 'Reversal Pack',
    minScore: 65,
    session: 'New York',
    instrument: 'Gold',
    setupType: 'Reversal',
    defaultCheckedIndexes: [0, 1],
    rules: [
      { text: 'No emotional impulse is present', importance: 'mandatory', category: 'psychology' },
      { text: 'Stop loss is defined before entry', importance: 'mandatory', category: 'risk' },
      { text: 'Price is at a key reaction zone', importance: 'important', category: 'structure' },
      { text: 'Reversal confirmation is visible', importance: 'important', category: 'confirmation' },
      { text: 'Risk is acceptable', importance: 'important', category: 'risk' },
      { text: 'Higher timeframe supports reversal', importance: 'bonus', category: 'structure' },
    ],
  },
  {
    id: 'trendline',
    name: 'Trendline Pack',
    minScore: 60,
    session: 'London',
    instrument: 'NQ',
    setupType: 'Trendline Break',
    defaultCheckedIndexes: [0, 1, 2],
    rules: [
      { text: 'No emotional impulse is present', importance: 'mandatory', category: 'psychology' },
      { text: 'Stop loss is defined before entry', importance: 'mandatory', category: 'risk' },
      { text: 'Trendline is clean and respected', importance: 'important', category: 'structure' },
      { text: 'Break or bounce matches the plan', importance: 'important', category: 'execution' },
      { text: 'Reward is at least 2R', importance: 'important', category: 'risk' },
      { text: 'Candlestick setup present', importance: 'bonus', category: 'confirmation' },
    ],
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

const categoryOptions: { value: RuleCategory; label: string }[] = [
  { value: 'structure', label: 'Structure' },
  { value: 'risk', label: 'Risk' },
  { value: 'confirmation', label: 'Confirmation' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'execution', label: 'Execution' },
]

const sessionOptions: SessionType[] = ['London', 'New York', 'Asia', 'After-hours']
const setupTypeOptions: SetupType[] = ['Breakout', 'Reversal', 'Support Bounce', 'Trendline Break', 'Pullback']
const emotionOptions: { value: EmotionState; label: string; tone: Tone }[] = [
  { value: 'calm', label: 'Calm', tone: 'emerald' },
  { value: 'focused', label: 'Focused', tone: 'lime' },
  { value: 'slightly-emotional', label: 'Slightly emotional', tone: 'amber' },
  { value: 'fomo', label: 'FOMO', tone: 'orange' },
  { value: 'revenge', label: 'Revenge mindset', tone: 'red' },
  { value: 'tired', label: 'Tired', tone: 'orange' },
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


function getCategoryBadge(category: RuleCategory, theme: AppTheme) {
  const categoryMap: Record<RuleCategory, { label: string; light: string; dark: string }> = {
    structure: {
      label: 'Structure',
      light: 'border-indigo-300 bg-indigo-50 text-indigo-700',
      dark: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-200',
    },
    risk: {
      label: 'Risk',
      light: 'border-rose-300 bg-rose-50 text-rose-700',
      dark: 'border-rose-500/20 bg-rose-500/10 text-rose-200',
    },
    confirmation: {
      label: 'Confirmation',
      light: 'border-sky-300 bg-sky-50 text-sky-700',
      dark: 'border-sky-500/20 bg-sky-500/10 text-sky-200',
    },
    psychology: {
      label: 'Psychology',
      light: 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700',
      dark: 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-200',
    },
    execution: {
      label: 'Execution',
      light: 'border-teal-300 bg-teal-50 text-teal-700',
      dark: 'border-teal-500/20 bg-teal-500/10 text-teal-200',
    },
  }

  const current = categoryMap[category]
  return {
    label: current.label,
    className: theme === 'light' ? current.light : current.dark,
  }
}

function createRulesFromPack(pack: RulePack) {
  const checkedIndexes = new Set(pack.defaultCheckedIndexes ?? [])
  return pack.rules.map((rule, index) => ({
    ...createRule(rule),
    checked: checkedIndexes.has(index),
  }))
}

function formatDate(dateIso: string) {
  return new Date(dateIso).toLocaleString([], {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getRuleDefaults(text: string) {
  const starterRule = starterRules.find((rule) => rule.text === text)

  if (starterRule) {
    return {
      ...getImportanceConfig(starterRule.importance),
      category: starterRule.category,
    }
  }

  return {
    ...getImportanceConfig('important'),
    category: 'confirmation' as RuleCategory,
  }
}

function createRule(input: string | StarterRule, importance?: Importance, category?: RuleCategory): Rule {
  const text = typeof input === 'string' ? input : input.text
  const defaults =
    typeof input === 'string'
      ? importance
        ? {
            ...getImportanceConfig(importance),
            category: category ?? 'confirmation',
          }
        : getRuleDefaults(input)
      : {
          ...getImportanceConfig(input.importance),
          category: input.category,
        }

  return {
    id: makeId(),
    text,
    checked: false,
    weight: defaults.weight,
    required: defaults.required,
    importance: defaults.importance,
    category: defaults.category,
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
    category:
      rule.category === 'structure' ||
      rule.category === 'risk' ||
      rule.category === 'confirmation' ||
      rule.category === 'psychology' ||
      rule.category === 'execution'
        ? rule.category
        : defaults.category,
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


function getMainBlockerText(
  rules: Rule[],
  hasMissingRequired: boolean,
  missingRequiredRules: Rule[],
  meetsMinScore: boolean,
  minScore: number,
  score: number
) {
  if (hasMissingRequired) {
    return missingRequiredRules.length === 1
      ? `Main blocker: ${missingRequiredRules[0].text}`
      : `Main blocker: ${missingRequiredRules.length} Mandatory rules are still missing`
  }

  if (!meetsMinScore) {
    return `Main blocker: below your threshold by ${Math.max(minScore - score, 0)}%`
  }

  const uncheckedImportant = rules.filter((rule) => !rule.checked && rule.importance === 'important')
  if (uncheckedImportant.length > 0) {
    return `Main weakness: ${uncheckedImportant[0].text}`
  }

  const uncheckedBonus = rules.filter((rule) => !rule.checked && rule.importance === 'bonus')
  if (uncheckedBonus.length > 0) {
    return `Main weakness: ${uncheckedBonus[0].text}`
  }

  return 'All current checklist conditions are confirmed.'
}

function getEmotionWarning(emotion: EmotionState) {
  if (emotion === 'fomo') return 'Emotional risk is elevated. Slow down and read every rule twice.'
  if (emotion === 'revenge') return 'Revenge mindset detected. Do not let urgency override the checklist.'
  if (emotion === 'tired') return 'Fatigue lowers discipline. Keep size small or stand aside.'
  if (emotion === 'slightly-emotional') return 'Emotion is creeping in. Respect the verdict more strictly than usual.'
  if (emotion === 'focused') return 'Mindset looks focused. Keep execution clean.'
  return 'Mindset looks calm. Keep following the checklist exactly as written.'
}

function getChangedMessage(previous: SetupSnapshot | null, current: SetupSnapshot) {
  if (!previous) return 'No prior checkpoint yet. This is your current review state.'
  if (previous.verdict !== current.verdict) {
    return `Verdict changed from ${previous.verdict} to ${current.verdict}.`
  }
  if (previous.quality !== current.quality) {
    return `Setup quality changed from ${previous.quality} to ${current.quality}.`
  }
  if (previous.score !== current.score) {
    const direction = current.score > previous.score ? 'improved' : 'dropped'
    return `Score ${direction} from ${previous.score}% to ${current.score}%.`
  }
  if (previous.missingMandatoryCount !== current.missingMandatoryCount) {
    return current.missingMandatoryCount > previous.missingMandatoryCount
      ? 'A Mandatory condition was lost.'
      : 'A Mandatory condition was confirmed.'
  }
  if (previous.checkedCount !== current.checkedCount) {
    return current.checkedCount > previous.checkedCount
      ? 'More rules are confirmed than before.'
      : 'Fewer rules are confirmed than before.'
  }
  return 'No major change since the last checkpoint.'
}

export default function Home() {
  const title = 'Edge Check'
  const [theme, setTheme] = useState<AppTheme>('light')
  const [mode, setMode] = useState<AppMode>('standard')
  const [newRule, setNewRule] = useState('')
  const [newRuleImportance, setNewRuleImportance] = useState<Importance>('important')
  const [newRuleCategory, setNewRuleCategory] = useState<RuleCategory>('confirmation')
  const [newRuleError, setNewRuleError] = useState('')
  const [showInstructions, setShowInstructions] = useState(false)
  const [showFocusMode, setShowFocusMode] = useState(false)
  const [proView, setProView] = useState<'prep' | 'tools' | 'review'>('prep')
  const [minScore, setMinScore] = useState(50)
  const [proSession, setProSession] = useState<SessionType>('London')
  const [proInstrument, setProInstrument] = useState('ES')
  const [proSetupType, setProSetupType] = useState<SetupType>('Breakout')
  const [proEmotion, setProEmotion] = useState<EmotionState>('calm')
  const [proTimerSeconds, setProTimerSeconds] = useState(15)
  const [proTimerActive, setProTimerActive] = useState(false)
  const [proTimerLeft, setProTimerLeft] = useState(15)
  const [templateName, setTemplateName] = useState('')
  const [templates, setTemplates] = useState<SavedTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedRulePackId, setSelectedRulePackId] = useState(defaultRulePacks[0].id)
  const [tradeNote, setTradeNote] = useState('')
  const [tradeOutcome, setTradeOutcome] = useState<JournalOutcome>('unknown')
  const [followedVerdict, setFollowedVerdict] = useState<FollowedVerdict>('yes')
  const [screenshotDataUrl, setScreenshotDataUrl] = useState('')
  const [journal, setJournal] = useState<JournalEntry[]>([])
  const [copiedSummary, setCopiedSummary] = useState(false)
  const [riskAmount, setRiskAmount] = useState(100)
  const [stopDistance, setStopDistance] = useState(10)
  const [pointValue, setPointValue] = useState(1)
  const [rules, setRules] = useState<Rule[]>(
    starterRules.map((rule, index) => ({
      ...createRule(rule),
      checked: defaultCheckedStarterRuleIndexes.has(index),
    }))
  )
  const [topOffset, setTopOffset] = useState(0)
  const liveScoreRef = useRef<HTMLDivElement | null>(null)
  const previousSnapshotRef = useRef<SetupSnapshot | null>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY)
    const savedTemplates = localStorage.getItem(TEMPLATE_STORAGE_KEY)
    const savedJournal = localStorage.getItem(JOURNAL_STORAGE_KEY)
    const savedPro = localStorage.getItem(PRO_STORAGE_KEY)

    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme)
    }

    if (savedMode === 'standard' || savedMode === 'pro') {
      setMode(savedMode)
    }

    if (savedTemplates) {
      try {
        const parsedTemplates = JSON.parse(savedTemplates)
        if (Array.isArray(parsedTemplates)) {
          setTemplates(parsedTemplates)
        }
      } catch {}
    }

    if (savedJournal) {
      try {
        const parsedJournal = JSON.parse(savedJournal)
        if (Array.isArray(parsedJournal)) {
          setJournal(parsedJournal)
        }
      } catch {}
    }

    if (savedPro) {
      try {
        const parsedPro = JSON.parse(savedPro)
        if (parsedPro.session && sessionOptions.includes(parsedPro.session)) setProSession(parsedPro.session)
        if (typeof parsedPro.instrument === 'string') setProInstrument(parsedPro.instrument)
        if (parsedPro.setupType && setupTypeOptions.includes(parsedPro.setupType)) setProSetupType(parsedPro.setupType)
        if (emotionOptions.some((option) => option.value === parsedPro.emotion)) setProEmotion(parsedPro.emotion)
        if (parsedPro.view === 'prep' || parsedPro.view === 'tools' || parsedPro.view === 'review') setProView(parsedPro.view)
        if (typeof parsedPro.timerSeconds === 'number') {
          setProTimerSeconds(parsedPro.timerSeconds)
          setProTimerLeft(parsedPro.timerSeconds)
        }
      } catch {}
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

  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, mode)
  }, [mode])

  useEffect(() => {
    localStorage.setItem(
      PRO_STORAGE_KEY,
      JSON.stringify({
        session: proSession,
        instrument: proInstrument,
        setupType: proSetupType,
        emotion: proEmotion,
        view: proView,
        timerSeconds: proTimerSeconds,
      })
    )
  }, [proSession, proInstrument, proSetupType, proEmotion, proView, proTimerSeconds])

  useEffect(() => {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates))
  }, [templates])

  useEffect(() => {
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journal))
  }, [journal])

  useEffect(() => {
    if (!showInstructions && !showFocusMode) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showInstructions, showFocusMode])

  useEffect(() => {
    if (!proTimerActive) return

    if (proTimerLeft <= 0) {
      setProTimerActive(false)
      return
    }

    const timer = window.setTimeout(() => {
      setProTimerLeft((prev) => prev - 1)
    }, 1000)

    return () => {
      window.clearTimeout(timer)
    }
  }, [proTimerActive, proTimerLeft])

  useEffect(() => {
    if (!copiedSummary) return
    const timer = window.setTimeout(() => setCopiedSummary(false), 1800)
    return () => window.clearTimeout(timer)
  }, [copiedSummary])

  useEffect(() => {
    if (proTimerActive) return
    setProTimerLeft(proTimerSeconds)
  }, [proTimerSeconds, proTimerActive])

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

  const uncheckedImportantRules = rules.filter((rule) => !rule.checked && rule.importance === 'important')
  const uncheckedBonusRules = rules.filter((rule) => !rule.checked && rule.importance === 'bonus')
  const mainBlockerText = getMainBlockerText(rules, hasMissingRequired, missingRequiredRules, meetsMinScore, minScore, score)
  const emotionWarning = getEmotionWarning(proEmotion)
  const currentSnapshot: SetupSnapshot = {
    score,
    threshold: minScore,
    verdict: rating.decisionLabel,
    quality: scoreBand.label,
    missingMandatoryCount: missingRequiredRules.length,
    checkedCount,
  }
  const changedMessage = getChangedMessage(previousSnapshotRef.current, currentSnapshot)
  const categoryMissCounts = rules
    .filter((rule) => !rule.checked)
    .reduce<Record<RuleCategory, number>>(
      (acc, rule) => {
        acc[rule.category] += 1
        return acc
      },
      {
        structure: 0,
        risk: 0,
        confirmation: 0,
        psychology: 0,
        execution: 0,
      }
    )
  const mostMissedCurrentCategory = Object.entries(categoryMissCounts).sort((a, b) => b[1] - a[1])[0]
  const averageJournalScore =
    journal.length > 0 ? Math.round(journal.reduce((sum, entry) => sum + entry.score, 0) / journal.length) : 0
  const blockedJournalCount = journal.filter((entry) => entry.verdict.includes('BLOCKED')).length
  const qualifiedJournalCount = journal.filter(
    (entry) => entry.verdict === 'TRADE' || entry.verdict === 'TRADE CAREFULLY' || entry.verdict === 'WAIT FOR MORE CONFIRMATION'
  ).length
  const savedMeCount = journal.filter((entry) => entry.outcome === 'saved-me').length
  const respectedVerdictCount = journal.filter((entry) => entry.respectedVerdict).length
  const currentRespectStreak = (() => {
    let streak = 0
    for (const entry of journal) {
      if (!entry.respectedVerdict) break
      streak += 1
    }
    return streak
  })()
  const mostMissedRuleMap = journal.flatMap((entry) => entry.missingRuleTexts).reduce<Record<string, number>>((acc, ruleText) => {
    acc[ruleText] = (acc[ruleText] ?? 0) + 1
    return acc
  }, {})
  const mostMissedRule = Object.entries(mostMissedRuleMap).sort((a, b) => b[1] - a[1])[0]
  const mostMissedCategoryMap = journal.flatMap((entry) => entry.missingCategories).reduce<Record<string, number>>((acc, category) => {
    acc[category] = (acc[category] ?? 0) + 1
    return acc
  }, {})
  const mostMissedJournalCategory = Object.entries(mostMissedCategoryMap).sort((a, b) => b[1] - a[1])[0]
  const scoreCarryMessage =
    checkedPoints === 0
      ? 'No rules are confirmed yet.'
      : checkedPoints >= totalPoints * 0.7
      ? 'Most of your score is being carried by core rules.'
      : rules.filter((rule) => rule.checked && rule.importance === 'bonus').length >= 2
      ? 'A lot of the score is coming from Bonus confirmations.'
      : 'Your score is mixed between core and secondary rules.'
  const proSummaryText = `${title} • ${proInstrument} • ${proSession} • ${proSetupType} • ${score}% • ${rating.decisionLabel} • ${checkedCount}/${totalCount} rules`
  const positionSize = stopDistance > 0 && pointValue > 0 ? Math.max(Math.floor(riskAmount / (stopDistance * pointValue)), 0) : 0
  const activeEmotionLabel = emotionOptions.find((option) => option.value === proEmotion)?.label ?? 'Calm'
  const proViewMeta =
    proView === 'prep'
      ? {
          title: 'Prep first',
          desc: 'Set the trade context, choose a pack or template, and pause before entry. Then score the checklist below.',
        }
      : proView === 'tools'
      ? {
          title: 'Use tools only when needed',
          desc: 'These are support tools. Use them to understand what changed, where the weakness is, and what size still makes sense.',
        }
      : {
          title: 'Review after the decision',
          desc: 'Log what happened, whether you respected the verdict, and track if the app is actually improving your discipline.',
        }

  useEffect(() => {
    previousSnapshotRef.current = currentSnapshot
  }, [
    currentSnapshot.score,
    currentSnapshot.threshold,
    currentSnapshot.verdict,
    currentSnapshot.quality,
    currentSnapshot.missingMandatoryCount,
    currentSnapshot.checkedCount,
  ])

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
    setRules(createRulesFromPack({ id: 'starter', name: 'Starter', minScore, rules: starterRules, defaultCheckedIndexes: [] }))
    setNewRuleError('')
  }

  const clearAllRules = () => {
    setRules([])
    setNewRule('')
    setNewRuleImportance('important')
    setNewRuleCategory('confirmation')
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

    const rule = createRule(trimmed, newRuleImportance, newRuleCategory)
    setRules((prev) => [...prev, rule])
    setNewRule('')
    setNewRuleImportance('important')
    setNewRuleCategory('confirmation')
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

  const startPreTradeTimer = () => {
    setProTimerLeft(proTimerSeconds)
    setProTimerActive(true)
  }

  const stopPreTradeTimer = () => {
    setProTimerActive(false)
    setProTimerLeft(proTimerSeconds)
  }

  const applyRulePack = (packId: string) => {
    const pack = defaultRulePacks.find((item) => item.id === packId)
    if (!pack) return

    setSelectedRulePackId(packId)
    setRules(createRulesFromPack(pack))
    setMinScore(pack.minScore)
    if (pack.session) setProSession(pack.session)
    if (pack.instrument) setProInstrument(pack.instrument)
    if (pack.setupType) setProSetupType(pack.setupType)
    setNewRuleError('')
  }

  const saveCurrentTemplate = () => {
    const trimmedName = templateName.trim()
    if (!trimmedName) {
      setNewRuleError('Give the template a clear name before saving it.')
      return
    }

    const newTemplate: SavedTemplate = {
      id: makeId(),
      name: trimmedName,
      minScore,
      rules: rules.map((rule) => ({ ...rule })),
      session: proSession,
      instrument: proInstrument,
      setupType: proSetupType,
      emotion: proEmotion,
    }

    setTemplates((prev) => [newTemplate, ...prev])
    setTemplateName('')
    setNewRuleError('')
  }

  const loadTemplate = (templateId: string) => {
    const template = templates.find((item) => item.id === templateId)
    if (!template) return

    setSelectedTemplateId(templateId)
    setRules(template.rules.map((rule) => normalizeRule(rule)))
    setMinScore(template.minScore)
    setProSession(template.session)
    setProInstrument(template.instrument)
    setProSetupType(template.setupType)
    setProEmotion(template.emotion)
    setNewRuleError('')
  }

  const deleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((item) => item.id !== templateId))
    if (selectedTemplateId === templateId) {
      setSelectedTemplateId('')
    }
  }

  const handleScreenshotUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setScreenshotDataUrl(reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const saveJournalEntry = () => {
    const entry: JournalEntry = {
      id: makeId(),
      createdAt: new Date().toISOString(),
      score,
      threshold: minScore,
      verdict: rating.decisionLabel,
      quality: scoreBand.label,
      outcome: tradeOutcome,
      followedVerdict,
      note: tradeNote.trim(),
      screenshotDataUrl,
      session: proSession,
      instrument: proInstrument,
      setupType: proSetupType,
      emotion: proEmotion,
      missingRuleTexts: rules.filter((rule) => !rule.checked).map((rule) => rule.text),
      missingCategories: rules.filter((rule) => !rule.checked).map((rule) => rule.category),
      respectedVerdict: followedVerdict === 'yes',
    }

    setJournal((prev) => [entry, ...prev])
    setTradeNote('')
    setTradeOutcome('unknown')
    setFollowedVerdict('yes')
    setScreenshotDataUrl('')
  }

  const shareSummary = async () => {
    const shareText = `${proSummaryText}
${mainBlockerText}
${emotionWarning}`
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Edge Check Summary',
          text: shareText,
        })
        return
      } catch {}
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareText)
      setCopiedSummary(true)
    }
  }

  const closeInstructions = () => setShowInstructions(false)

  return (
    <main className={`min-h-screen overflow-x-hidden ${ui.main}`}>
      {showInstructions && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-950/55 px-4 py-4 backdrop-blur-sm sm:items-center">
          <div
            className={`relative w-full max-w-xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[28px] border p-5 shadow-2xl md:p-6 ${
              theme === 'light'
                ? 'border-slate-200 bg-white text-slate-900'
                : 'border-white/10 bg-slate-950 text-white'
            }`}
          >
            <button
              type="button"
              onClick={closeInstructions}
              className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold transition ${
                theme === 'light'
                  ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
              aria-label="Close instructions"
            >
              ×
            </button>

            <h2 className="text-center text-xl font-bold md:text-2xl">How to use Edge Check</h2>
            <p className={`mt-2 text-center text-sm leading-6 md:text-base ${ui.subtle}`}>
              Use this app before entering a trade. It is designed to keep you honest, slow you down, and stop low-quality setups.
            </p>

            <div className="mt-5 space-y-3">
              {[
                ['1. Set your minimum threshold', 'Choose the minimum score a setup must reach before it can qualify. Higher threshold = more selective trading.'],
                ['2. Tick only what is truly present', 'Check rules only if they are clearly confirmed on the chart. Do not tick what you hope will happen next.'],
                ['3. Respect rule importance', 'Mandatory rules can block the trade completely. Important and Bonus rules improve the score, but do not replace missing Mandatory confirmation.'],
                ['4. Read the verdict, not your emotions', 'A strong score does not matter if a Mandatory rule is missing. Follow the verdict exactly as shown.'],
                ['5. Stay honest with custom rules', 'Add only rules that truly matter to your setup. Avoid duplicates so the score stays fair and accurate.'],
              ].map((item) => (
                <div
                  key={item[0]}
                  className={`rounded-2xl border px-4 py-3 ${
                    theme === 'light'
                      ? 'border-slate-200 bg-slate-50'
                      : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="text-center text-sm font-semibold md:text-base">{item[0]}</div>
                  <p className={`mt-1 text-center text-sm leading-6 ${ui.subtle}`}>{item[1]}</p>
                </div>
              ))}
            </div>

            <div
              className={`mt-5 rounded-2xl border px-4 py-3 text-center text-sm leading-6 ${
                theme === 'light'
                  ? 'border-amber-300 bg-amber-50 text-amber-800'
                  : 'border-amber-500/20 bg-amber-500/10 text-amber-200'
              }`}
            >
              Goal: follow the checklist exactly as written. This app is not here to predict the market. It is here to protect you from undisciplined trades.
            </div>
          </div>
        </div>
      )}

      {showFocusMode && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/65 px-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-[28px] border p-5 shadow-2xl md:p-6 ${ui.card}`}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className={`text-xs uppercase tracking-[0.22em] ${ui.muted}`}>Before you enter</div>
                <div className="text-xl font-bold md:text-2xl">{rating.decisionLabel}</div>
              </div>

              <button
                type="button"
                onClick={() => setShowFocusMode(false)}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${ui.deleteRule}`}
                aria-label="Close focus mode"
              >
                ×
              </button>
            </div>

            <div className={`rounded-[22px] border p-4 ${ui.innerCard}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className={`text-[11px] uppercase tracking-[0.18em] ${ui.muted}`}>{proInstrument} • {proSession}</div>
                  <div className="mt-1 text-3xl font-black">{score}%</div>
                </div>
                <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${scoreBandStyles.badge}`}>
                  {scoreBand.label}
                </div>
              </div>

              <div className={`mt-3 h-3 overflow-hidden rounded-full ${ui.barTrack}`}>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${styles.fill}`}
                  style={{ width: `${score}%` }}
                />
              </div>

              <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${decisionStyles.badge}`}>
                {mainBlockerText}
              </div>

              <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${qualificationStyles.badge}`}>
                {emotionWarning}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className={`rounded-2xl border px-4 py-3 ${ui.statBox}`}>
                  <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>Rules confirmed</div>
                  <div className="mt-1 text-lg font-bold">{checkedCount}/{totalCount}</div>
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${ui.statBox}`}>
                  <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>Pause timer</div>
                  <div className="mt-1 text-lg font-bold">{proTimerActive ? `${proTimerLeft}s` : `${proTimerSeconds}s ready`}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
         <div className="flex items-center gap-0.4">
  <div className="relative h-5 w-6 shrink-0">
    {/* Candle 1 */}
    <span
      className={`absolute left-[1px] top-[1px] h-4 w-px ${
        theme === 'light' ? 'bg-slate-500' : 'bg-slate-400'
      }`}
    />
    <span
      className={`absolute left-0 top-[5px] h-2 w-[3px] ${
        theme === 'light' ? 'bg-emerald-500' : 'bg-emerald-400'
      }`}
    />

    {/* Candle 2 */}
    <span
      className={`absolute left-[7px] top-0 h-5 w-px ${
        theme === 'light' ? 'bg-slate-500' : 'bg-slate-400'
      }`}
    />
    <span
      className={`absolute left-[6px] top-[3px] h-3 w-[3px] ${
        theme === 'light' ? 'bg-rose-500' : 'bg-rose-400'
      }`}
    />

    {/* Candle 3 */}
    <span
      className={`absolute left-[13px] top-[1px] h-4 w-px ${
        theme === 'light' ? 'bg-slate-500' : 'bg-slate-400'
      }`}
    />
    <span
      className={`absolute left-[12px] top-[6px] h-2 w-[3px] ${
        theme === 'light' ? 'bg-emerald-500' : 'bg-emerald-400'
      }`}
    />
  </div>

  <div
    className={`text-lg font-bold tracking-tight md:text-xl ${
      theme === 'light' ? 'text-slate-900' : 'text-white'
    }`}
  >
    Edge Check
  </div>
</div>

          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-1 rounded-full p-1 ${ui.toggleShell}`}>
              <button
                type="button"
                onClick={() => setMode('standard')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${mode === 'standard' ? ui.toggleActive : ui.toggleInactive}`}
                aria-pressed={mode === 'standard'}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setMode('pro')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${mode === 'pro' ? ui.toggleActive : ui.toggleInactive}`}
                aria-pressed={mode === 'pro'}
              >
                Pro
              </button>
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
        </div>

        <div className={`relative z-10 mx-auto max-w-7xl overflow-hidden rounded-[22px] ${ui.liveOuter}`}>
          <div className={`bg-gradient-to-r ${styles.soft} p-2.5 md:p-3`}>
            <div className="grid gap-2 md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)] md:items-center">
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

                <div className={`mt-1.5 text-[10px] font-semibold md:text-[11px] ${ui.subtle}`}>
                  {checkedCount}/{totalCount} rules
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
              <div className="mb-2 flex items-center justify-center">
                <h1 className="text-center text-xl font-bold md:text-2xl">
                  Edge Check - Best Trading Discipline App
                </h1>
              </div>

              <p className={`mt-3 max-w-2xl text-sm leading-6 md:text-base ${ui.subtle}`}>
                Build your own pre-trade checklist, score every setup in seconds,
                and stop entering trades that do not truly meet your standards.
              </p>

              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowInstructions(true)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition md:text-sm ${
                    theme === 'light'
                      ? 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100'
                      : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  Read Instructions
                </button>
              </div>
            </div>

      
          </div>
        </div>

        <div className="space-y-4">
          {mode === 'pro' && (
            <>
              <div className={`rounded-[24px] p-3 md:p-4 ${ui.card}`}>
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <div className={`text-sm font-semibold ${ui.secondaryStrong}`}>Pro mode</div>
                    <p className={`mt-1 text-sm ${ui.muted}`}>
                      Extra context and review tools for traders who want more structure, without changing the main verdict logic.
                    </p>
                  </div>

                  <div className={`inline-flex items-center gap-1 rounded-full p-1 ${ui.toggleShell}`}>
                    <button
                      type="button"
                      onClick={() => setProView('prep')}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${proView === 'prep' ? ui.toggleActive : ui.toggleInactive}`}
                    >
                      Prep
                    </button>
                    <button
                      type="button"
                      onClick={() => setProView('tools')}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${proView === 'tools' ? ui.toggleActive : ui.toggleInactive}`}
                    >
                      Tools
                    </button>
                    <button
                      type="button"
                      onClick={() => setProView('review')}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${proView === 'review' ? ui.toggleActive : ui.toggleInactive}`}
                    >
                      Review
                    </button>
                  </div>
                </div>
              </div>

              {proView === 'prep' && (
                <div className={`rounded-[24px] p-3 md:p-4 ${ui.card}`}>
                  <div className="grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
                    <div className={`rounded-[22px] p-3 ${ui.innerCard}`}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <div className={`text-sm font-semibold ${ui.secondaryStrong}`}>Trade context</div>
                          <p className={`mt-1 text-xs ${ui.muted}`}>Set the trade context first, then let the checklist judge it.</p>
                        </div>
                        <div className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${qualificationStyles.badge}`}>
                          {proSetupType}
                        </div>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        <select
                          value={proInstrument}
                          onChange={(e) => setProInstrument(e.target.value)}
                          className={`h-10 rounded-2xl px-3 text-sm outline-none transition ${ui.select}`}
                        >
                          {['ES', 'NQ', 'Gold', 'Silver', 'Oil', 'BTC', 'EURUSD'].map((item) => (
                            <option key={item} value={item}>
                              Instrument: {item}
                            </option>
                          ))}
                        </select>

                        <select
                          value={proSession}
                          onChange={(e) => setProSession(e.target.value as SessionType)}
                          className={`h-10 rounded-2xl px-3 text-sm outline-none transition ${ui.select}`}
                        >
                          {sessionOptions.map((item) => (
                            <option key={item} value={item}>
                              Session: {item}
                            </option>
                          ))}
                        </select>

                        <select
                          value={proSetupType}
                          onChange={(e) => setProSetupType(e.target.value as SetupType)}
                          className={`h-10 rounded-2xl px-3 text-sm outline-none transition ${ui.select}`}
                        >
                          {setupTypeOptions.map((item) => (
                            <option key={item} value={item}>
                              Setup: {item}
                            </option>
                          ))}
                        </select>

                        <select
                          value={proEmotion}
                          onChange={(e) => setProEmotion(e.target.value as EmotionState)}
                          className={`h-10 rounded-2xl px-3 text-sm outline-none transition ${ui.select}`}
                        >
                          {emotionOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              Emotion: {item.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={`mt-3 rounded-[20px] border p-3 ${ui.statBox}`}>
                        <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>Current context</div>
                        <div className="mt-1 text-sm font-semibold">
                          {proInstrument} • {proSession} • {proSetupType} • {activeEmotionLabel}
                        </div>
                        <p className={`mt-1 text-xs ${ui.muted}`}>{emotionWarning}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className={`rounded-[22px] p-3 ${ui.innerCard}`}>
                        <div className={`mb-2 text-sm font-semibold ${ui.secondaryStrong}`}>Pause before entry</div>
                        <p className={`mb-3 text-xs ${ui.muted}`}>Use a short pause if you tend to enter too quickly.</p>

                        <div className="flex items-center gap-2">
                          <select
                            value={proTimerSeconds}
                            onChange={(e) => setProTimerSeconds(Number(e.target.value))}
                            className={`h-10 rounded-2xl px-3 text-sm outline-none transition ${ui.select}`}
                          >
                            {[10, 15, 20, 30, 45].map((item) => (
                              <option key={item} value={item}>
                                {item}s
                              </option>
                            ))}
                          </select>

                          {!proTimerActive ? (
                            <button
                              type="button"
                              onClick={startPreTradeTimer}
                              className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${styles.button}`}
                            >
                              Start
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={stopPreTradeTimer}
                              className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${ui.secondaryBtn}`}
                            >
                              Stop
                            </button>
                          )}
                        </div>

                        <div className={`mt-2 text-sm font-semibold ${ui.primaryStrong}`}>
                          {proTimerActive ? `${proTimerLeft}s remaining` : `${proTimerSeconds}s pause ready`}
                        </div>
                      </div>

                      <div className={`rounded-[22px] p-3 ${ui.innerCard}`}>
                        <div className={`mb-2 text-sm font-semibold ${ui.secondaryStrong}`}>Templates</div>
                        <p className={`mb-3 text-xs ${ui.muted}`}>Load a saved checklist fast or save the one you use most.</p>

                        <div className="grid gap-2">
                          <select
                            value={selectedRulePackId}
                            onChange={(e) => applyRulePack(e.target.value)}
                            className={`h-10 rounded-2xl px-3 text-sm outline-none transition ${ui.select}`}
                          >
                            {defaultRulePacks.map((pack) => (
                              <option key={pack.id} value={pack.id}>
                                Rule Pack: {pack.name}
                              </option>
                            ))}
                          </select>

                          <select
                            value={selectedTemplateId}
                            onChange={(e) => loadTemplate(e.target.value)}
                            className={`h-10 rounded-2xl px-3 text-sm outline-none transition ${ui.select}`}
                          >
                            <option value="">Saved template...</option>
                            {templates.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name}
                              </option>
                            ))}
                          </select>

                          <div className="flex gap-2">
                            <input
                              value={templateName}
                              onChange={(e) => setTemplateName(e.target.value)}
                              placeholder="Template name"
                              className={`w-full rounded-2xl px-3 py-2.5 text-sm outline-none transition ${ui.input}`}
                            />
                            <button
                              type="button"
                              onClick={saveCurrentTemplate}
                              className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${styles.button}`}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {proView === 'tools' && (
                <div className={`rounded-[24px] p-3 md:p-4 ${ui.card}`}>
                  <div className="grid gap-3 xl:grid-cols-[1fr_0.9fr]">
                    <div className={`rounded-[22px] p-3 ${ui.innerCard}`}>
                      <div className={`mb-2 text-sm font-semibold ${ui.secondaryStrong}`}>Decision support</div>
                      <p className={`mb-3 text-xs ${ui.muted}`}>Only the information that helps you decide whether this trade is ready or not.</p>

                      <div className={`rounded-2xl border px-4 py-3 text-sm ${ui.statBox}`}>
                        <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>Main blocker</div>
                        <div className="mt-1 font-semibold">{mainBlockerText}</div>
                      </div>

                      {hasMissingRequired && (
                        <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${ui.statBox}`}>
                          <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>Missing mandatory</div>
                          <div className="mt-1 font-semibold">
                            {missingRequiredRules.map((rule) => rule.text).join(', ')}
                          </div>
                        </div>
                      )}

                      {!hasMissingRequired && (
                        <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${ui.statBox}`}>
                          <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>What changed</div>
                          <div className="mt-1 font-semibold">{changedMessage}</div>
                        </div>
                      )}
                    </div>

                    <div className={`rounded-[22px] p-3 ${ui.innerCard}`}>
                      <div className={`mb-2 text-sm font-semibold ${ui.secondaryStrong}`}>Risk helper</div>
                      <p className={`mb-3 text-xs ${ui.muted}`}>Quick size check only. Use your broker specs if they differ.</p>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <input
                          type="number"
                          min={1}
                          value={riskAmount}
                          onChange={(e) => setRiskAmount(Number(e.target.value) || 0)}
                          className={`rounded-2xl px-3 py-2.5 text-sm outline-none transition ${ui.input}`}
                          placeholder="Risk $"
                        />
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={stopDistance}
                          onChange={(e) => setStopDistance(Number(e.target.value) || 0)}
                          className={`rounded-2xl px-3 py-2.5 text-sm outline-none transition ${ui.input}`}
                          placeholder="Stop distance"
                        />
                        <input
                          type="number"
                          min={0.01}
                          step="0.01"
                          value={pointValue}
                          onChange={(e) => setPointValue(Number(e.target.value) || 0)}
                          className={`rounded-2xl px-3 py-2.5 text-sm outline-none transition ${ui.input}`}
                          placeholder="Point value"
                        />
                      </div>

                      <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${ui.statBox}`}>
                        Position size estimate: <span className="font-bold">{positionSize}</span> units/contracts
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {proView === 'review' && (
                <div className={`rounded-[24px] p-3 md:p-4 ${ui.card}`}>
                  <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className={`rounded-[22px] p-3 ${ui.innerCard}`}>
                      <div className={`mb-2 text-sm font-semibold ${ui.secondaryStrong}`}>Save review</div>
                      <p className={`mb-3 text-xs ${ui.muted}`}>Log what actually happened so you can spot discipline problems faster.</p>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <select
                          value={tradeOutcome}
                          onChange={(e) => setTradeOutcome(e.target.value as JournalOutcome)}
                          className={`h-10 rounded-2xl px-3 text-sm outline-none transition ${ui.select}`}
                        >
                          <option value="unknown">Outcome: not logged yet</option>
                          <option value="win">Outcome: Win</option>
                          <option value="loss">Outcome: Loss</option>
                          <option value="no-trade">Outcome: No trade taken</option>
                          <option value="saved-me">Outcome: Checklist saved me</option>
                        </select>

                        <select
                          value={followedVerdict}
                          onChange={(e) => setFollowedVerdict(e.target.value as FollowedVerdict)}
                          className={`h-10 rounded-2xl px-3 text-sm outline-none transition ${ui.select}`}
                        >
                          <option value="yes">I followed the verdict</option>
                          <option value="partially">I partly followed it</option>
                          <option value="no">I ignored it</option>
                        </select>
                      </div>

                      <textarea
                        value={tradeNote}
                        onChange={(e) => setTradeNote(e.target.value)}
                        placeholder="One short note: why you took it, skipped it, or broke the rule."
                        className={`mt-2 min-h-[108px] w-full rounded-[22px] px-3 py-3 text-sm outline-none transition ${ui.input}`}
                      />

                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={saveJournalEntry}
                          className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${styles.button}`}
                        >
                          Save review
                        </button>
                      </div>

                      {journal.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {journal.slice(0, 2).map((entry) => (
                            <div key={entry.id} className={`rounded-[18px] border p-3 ${ui.statBox}`}>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="text-sm font-semibold">{entry.verdict}</div>
                                <div className={`text-xs ${ui.muted}`}>{formatDate(entry.createdAt)}</div>
                              </div>
                              <div className={`mt-1 text-xs ${ui.muted}`}>
                                {entry.instrument} • {entry.session} • {entry.setupType} • {entry.score}% • {entry.outcome}
                              </div>
                              {entry.note && <p className="mt-2 text-sm">{entry.note}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`rounded-[22px] p-3 ${ui.innerCard}`}>
                      <div className={`mb-2 text-sm font-semibold ${ui.secondaryStrong}`}>Useful stats only</div>
                      <p className={`mb-3 text-xs ${ui.muted}`}>Keep it simple: did the app save you, and where do you slip most often?</p>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Reviews', value: `${journal.length}` },
                          { label: 'Saved me', value: `${savedMeCount}` },
                          { label: 'Respected', value: `${respectedVerdictCount}/${journal.length || 0}` },
                        ].map((item) => (
                          <div key={item.label} className={`rounded-2xl border px-3 py-3 ${ui.statBox}`}>
                            <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>{item.label}</div>
                            <div className="mt-1 text-lg font-bold">{item.value}</div>
                          </div>
                        ))}
                      </div>

                      <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${ui.statBox}`}>
                        <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>Most missed rule</div>
                        <div className="mt-1 font-semibold">{mostMissedRule ? mostMissedRule[0] : 'Not enough saved reviews yet.'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

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

                {mode === 'pro' && (
                  <div className="mt-2">
                    <select
                      value={newRuleCategory}
                      onChange={(e) => setNewRuleCategory(e.target.value as RuleCategory)}
                      className={`h-10 w-full rounded-2xl px-3 text-sm outline-none transition ${ui.select}`}
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          Category: {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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

          {mode === 'pro' && (
            <div className={`rounded-[24px] p-3 md:p-4 ${ui.card}`}>
              <div className="grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
                <div className={`rounded-[22px] p-3 ${ui.innerCard}`}>
                  <div className={`mb-2 text-sm font-semibold ${ui.secondaryStrong}`}>Journal this review</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select
                      value={tradeOutcome}
                      onChange={(e) => setTradeOutcome(e.target.value as JournalOutcome)}
                      className={`h-10 rounded-2xl px-3 text-sm outline-none transition ${ui.select}`}
                    >
                      <option value="unknown">Outcome: not logged yet</option>
                      <option value="win">Outcome: Win</option>
                      <option value="loss">Outcome: Loss</option>
                      <option value="no-trade">Outcome: No trade taken</option>
                      <option value="saved-me">Outcome: Checklist saved me</option>
                    </select>

                    <select
                      value={followedVerdict}
                      onChange={(e) => setFollowedVerdict(e.target.value as FollowedVerdict)}
                      className={`h-10 rounded-2xl px-3 text-sm outline-none transition ${ui.select}`}
                    >
                      <option value="yes">I followed the verdict</option>
                      <option value="partially">I partly followed it</option>
                      <option value="no">I ignored it</option>
                    </select>
                  </div>

                  <textarea
                    value={tradeNote}
                    onChange={(e) => setTradeNote(e.target.value)}
                    placeholder="Add a short note about why you took or skipped this setup."
                    className={`mt-2 min-h-[108px] w-full rounded-[22px] px-3 py-3 text-sm outline-none transition ${ui.input}`}
                  />

                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className={`inline-flex cursor-pointer items-center rounded-2xl px-3 py-2 text-xs font-semibold transition ${ui.secondaryBtn}`}>
                      Upload screenshot
                      <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} />
                    </label>

                    <button
                      type="button"
                      onClick={saveJournalEntry}
                      className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${styles.button}`}
                    >
                      Save review
                    </button>
                  </div>

                  {screenshotDataUrl && (
                    <div className="mt-3 overflow-hidden rounded-[20px] border border-white/10">
                      <img src={screenshotDataUrl} alt="Uploaded chart" className="h-40 w-full object-cover" />
                    </div>
                  )}

                  {journal.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {journal.slice(0, 3).map((entry) => (
                        <div key={entry.id} className={`rounded-[18px] border p-3 ${ui.statBox}`}>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-sm font-semibold">{entry.verdict}</div>
                            <div className={`text-xs ${ui.muted}`}>{formatDate(entry.createdAt)}</div>
                          </div>
                          <div className={`mt-1 text-xs ${ui.muted}`}>
                            {entry.instrument} • {entry.session} • {entry.setupType} • {entry.score}% • {entry.outcome}
                          </div>
                          {entry.note && <p className="mt-2 text-sm">{entry.note}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`rounded-[22px] p-3 ${ui.innerCard}`}>
                  <div className={`mb-2 text-sm font-semibold ${ui.secondaryStrong}`}>Discipline dashboard</div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['Reviews', `${journal.length}`],
                      ['Avg score', `${averageJournalScore}%`],
                      ['Qualified', `${qualifiedJournalCount}`],
                      ['Blocked', `${blockedJournalCount}`],
                      ['Saved me', `${savedMeCount}`],
                      ['Streak', `${currentRespectStreak}`],
                    ].map((item) => (
                      <div key={item[0]} className={`rounded-2xl border px-3 py-3 ${ui.statBox}`}>
                        <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>{item[0]}</div>
                        <div className="mt-1 text-lg font-bold">{item[1]}</div>
                      </div>
                    ))}
                  </div>

                  <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${ui.statBox}`}>
                    <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>Most missed rule</div>
                    <div className="mt-1 font-semibold">{mostMissedRule ? mostMissedRule[0] : 'Not enough saved reviews yet.'}</div>
                  </div>

                  <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${ui.statBox}`}>
                    <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>Most missed category</div>
                    <div className="mt-1 font-semibold">
                      {mostMissedJournalCategory ? mostMissedJournalCategory[0] : 'Not enough saved reviews yet.'}
                    </div>
                  </div>

                  <div className={`mt-3 rounded-2xl border px-4 py-3 text-sm ${ui.statBox}`}>
                    <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>Verdict respected</div>
                    <div className="mt-1 font-semibold">{respectedVerdictCount}/{journal.length || 0} logged reviews</div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                  const categoryBadge = getCategoryBadge(rule.category, theme)

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
                        {mode === 'pro' && (
                          <div
                            className={`rounded-xl border px-2.5 py-2 text-[11px] font-medium md:text-xs ${categoryBadge.className}`}
                          >
                            {categoryBadge.label}
                          </div>
                        )}

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
