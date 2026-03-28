'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'

type Weight = 5 | 10 | 20
type Importance = 'mandatory' | 'important' | 'bonus'
type RuleCategory = 'structure' | 'risk' | 'confirmation' | 'psychology' | 'execution'
type AppTheme = 'dark' | 'light'
type AppMode = 'standard' | 'stats'
type Tone = 'emerald' | 'lime' | 'amber' | 'orange' | 'red'
type EmotionState = 'calm' | 'focused' | 'slightly-emotional' | 'fomo' | 'revenge' | 'tired'
type SessionType = 'London' | 'New York' | 'Asia' | 'After-hours'
type SetupType = 'Breakout' | 'Reversal' | 'Support Bounce' | 'Trendline Break' | 'Pullback'
type TradeDirection = 'long' | 'short'
type JournalOutcome = 'unknown' | 'win' | 'loss' | 'breakeven' | 'no-trade' | 'saved-me'
type FollowedVerdict = 'yes' | 'no' | 'partially'

type Rule = {
  id: string
  text: string
  checked: boolean
  weight: Weight
  required: boolean
  importance: Importance
  category: RuleCategory
  strategy: string
}

type StarterRule = {
  text: string
  importance: Importance
  category: RuleCategory
  strategy?: string
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
  setupType: string
  strategy: string
  marketCondition: string
  emotion: string
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
  setupType: string
  strategy: string
  marketCondition: string
  emotion: string
  direction: TradeDirection
  pnl: number
  rMultiple: number
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
const STRATEGY_STORAGE_KEY = 'edge-check-strategies-v1'

const defaultStrategyOptions = ['General']

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


const defaultJournalInstrumentOptions = ['ES', 'NQ', 'Gold', 'Silver', 'Oil', 'BTC', 'EURUSD']
const defaultJournalSetupOptions = ['Breakout', 'Reversal', 'Support Bounce', 'Trendline Break', 'Pullback']
const defaultJournalEmotionOptions = ['Calm', 'Focused', 'Slightly emotional', 'FOMO', 'Revenge mindset', 'Tired']
const defaultMarketConditionOptions = ['Volatile', 'Sideways', 'Trending up', 'Trending down']
const STATS_FORM_STORAGE_KEY = 'edge-check-stats-form-v1'

type ManagedOptionDropdownProps = {
  label: string
  value: string
  options: string[]
  onSelect: (value: string) => void
  onDelete: (value: string) => void
  onAdd: (value: string) => void
  theme: AppTheme
  triggerClassName: string
  inputClassName: string
  mutedClassName: string
  addButtonClassName: string
  secondaryButtonClassName: string
}

type FixedOptionDropdownProps = {
  label: string
  value: string
  options: string[]
  onSelect: (value: string) => void
  theme: AppTheme
  triggerClassName: string
  mutedClassName: string
  showLabelInTrigger?: boolean
}

function ManagedOptionDropdown({
  label,
  value,
  options,
  onSelect,
  onDelete,
  onAdd,
  theme,
  triggerClassName,
  inputClassName,
  mutedClassName,
  addButtonClassName,
  secondaryButtonClassName,
}: ManagedOptionDropdownProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const previousTouchAction = document.body.style.touchAction
    const previousOverscrollBehavior = document.body.style.overscrollBehavior
    const activeElement = document.activeElement

    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.body.style.overscrollBehavior = 'none'

    if (activeElement instanceof HTMLElement) {
      activeElement.blur()
    }

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.touchAction = previousTouchAction
      document.body.style.overscrollBehavior = previousOverscrollBehavior
    }
  }, [open])

  const panelClassName =
    theme === 'light'
      ? 'border border-slate-300/50 bg-[#2c2f38] text-white shadow-2xl'
      : 'border border-white/10 bg-[#20232c] text-white shadow-2xl'

  const dividerClassName = 'border-white/10'
  const selectedCircleClassName = 'border-[3px] border-indigo-200 ring-2 ring-indigo-200/20'
  const unselectedCircleClassName = 'border-[3px] border-slate-300 bg-transparent'

  const removeButtonClassName =
    theme === 'light'
      ? 'border border-slate-300/80 bg-transparent text-slate-200 hover:bg-white/5'
      : 'border border-white/20 bg-transparent text-slate-200 hover:bg-white/5'

  const popup =
    mounted && open
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
            <div className="fixed inset-0 bg-slate-950/28 backdrop-blur-[1px]" />
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative flex w-[calc(100vw-32px)] max-w-[640px] max-h-[62dvh] flex-col overflow-hidden rounded-[30px] ${panelClassName}`}
            >
              <div className="max-h-[42dvh] overflow-y-auto overscroll-contain">
                {options.map((item, index) => {
                  const isSelected = item === value
                  return (
                    <div
                      key={item}
                      className={`flex min-h-[74px] items-center gap-4 px-5 py-4 ${
                        index === options.length - 1 ? '' : `border-b ${dividerClassName}`
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(item)
                          setOpen(false)
                        }}
                        className="flex min-w-0 flex-1 items-center justify-between gap-4 text-left"
                      >
                        <span className="truncate text-[16px] font-medium leading-6">
                          {label}: {item}
                        </span>

                        <span
                          className={`relative h-8 w-8 flex-none rounded-full transition ${
                            isSelected ? selectedCircleClassName : unselectedCircleClassName
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute inset-[5px] rounded-full bg-indigo-200" />
                          )}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-[24px] leading-none transition ${removeButtonClassName}`}
                        aria-label={`Remove ${item}`}
                      >
                        −
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className={`border-t ${dividerClassName} p-4`}>
                <div className="flex items-center gap-3">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const trimmed = draft.trim()
                        if (!trimmed) return
                        onAdd(trimmed)
                        setDraft('')
                        setOpen(false)
                      }
                    }}
                    placeholder={`Add ${label.toLowerCase()}`}
                    className={`w-full rounded-2xl px-4 py-3 text-sm outline-none transition ${inputClassName}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = draft.trim()
                      if (!trimmed) return
                      onAdd(trimmed)
                      setDraft('')
                      setOpen(false)
                    }}
                    className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${addButtonClassName}`}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative flex h-10 w-full items-center rounded-2xl px-3 pr-10 text-left text-sm outline-none transition ${triggerClassName}`}
      >
        <span className="truncate">
          {label}: {value}
        </span>
        <span
          className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] leading-none transition ${mutedClassName} ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {popup}
    </div>
  )
}

function FixedOptionDropdown({
  label,
  value,
  options,
  onSelect,
  theme,
  triggerClassName,
  mutedClassName,
  showLabelInTrigger = true,
}: FixedOptionDropdownProps) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    const previousTouchAction = document.body.style.touchAction
    const previousOverscrollBehavior = document.body.style.overscrollBehavior
    const activeElement = document.activeElement

    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.body.style.overscrollBehavior = 'none'

    if (activeElement instanceof HTMLElement) {
      activeElement.blur()
    }

    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.touchAction = previousTouchAction
      document.body.style.overscrollBehavior = previousOverscrollBehavior
    }
  }, [open])

  const panelClassName =
    theme === 'light'
      ? 'border border-slate-300/50 bg-[#2c2f38] text-white shadow-2xl'
      : 'border border-white/10 bg-[#20232c] text-white shadow-2xl'

  const dividerClassName = 'border-white/10'
  const selectedCircleClassName = 'border-[3px] border-indigo-200 ring-2 ring-indigo-200/20'
  const unselectedCircleClassName = 'border-[3px] border-slate-300 bg-transparent'
  const formatLabel = (item: string) => (showLabelInTrigger ? `${label}: ${item}` : item)

  const popup =
    mounted && open
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
            <div className="fixed inset-0 bg-slate-950/28 backdrop-blur-[1px]" />
            <div
              onClick={(e) => e.stopPropagation()}
              className={`relative flex w-[calc(100vw-32px)] max-w-[640px] max-h-[62dvh] flex-col overflow-hidden rounded-[30px] ${panelClassName}`}
            >
              <div className="max-h-[42dvh] overflow-y-auto overscroll-contain">
                {options.map((item, index) => {
                  const isSelected = item === value
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        onSelect(item)
                        setOpen(false)
                      }}
                      className={`flex min-h-[74px] w-full items-center justify-between gap-4 px-5 py-4 text-left ${
                        index === options.length - 1 ? '' : `border-b ${dividerClassName}`
                      }`}
                    >
                      <span className="truncate text-[16px] font-medium leading-6">{formatLabel(item)}</span>
                      <span
                        className={`relative h-8 w-8 flex-none rounded-full transition ${
                          isSelected ? selectedCircleClassName : unselectedCircleClassName
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute inset-[5px] rounded-full bg-indigo-200" />
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative flex h-10 w-full items-center rounded-2xl px-3 pr-10 text-left text-sm outline-none transition ${triggerClassName}`}
      >
        <span className="truncate">{formatLabel(value)}</span>
        <span
          className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] leading-none transition ${mutedClassName} ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {popup}
    </div>
  )
}

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

function createRulesFromPack(pack: RulePack, strategy = 'General') {
  const checkedIndexes = new Set(pack.defaultCheckedIndexes ?? [])
  return pack.rules.map((rule, index) => ({
    ...createRule(rule, undefined, undefined, strategy),
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

function normalizeJournalEntry(entry: Partial<JournalEntry>): JournalEntry {
  return {
    id: typeof entry.id === 'string' ? entry.id : makeId(),
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date().toISOString(),
    score: typeof entry.score === 'number' ? entry.score : 0,
    threshold: typeof entry.threshold === 'number' ? entry.threshold : 0,
    verdict: typeof entry.verdict === 'string' ? entry.verdict : 'NOT LOGGED',
    quality: typeof entry.quality === 'string' ? entry.quality : 'No Trade',
    outcome:
      entry.outcome === 'win' || entry.outcome === 'loss' || entry.outcome === 'breakeven' || entry.outcome === 'no-trade' || entry.outcome === 'saved-me'
        ? entry.outcome
        : 'unknown',
    followedVerdict: entry.followedVerdict === 'no' || entry.followedVerdict === 'partially' ? entry.followedVerdict : 'yes',
    note: typeof entry.note === 'string' ? entry.note : '',
    screenshotDataUrl: typeof entry.screenshotDataUrl === 'string' ? entry.screenshotDataUrl : '',
    session:
      entry.session === 'London' || entry.session === 'New York' || entry.session === 'Asia' || entry.session === 'After-hours'
        ? entry.session
        : 'London',
    instrument: typeof entry.instrument === 'string' ? entry.instrument : 'ES',
    setupType: typeof entry.setupType === 'string' ? entry.setupType : 'Breakout',
    strategy: typeof entry.strategy === 'string' && entry.strategy.trim().length > 0 ? entry.strategy : 'General',
    marketCondition: typeof entry.marketCondition === 'string' && entry.marketCondition.trim().length > 0 ? entry.marketCondition : 'Volatile',
    emotion: typeof entry.emotion === 'string' ? entry.emotion : 'Calm',
    direction: entry.direction === 'short' ? 'short' : 'long',
    pnl: typeof entry.pnl === 'number' ? entry.pnl : 0,
    rMultiple: typeof entry.rMultiple === 'number' ? entry.rMultiple : 0,
    missingRuleTexts: Array.isArray(entry.missingRuleTexts) ? entry.missingRuleTexts.filter((x): x is string => typeof x === 'string') : [],
    missingCategories: Array.isArray(entry.missingCategories)
      ? entry.missingCategories.filter((x): x is RuleCategory =>
          x === 'structure' || x === 'risk' || x === 'confirmation' || x === 'psychology' || x === 'execution'
        )
      : [],
    respectedVerdict: typeof entry.respectedVerdict === 'boolean' ? entry.respectedVerdict : entry.followedVerdict !== 'no',
  }
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

function createRule(input: string | StarterRule, importance?: Importance, category?: RuleCategory, strategy = 'General'): Rule {
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

  const ruleStrategy =
    typeof input === 'string'
      ? strategy
      : typeof input.strategy === 'string' && input.strategy.trim().length > 0
      ? input.strategy.trim()
      : strategy

  return {
    id: makeId(),
    text,
    checked: false,
    weight: defaults.weight,
    required: defaults.required,
    importance: defaults.importance,
    category: defaults.category,
    strategy: ruleStrategy,
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
    strategy: typeof rule.strategy === 'string' && rule.strategy.trim().length > 0 ? rule.strategy.trim() : 'General',
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


function getTopStat(values: string[]) {
  const normalized = values.map((value) => value.trim()).filter(Boolean)
  if (normalized.length === 0) return null

  const counts = normalized.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1
    return acc
  }, {})

  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  return top ? { value: top[0], count: top[1] } : null
}


function getCombinationSummary(entries: JournalEntry[]) {
  if (entries.length === 0) return null

  const topEmotion = getTopStat(entries.map((entry) => entry.emotion))
  const topSetup = getTopStat(entries.map((entry) => entry.setupType))
  const topInstrument = getTopStat(entries.map((entry) => entry.instrument))
  const topDirection = getTopStat(entries.map((entry) => entry.direction))
  const topSession = getTopStat(entries.map((entry) => entry.session))
  const topStrategy = getTopStat(entries.map((entry) => entry.strategy))

  if (!topEmotion || !topSetup || !topInstrument || !topDirection || !topSession || !topStrategy) return null

  const exactComboCount = entries.filter(
    (entry) =>
      entry.emotion === topEmotion.value &&
      entry.setupType === topSetup.value &&
      entry.instrument === topInstrument.value &&
      entry.direction === topDirection.value &&
      entry.session === topSession.value &&
      entry.strategy === topStrategy.value
  ).length

  return {
    emotion: topEmotion.value,
    setup: topSetup.value,
    instrument: topInstrument.value,
    direction: topDirection.value,
    session: topSession.value,
    strategy: topStrategy.value,
    exactComboCount,
    sourceCount: entries.length,
  }
}

export default function Home() {
  const title = 'Edge Confirm'
  const [theme, setTheme] = useState<AppTheme>('light')
  const [mode, setMode] = useState<AppMode>('standard')
  const [newRule, setNewRule] = useState('')
  const [newRuleImportance, setNewRuleImportance] = useState<Importance | ''>('')
  const [importanceNeedsAttention, setImportanceNeedsAttention] = useState(false)
  const [newRuleCategory, setNewRuleCategory] = useState<RuleCategory>('confirmation')
  const [strategyOptions, setStrategyOptions] = useState<string[]>(defaultStrategyOptions)
  const [selectedStrategy, setSelectedStrategy] = useState(defaultStrategyOptions[0])
  const [ruleLibrary, setRuleLibrary] = useState<Rule[]>([])
  const [showSavedRulesPicker, setShowSavedRulesPicker] = useState(false)
  const [showLoadStrategyPicker, setShowLoadStrategyPicker] = useState(false)
  const [showEditStrategyRuleSet, setShowEditStrategyRuleSet] = useState(false)
  const [newRuleError, setNewRuleError] = useState('')
  const [showInstructions, setShowInstructions] = useState(false)
  const [showAdvancedPerformance, setShowAdvancedPerformance] = useState(false)
  const [selectedJournalEntry, setSelectedJournalEntry] = useState<JournalEntry | null>(null)
  const [showFocusMode, setShowFocusMode] = useState(false)
  const [proView, setProView] = useState<'prep' | 'tools' | 'review'>('prep')
  const [minScore, setMinScore] = useState(50)
  const [proSession, setProSession] = useState<SessionType>('London')
  const [proInstrument, setProInstrument] = useState('ES')
  const [proSetupType, setProSetupType] = useState<SetupType>('Breakout')
  const [proEmotion, setProEmotion] = useState<EmotionState>('calm')
  const [journalInstrument, setJournalInstrument] = useState(defaultJournalInstrumentOptions[0])
  const [journalSetup, setJournalSetup] = useState(defaultJournalSetupOptions[0])
  const [journalStrategy, setJournalStrategy] = useState('General')
  const [journalMarketCondition, setJournalMarketCondition] = useState(defaultMarketConditionOptions[0])
  const [journalEmotion, setJournalEmotion] = useState(defaultJournalEmotionOptions[0])
  const [journalInstrumentOptions, setJournalInstrumentOptions] = useState<string[]>(defaultJournalInstrumentOptions)
  const [journalSetupOptions, setJournalSetupOptions] = useState<string[]>(defaultJournalSetupOptions)
  const [journalMarketConditionOptions, setJournalMarketConditionOptions] = useState<string[]>(defaultMarketConditionOptions)
  const [journalEmotionOptions, setJournalEmotionOptions] = useState<string[]>(defaultJournalEmotionOptions)
  const [proTimerSeconds, setProTimerSeconds] = useState(15)
  const [proTimerActive, setProTimerActive] = useState(false)
  const [proTimerLeft, setProTimerLeft] = useState(15)
  const [templateName, setTemplateName] = useState('')
  const [templates, setTemplates] = useState<SavedTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [selectedRulePackId, setSelectedRulePackId] = useState(defaultRulePacks[0].id)
  const [tradeNote, setTradeNote] = useState('')
  const [tradeOutcome, setTradeOutcome] = useState<JournalOutcome>('breakeven')
  const [followedVerdict, setFollowedVerdict] = useState<FollowedVerdict>('yes')
  const [journalDirection, setJournalDirection] = useState<TradeDirection>('long')
  const [journalPnl, setJournalPnl] = useState(0)
  const [journalRMultiple, setJournalRMultiple] = useState(0)
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
  const importanceSelectRef = useRef<HTMLSelectElement | null>(null)
  const previousSnapshotRef = useRef<SetupSnapshot | null>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY)
    const savedTemplates = localStorage.getItem(TEMPLATE_STORAGE_KEY)
    const savedJournal = localStorage.getItem(JOURNAL_STORAGE_KEY)
    const savedPro = localStorage.getItem(PRO_STORAGE_KEY)
    const savedStrategies = localStorage.getItem(STRATEGY_STORAGE_KEY)

    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme)
    }

    if (savedMode === 'standard' || savedMode === 'stats') {
      setMode(savedMode)
    }

    if (savedTemplates) {
      try {
        const parsedTemplates = JSON.parse(savedTemplates)
        if (Array.isArray(parsedTemplates)) {
          setTemplates(
            parsedTemplates.map((item) => ({
              ...item,
              marketCondition:
                typeof item?.marketCondition === 'string' && item.marketCondition.trim().length > 0
                  ? item.marketCondition
                  : 'Volatile',
            }))
          )
        }
      } catch {}
    }

    if (savedJournal) {
      try {
        const parsedJournal = JSON.parse(savedJournal)
        if (Array.isArray(parsedJournal)) {
          setJournal(parsedJournal.map((entry) => normalizeJournalEntry(entry)))
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

    if (savedStrategies) {
      try {
        const parsedStrategies = JSON.parse(savedStrategies)
        if (Array.isArray(parsedStrategies.options)) {
          const nextOptions: string[] = parsedStrategies.options.filter(
            (item: unknown): item is string => typeof item === 'string' && item.trim().length > 0
          )
          if (nextOptions.length > 0) {
            const withGeneral = nextOptions.some((item: string) => item.toLowerCase() === 'general')
              ? nextOptions
              : [...nextOptions, 'General']
            setStrategyOptions(withGeneral)
          }
        }
        if (typeof parsedStrategies.selected === 'string' && parsedStrategies.selected.trim().length > 0) {
          setSelectedStrategy(parsedStrategies.selected.trim())
        }
        if (Array.isArray(parsedStrategies.library)) {
          setRuleLibrary(parsedStrategies.library.filter(isStoredRule).map((rule: Partial<Rule> & { text: string }) => normalizeRule(rule)))
        }
      } catch {}
    }

    const savedStatsForm = localStorage.getItem(STATS_FORM_STORAGE_KEY)
    if (savedStatsForm) {
      try {
        const parsedStatsForm = JSON.parse(savedStatsForm)
        if (Array.isArray(parsedStatsForm.instrumentOptions)) {
          const nextInstruments = parsedStatsForm.instrumentOptions.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
          if (nextInstruments.length > 0) setJournalInstrumentOptions(nextInstruments)
        }
        if (Array.isArray(parsedStatsForm.setupOptions)) {
          const nextSetups = parsedStatsForm.setupOptions.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
          if (nextSetups.length > 0) setJournalSetupOptions(nextSetups)
        }
        if (Array.isArray(parsedStatsForm.emotionOptions)) {
          const nextEmotions = parsedStatsForm.emotionOptions.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
          if (nextEmotions.length > 0) setJournalEmotionOptions(nextEmotions)
        }
        if (Array.isArray(parsedStatsForm.marketConditionOptions)) {
          const nextMarketConditions = parsedStatsForm.marketConditionOptions.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0)
          if (nextMarketConditions.length > 0) setJournalMarketConditionOptions(nextMarketConditions)
        }
        if (typeof parsedStatsForm.instrument === 'string') setJournalInstrument(parsedStatsForm.instrument)
        if (typeof parsedStatsForm.setup === 'string') setJournalSetup(parsedStatsForm.setup)
        if (typeof parsedStatsForm.strategy === 'string') setJournalStrategy(parsedStatsForm.strategy)
        if (typeof parsedStatsForm.marketCondition === 'string') setJournalMarketCondition(parsedStatsForm.marketCondition)
        if (typeof parsedStatsForm.emotion === 'string') setJournalEmotion(parsedStatsForm.emotion)
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
    localStorage.setItem(
      STATS_FORM_STORAGE_KEY,
      JSON.stringify({
        instrument: journalInstrument,
        setup: journalSetup,
        strategy: journalStrategy,
        marketCondition: journalMarketCondition,
        emotion: journalEmotion,
        instrumentOptions: journalInstrumentOptions,
        setupOptions: journalSetupOptions,
        marketConditionOptions: journalMarketConditionOptions,
        emotionOptions: journalEmotionOptions,
      })
    )
  }, [journalInstrument, journalSetup, journalStrategy, journalMarketCondition, journalEmotion, journalInstrumentOptions, journalSetupOptions, journalMarketConditionOptions, journalEmotionOptions])

  useEffect(() => {
    localStorage.setItem(
      STRATEGY_STORAGE_KEY,
      JSON.stringify({
        options: strategyOptions,
        selected: selectedStrategy,
        library: ruleLibrary,
      })
    )
  }, [strategyOptions, selectedStrategy, ruleLibrary])

  useEffect(() => {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates))
  }, [templates])

  useEffect(() => {
    localStorage.setItem(JOURNAL_STORAGE_KEY, JSON.stringify(journal))
  }, [journal])

  useEffect(() => {
    if (!showInstructions && !showFocusMode && !showAdvancedPerformance && !selectedJournalEntry) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [showInstructions, showFocusMode, showAdvancedPerformance, selectedJournalEntry])

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
  const totalReviewedTrades = journal.filter((entry) => entry.outcome !== 'unknown').length
  const closedTrades = journal.filter((entry) => entry.outcome === 'win' || entry.outcome === 'loss' || entry.outcome === 'breakeven')
  const winCount = journal.filter((entry) => entry.outcome === 'win').length
  const lossCount = journal.filter((entry) => entry.outcome === 'loss').length
  const breakevenCount = journal.filter((entry) => entry.outcome === 'breakeven').length
  const noTradeCount = journal.filter((entry) => entry.outcome === 'no-trade').length
  const winRate = closedTrades.length > 0 ? Math.round((winCount / closedTrades.length) * 100) : 0
  const lossRate = closedTrades.length > 0 ? Math.round((lossCount / closedTrades.length) * 100) : 0
  const longWins = journal.filter((entry) => entry.direction === 'long' && entry.outcome === 'win').length
  const longLosses = journal.filter((entry) => entry.direction === 'long' && entry.outcome === 'loss').length
  const shortWins = journal.filter((entry) => entry.direction === 'short' && entry.outcome === 'win').length
  const shortLosses = journal.filter((entry) => entry.direction === 'short' && entry.outcome === 'loss').length
  const totalNetPnl = journal.reduce((sum, entry) => sum + entry.pnl, 0)
  const averageR = closedTrades.length > 0 ? closedTrades.reduce((sum, entry) => sum + entry.rMultiple, 0) / closedTrades.length : 0
  const winningTrades = journal.filter((entry) => entry.outcome === 'win')
  const losingTrades = journal.filter((entry) => entry.outcome === 'loss')
  const averageWin = winningTrades.length > 0 ? winningTrades.reduce((sum, entry) => sum + entry.pnl, 0) / winningTrades.length : null
  const averageLoss = losingTrades.length > 0 ? losingTrades.reduce((sum, entry) => sum + entry.pnl, 0) / losingTrades.length : null
  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map((entry) => entry.pnl)) : null
  const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map((entry) => entry.pnl)) : null
  const setupBreakdown = Object.entries(
    journal.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.setupType] = (acc[entry.setupType] ?? 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])[0]
  const strategyBreakdown = Object.entries(
    journal.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.strategy] = (acc[entry.strategy] ?? 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])[0]
  const emotionBreakdown = Object.entries(
    journal.reduce<Record<string, number>>((acc, entry) => {
      acc[entry.emotion] = (acc[entry.emotion] ?? 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])[0]
  const topWinningEmotion = getTopStat(winningTrades.map((entry) => entry.emotion))
  const topLosingEmotion = getTopStat(losingTrades.map((entry) => entry.emotion))
  const topWinningSetup = getTopStat(winningTrades.map((entry) => entry.setupType))
  const topLosingSetup = getTopStat(losingTrades.map((entry) => entry.setupType))
  const topWinningInstrument = getTopStat(winningTrades.map((entry) => entry.instrument))
  const topLosingInstrument = getTopStat(losingTrades.map((entry) => entry.instrument))
  const topWinningStrategy = getTopStat(winningTrades.map((entry) => entry.strategy))
  const topLosingStrategy = getTopStat(losingTrades.map((entry) => entry.strategy))
  const topWinningDirection = getTopStat(winningTrades.map((entry) => entry.direction))
  const topLosingDirection = getTopStat(losingTrades.map((entry) => entry.direction))
  const topWinningSession = getTopStat(winningTrades.map((entry) => entry.session))
  const topLosingSession = getTopStat(losingTrades.map((entry) => entry.session))
  const topOverallDirection = getTopStat(journal.map((entry) => entry.direction))
  const topOverallSession = getTopStat(journal.map((entry) => entry.session))
  const topOverallInstrument = getTopStat(journal.map((entry) => entry.instrument))
  const topOverallSetup = getTopStat(journal.map((entry) => entry.setupType))
  const topOverallStrategy = getTopStat(journal.map((entry) => entry.strategy))
  const topOverallEmotion = getTopStat(journal.map((entry) => entry.emotion))
  const perfectWinningCombination = getCombinationSummary(winningTrades)
  const worstLosingCombination = getCombinationSummary(losingTrades)

  const bestSetupByAverageR = Object.entries(
    journal.reduce<Record<string, { total: number; count: number }>>((acc, entry) => {
      if (entry.outcome !== 'win' && entry.outcome !== 'loss' && entry.outcome !== 'breakeven') return acc
      const current = acc[entry.setupType] ?? { total: 0, count: 0 }
      current.total += entry.rMultiple
      current.count += 1
      acc[entry.setupType] = current
      return acc
    }, {})
  )
    .map(([setup, stats]) => ({ setup, avgR: stats.count > 0 ? stats.total / stats.count : 0 }))
    .sort((a, b) => b.avgR - a.avgR)[0]
  const worstSetupByAverageR = Object.entries(
    journal.reduce<Record<string, { total: number; count: number }>>((acc, entry) => {
      if (entry.outcome !== 'win' && entry.outcome !== 'loss' && entry.outcome !== 'breakeven') return acc
      const current = acc[entry.setupType] ?? { total: 0, count: 0 }
      current.total += entry.rMultiple
      current.count += 1
      acc[entry.setupType] = current
      return acc
    }, {})
  )
    .map(([setup, stats]) => ({ setup, avgR: stats.count > 0 ? stats.total / stats.count : 0 }))
    .sort((a, b) => a.avgR - b.avgR)[0]
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
    setSelectedStrategy('General')
    setRules(createRulesFromPack({ id: 'starter', name: 'Starter', minScore, rules: starterRules, defaultCheckedIndexes: [] }, 'General'))
    setShowSavedRulesPicker(false)
    setShowLoadStrategyPicker(false)
    setImportanceNeedsAttention(false)
    setNewRuleError('')
  }

  const clearAllRules = () => {
    setRules([])
    setShowSavedRulesPicker(false)
    setShowLoadStrategyPicker(false)
    setNewRule('')
    setNewRuleImportance('')
    setImportanceNeedsAttention(false)
    setNewRuleCategory('confirmation')
    setNewRuleError('')
  }

  const resetChecks = () => {
    setShowLoadStrategyPicker(false)
    setRules((prev) => prev.map((rule) => ({ ...rule, checked: false })))
  }

  const addRule = () => {
    const trimmed = newRule.trim()
    if (!trimmed) return

    if (!newRuleImportance) {
      setNewRuleError('Choose this rule importance level before adding the rule.')
      setImportanceNeedsAttention(true)
      importanceSelectRef.current?.animate(
        [
          { transform: 'translateX(0px)' },
          { transform: 'translateX(-5px)' },
          { transform: 'translateX(5px)' },
          { transform: 'translateX(-4px)' },
          { transform: 'translateX(4px)' },
          { transform: 'translateX(0px)' },
        ],
        { duration: 280, easing: 'ease-out' }
      )
      return
    }

    const normalizedNewRule = normalizeRuleText(trimmed)
    const alreadyExistsOnChecklist = rules.some(
      (rule) =>
        normalizeRuleText(rule.text) === normalizedNewRule &&
        rule.strategy.toLowerCase() === selectedStrategy.toLowerCase()
    )
    const alreadyExistsInLibrary = ruleLibrary.some(
      (rule) =>
        normalizeRuleText(rule.text) === normalizedNewRule &&
        rule.strategy.toLowerCase() === selectedStrategy.toLowerCase()
    )

    if (alreadyExistsOnChecklist || alreadyExistsInLibrary) {
      setNewRuleError(`This rule already exists inside ${selectedStrategy}.`)
      return
    }

    const rule = createRule(trimmed, newRuleImportance, newRuleCategory, selectedStrategy)
    setRules((prev) => [...prev, rule])
    setRuleLibrary((prev) => [...prev, { ...rule, checked: false }])
    setShowSavedRulesPicker(false)
    setNewRule('')
    setNewRuleImportance('')
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

  const removeRuleFromStrategySet = (ruleToRemove: Rule) => {
    const normalizedText = normalizeRuleText(ruleToRemove.text)
    const normalizedStrategy = ruleToRemove.strategy.toLowerCase()

    setRuleLibrary((prev) =>
      prev.filter(
        (rule) =>
          !(
            normalizeRuleText(rule.text) === normalizedText &&
            rule.strategy.toLowerCase() === normalizedStrategy
          )
      )
    )

    setRules((prev) =>
      prev.filter(
        (rule) =>
          !(
            normalizeRuleText(rule.text) === normalizedText &&
            rule.strategy.toLowerCase() === normalizedStrategy
          )
      )
    )

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
    setRules(createRulesFromPack(pack, selectedStrategy))
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
      instrument: journalInstrument,
      setupType: journalSetup,
      strategy: journalStrategy,
      marketCondition: journalMarketCondition,
      emotion: journalEmotion,
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
    setJournalInstrumentOptions((prev) => addUniqueOption(template.instrument, prev))
    setJournalSetupOptions((prev) => addUniqueOption(template.setupType, prev))
    setJournalMarketConditionOptions((prev) => addUniqueOption(template.marketCondition, prev))
    setJournalEmotionOptions((prev) => addUniqueOption(template.emotion, prev))
    setJournalInstrument(template.instrument)
    setJournalSetup(template.setupType)
    setJournalStrategy(template.strategy)
    setJournalMarketCondition(template.marketCondition)
    setJournalEmotion(template.emotion)
    if (template.rules.length > 0) {
      const templateStrategy = normalizeRule(template.rules[0]).strategy
      setStrategyOptions((prev) => addUniqueOption(templateStrategy, prev))
      setSelectedStrategy(templateStrategy)
    }
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


  const addUniqueOption = (value: string, existing: string[]) => {
    const trimmed = value.trim()
    if (!trimmed) return existing
    if (existing.some((item) => item.toLowerCase() === trimmed.toLowerCase())) return existing
    return [...existing, trimmed]
  }

  const addJournalInstrumentOption = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setJournalInstrumentOptions((prev) => addUniqueOption(trimmed, prev))
    setJournalInstrument(trimmed)
  }

  const deleteJournalInstrumentOption = (value: string) => {
    setJournalInstrumentOptions((prev) => {
      const next = prev.filter((item) => item !== value)
      if (next.length === 0) return prev
      if (journalInstrument === value) setJournalInstrument(next[0])
      return next
    })
  }

  const addJournalSetupOption = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setJournalSetupOptions((prev) => addUniqueOption(trimmed, prev))
    setJournalSetup(trimmed)
  }

  const deleteJournalSetupOption = (value: string) => {
    setJournalSetupOptions((prev) => {
      const next = prev.filter((item) => item !== value)
      if (next.length === 0) return prev
      if (journalSetup === value) setJournalSetup(next[0])
      return next
    })
  }

  const addJournalEmotionOption = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setJournalEmotionOptions((prev) => addUniqueOption(trimmed, prev))
    setJournalEmotion(trimmed)
  }

  const deleteJournalEmotionOption = (value: string) => {
    setJournalEmotionOptions((prev) => {
      const next = prev.filter((item) => item !== value)
      if (next.length === 0) return prev
      if (journalEmotion === value) setJournalEmotion(next[0])
      return next
    })
  }

  const addJournalMarketConditionOption = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setJournalMarketConditionOptions((prev) => addUniqueOption(trimmed, prev))
    setJournalMarketCondition(trimmed)
  }

  const deleteJournalMarketConditionOption = (value: string) => {
    setJournalMarketConditionOptions((prev) => {
      const next = prev.filter((item) => item !== value)
      if (next.length === 0) return prev
      if (journalMarketCondition === value) setJournalMarketCondition(next[0])
      return next
    })
  }

  const addStrategyOption = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return
    setStrategyOptions((prev) => addUniqueOption(trimmed, prev))
    setSelectedStrategy(trimmed)
    setNewRuleError('')
  }

  const deleteStrategyOption = (value: string) => {
    if (value === 'General') {
      setNewRuleError('General stays available as a fallback strategy.')
      return
    }

    setStrategyOptions((prev) => {
      const next = prev.filter((item) => item !== value)
      if (next.length === 0) return prev
      if (selectedStrategy === value) setSelectedStrategy(next[0])
      return next
    })
    setRuleLibrary((prev) => prev.filter((rule) => rule.strategy !== value))
    setRules((prev) => prev.filter((rule) => rule.strategy !== value))
  }

  const visibleStrategyOptions = strategyOptions.filter(
    (strategy) => strategy.toLowerCase() !== 'general'
  )
  const journalStrategyOptions = visibleStrategyOptions.length > 0 ? visibleStrategyOptions : ['General']

  const availableStrategyRuleOptions = visibleStrategyOptions.filter((strategy) =>
    ruleLibrary.some((rule) => rule.strategy.toLowerCase() === strategy.toLowerCase())
  )

  const loadSelectedStrategy = (strategyName?: string) => {
    const targetStrategy = strategyName ?? selectedStrategy
    const strategyRules = ruleLibrary.filter((rule) => rule.strategy === targetStrategy)

    if (strategyRules.length === 0) {
      setRules([])
      setShowLoadStrategyPicker(false)
      setNewRuleError(`No saved rules found yet for ${targetStrategy}.`)
      return
    }

    setSelectedStrategy(targetStrategy)
    setRules(
      strategyRules.map((rule) => ({
        ...normalizeRule(rule),
        id: makeId(),
        checked: false,
      }))
    )
    setShowSavedRulesPicker(false)
    setShowLoadStrategyPicker(false)
    setNewRuleError('')
  }

  useEffect(() => {
    if (!journalStrategyOptions.includes(journalStrategy)) {
      setJournalStrategy(journalStrategyOptions[0])
    }
  }, [journalStrategyOptions, journalStrategy])

  const addSavedRuleToChecklist = (ruleToAdd: Rule) => {
    const exists = rules.some(
      (rule) =>
        normalizeRuleText(rule.text) === normalizeRuleText(ruleToAdd.text) &&
        rule.strategy.toLowerCase() === ruleToAdd.strategy.toLowerCase()
    )

    if (exists) {
      setNewRuleError('That rule is already on the checklist.')
      return
    }

    setRules((prev) => [
      ...prev,
      {
        ...normalizeRule(ruleToAdd),
        id: makeId(),
        checked: false,
      },
    ])
    setNewRuleError('')
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
      instrument: journalInstrument,
      setupType: journalSetup,
      strategy: journalStrategy,
      marketCondition: journalMarketCondition,
      emotion: journalEmotion,
      direction: journalDirection,
      pnl: journalPnl,
      rMultiple: journalRMultiple,
      missingRuleTexts: rules.filter((rule) => !rule.checked).map((rule) => rule.text),
      missingCategories: rules.filter((rule) => !rule.checked).map((rule) => rule.category),
      respectedVerdict: followedVerdict === 'yes',
    }

    setJournal((prev) => [entry, ...prev])
    setTradeNote('')
    setTradeOutcome('breakeven')
    setFollowedVerdict('yes')
    setJournalDirection('long')
    setJournalPnl(0)
    setJournalRMultiple(0)
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

      {showAdvancedPerformance && (
        <div className="fixed inset-0 z-[82] flex items-start justify-center overflow-y-auto bg-slate-950/65 px-4 py-4 backdrop-blur-sm sm:items-center">
          <div className={`relative w-full max-w-4xl rounded-[28px] border p-5 shadow-2xl md:p-6 ${ui.card}`}>
            <button
              type="button"
              onClick={() => setShowAdvancedPerformance(false)}
              className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold transition ${ui.secondaryBtn}`}
              aria-label="Close advanced performance"
            >
              ×
            </button>

            <div className="px-8 sm:px-10">
              <h2 className="text-center text-xl font-bold md:text-2xl">Advanced performance snapshot</h2>
              <p className={`mt-2 text-center text-sm leading-6 ${ui.subtle}`}>
                Deep pattern recognition across winning and losing trades. Use this to see what keeps repeating in your journal.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 md:gap-3 xl:grid-cols-3">
              {[
                ['Win emotion', topWinningEmotion ? `${topWinningEmotion.value}` : 'No winning trades yet.'],
                ['Loss emotion', topLosingEmotion ? `${topLosingEmotion.value}` : 'No losing trades yet.'],
                ['Win setup', topWinningSetup ? `${topWinningSetup.value}` : 'No winning trades yet.'],
                ['Loss setup', topLosingSetup ? `${topLosingSetup.value}` : 'No losing trades yet.'],
                ['Win instrument', topWinningInstrument ? `${topWinningInstrument.value}` : 'No winning trades yet.'],
                ['Loss instrument', topLosingInstrument ? `${topLosingInstrument.value}` : 'No losing trades yet.'],
                ['Win strategy', topWinningStrategy ? `${topWinningStrategy.value}` : 'No winning trades yet.'],
                ['Loss strategy', topLosingStrategy ? `${topLosingStrategy.value}` : 'No losing trades yet.'],
                ['Win direction', topWinningDirection ? `${topWinningDirection.value}` : 'No winning trades yet.'],
                ['Loss direction', topLosingDirection ? `${topLosingDirection.value}` : 'No losing trades yet.'],
                ['Win session', topWinningSession ? `${topWinningSession.value}` : 'No winning trades yet.'],
                ['Loss session', topLosingSession ? `${topLosingSession.value}` : 'No losing trades yet.'],
                ['Top direction', topOverallDirection ? `${topOverallDirection.value}` : 'No data yet.'],
                ['Top session', topOverallSession ? `${topOverallSession.value}` : 'No data yet.'],
                ['Top instrument', topOverallInstrument ? `${topOverallInstrument.value}` : 'No data yet.'],
                ['Top setup', topOverallSetup ? `${topOverallSetup.value}` : 'No data yet.'],
                ['Top strategy', topOverallStrategy ? `${topOverallStrategy.value}` : 'No data yet.'],
                ['Top emotion', topOverallEmotion ? `${topOverallEmotion.value}` : 'No data yet.'],
                ['Best avg R', bestSetupByAverageR ? `${bestSetupByAverageR.setup} • ${bestSetupByAverageR.avgR.toFixed(2)}R` : 'Not enough closed trades yet.'],
                ['Worst avg R', worstSetupByAverageR ? `${worstSetupByAverageR.setup} • ${worstSetupByAverageR.avgR.toFixed(2)}R` : 'Not enough closed trades yet.'],
              ].map((item) => (
                <div key={item[0]} className={`rounded-[16px] border px-3 py-2.5 text-center shadow-sm ${ui.statBox}`}>
                  <div className={`text-[8px] uppercase tracking-[0.12em] leading-4 ${ui.muted}`}>{item[0]}</div>
                  <div className="mt-1.5 text-[13px] font-semibold leading-5 md:text-sm">{item[1]}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className={`rounded-[24px] border px-4 py-4 shadow-sm ${ui.statBox}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold">Perfect winning combination</div>
                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-950 shadow-sm">
                    Win pattern
                  </div>
                </div>

                {perfectWinningCombination ? (
                  <>
                    <p className={`mt-2 text-xs leading-5 ${ui.subtle}`}>
                      The strongest repeated winning pattern from your journal so far.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        `Emotion: ${perfectWinningCombination.emotion}`,
                        `Setup: ${perfectWinningCombination.setup}`,
                        `Instrument: ${perfectWinningCombination.instrument}`,
                        `Strategy: ${perfectWinningCombination.strategy}`,
                        `Direction: ${perfectWinningCombination.direction}`,
                        `Session: ${perfectWinningCombination.session}`,
                      ].map((item) => (
                        <div key={item} className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-slate-950 shadow-sm">
                          {item}
                        </div>
                      ))}
                    </div>

                    <div className={`mt-3 text-xs ${ui.subtle}`}>
                      Exact combo matches: <span className="font-semibold">{perfectWinningCombination.exactComboCount}</span> of {perfectWinningCombination.sourceCount} winning trades
                    </div>
                  </>
                ) : (
                  <p className={`mt-2 text-sm ${ui.subtle}`}>Not enough winning trades yet.</p>
                )}
              </div>

              <div className={`rounded-[24px] border px-4 py-4 shadow-sm ${ui.statBox}`}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold">Worst losing combination</div>
                  <div className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-slate-950 shadow-sm">
                    Loss pattern
                  </div>
                </div>

                {worstLosingCombination ? (
                  <>
                    <p className={`mt-2 text-xs leading-5 ${ui.subtle}`}>
                      The most repeated losing pattern from your journal so far.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        `Emotion: ${worstLosingCombination.emotion}`,
                        `Setup: ${worstLosingCombination.setup}`,
                        `Instrument: ${worstLosingCombination.instrument}`,
                        `Strategy: ${worstLosingCombination.strategy}`,
                        `Direction: ${worstLosingCombination.direction}`,
                        `Session: ${worstLosingCombination.session}`,
                      ].map((item) => (
                        <div key={item} className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-semibold text-slate-950 shadow-sm">
                          {item}
                        </div>
                      ))}
                    </div>

                    <div className={`mt-3 text-xs ${ui.subtle}`}>
                      Exact combo matches: <span className="font-semibold">{worstLosingCombination.exactComboCount}</span> of {worstLosingCombination.sourceCount} losing trades
                    </div>
                  </>
                ) : (
                  <p className={`mt-2 text-sm ${ui.subtle}`}>Not enough losing trades yet.</p>
                )}
              </div>
            </div>

            <div className={`mt-4 rounded-[20px] border px-4 py-3 text-center text-sm leading-6 ${ui.statBox}`}>
              <span className="font-semibold">Important note:</span> the more consistently you journal your trades, the more accurate and reliable these advanced performance patterns become over time.
            </div>
          </div>
        </div>
      )}

      {selectedJournalEntry && (
        <div className="fixed inset-0 z-[82] flex items-start justify-center overflow-y-auto bg-slate-950/65 px-4 py-4 backdrop-blur-sm sm:items-center">
          <div className={`relative w-full max-w-3xl rounded-[28px] border p-5 shadow-2xl md:p-6 ${ui.card}`}>
            <button
              type="button"
              onClick={() => setSelectedJournalEntry(null)}
              className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-lg font-semibold transition ${ui.secondaryBtn}`}
              aria-label="Close journal entry"
            >
              ×
            </button>

            <div className="pr-10">
              <h2 className="text-center text-xl font-bold md:text-2xl">Journal entry</h2>
              <p className={`mt-2 text-center text-sm ${ui.subtle}`}>{formatDate(selectedJournalEntry.createdAt)} • {selectedJournalEntry.instrument} • {selectedJournalEntry.setupType} • {selectedJournalEntry.strategy}</p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {[
                ['Outcome', selectedJournalEntry.outcome],
                ['Verdict', selectedJournalEntry.verdict],
                ['Quality', selectedJournalEntry.quality],
                ['Score / threshold', `${selectedJournalEntry.score}% / ${selectedJournalEntry.threshold}%`],
                ['Session', selectedJournalEntry.session],
                ['Strategy', selectedJournalEntry.strategy],
                ['Market condition', selectedJournalEntry.marketCondition],
                ['Emotion', selectedJournalEntry.emotion],
                ['Direction', selectedJournalEntry.direction],
                ['P&L', `${selectedJournalEntry.pnl >= 0 ? '+' : ''}${selectedJournalEntry.pnl.toFixed(2)}`],
                ['R multiple', `${selectedJournalEntry.rMultiple >= 0 ? '+' : ''}${selectedJournalEntry.rMultiple.toFixed(2)}R`],
                ['Followed verdict', selectedJournalEntry.followedVerdict === 'yes' ? 'Yes' : selectedJournalEntry.followedVerdict === 'partially' ? 'Partially' : 'No'],
              ].map((item) => (
                <div key={item[0]} className={`rounded-[20px] border px-4 py-3 ${ui.statBox}`}>
                  <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>{item[0]}</div>
                  <div className="mt-1 text-sm font-semibold">{item[1]}</div>
                </div>
              ))}
            </div>

            {selectedJournalEntry.note && (
              <div className={`mt-4 rounded-[20px] border px-4 py-3 ${ui.statBox}`}>
                <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>Journal note</div>
                <p className="mt-2 text-sm leading-6">{selectedJournalEntry.note}</p>
              </div>
            )}

            <div className={`mt-4 rounded-[20px] border px-4 py-3 ${ui.statBox}`}>
              <div className={`text-[10px] uppercase tracking-[0.18em] ${ui.muted}`}>Missing rules at save time</div>
              <div className="mt-2 text-sm font-semibold">
                {selectedJournalEntry.missingRuleTexts.length > 0 ? selectedJournalEntry.missingRuleTexts.join(', ') : 'No missing rules recorded.'}
              </div>
            </div>

            {selectedJournalEntry.screenshotDataUrl && (
              <div className="mt-4 overflow-hidden rounded-[20px] border border-white/10">
                <img src={selectedJournalEntry.screenshotDataUrl} alt="Journal screenshot" className="max-h-[420px] w-full object-contain" />
              </div>
            )}
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
        className={mode === 'stats' ? 'relative z-30 px-3 pt-2 md:px-4' : 'fixed inset-x-0 top-0 z-50 px-3 pt-2 md:px-4'}
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
            <div
              className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 ${
                theme === 'light'
                  ? 'border border-slate-200 bg-white/90 shadow-md'
                  : 'border border-white/10 bg-slate-950/88 shadow-xl'
              }`}
            >
              <span className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Stats
              </span>
              <button
                type="button"
                onClick={() => setMode((prev) => (prev === 'stats' ? 'standard' : 'stats'))}
                className={`relative h-6 w-10 rounded-full transition ${
                  mode === 'stats'
                    ? 'bg-emerald-500 shadow-[0_0_18px_rgba(16,185,129,0.30)]'
                    : theme === 'light'
                    ? 'bg-slate-300'
                    : 'bg-white/15'
                }`}
                aria-pressed={mode === 'stats'}
                aria-label={mode === 'stats' ? 'Turn stats mode off' : 'Turn stats mode on'}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                    mode === 'stats' ? 'left-5' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <div
              className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 ${
                theme === 'light'
                  ? 'border border-slate-200 bg-white/90 shadow-md'
                  : 'border border-white/10 bg-slate-950/88 shadow-xl'
              }`}
            >
              <span className={`text-[11px] font-semibold uppercase tracking-[0.14em] ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
              <button
                type="button"
                onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                className={`relative h-6 w-11 rounded-full transition ${
                  theme === 'light' ? 'bg-slate-200' : 'bg-slate-800'
                }`}
                aria-pressed={theme === 'dark'}
                aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              >
                <span
                  className={`absolute top-[2px] flex h-5 w-5 items-center justify-center rounded-full text-[11px] transition-all ${
                    theme === 'dark'
                      ? 'left-[22px] bg-white text-slate-900'
                      : 'left-[2px] bg-white text-amber-500'
                  }`}
                >
                  {theme === 'dark' ? '🌙' : '☀️'}
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className={`relative z-10 mx-auto max-w-7xl overflow-hidden rounded-[22px] ${ui.liveOuter}`}>
          <div className={`bg-gradient-to-r ${styles.soft} p-2.5 md:p-3`}>
            {mode === 'standard' ? (
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
            ) : (
              <div className="grid gap-2 md:grid-cols-[220px_minmax(0,1fr)] lg:grid-cols-[250px_minmax(0,1fr)] md:items-center">
                <div className={`rounded-[18px] p-3 ${ui.scorePanel}`}>
                  <div className={`text-[10px] uppercase tracking-[0.18em] md:text-[11px] ${ui.muted}`}>
                    Journal performance
                  </div>

                  <div className="mt-2 flex items-end justify-between gap-3">
                    <div className="flex items-end gap-2">
                      <div className="text-3xl font-black leading-none">{winRate}%</div>
                      <div className={`pb-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] ${ui.subtle}`}>
                        Winning rate
                      </div>
                    </div>
                    <div className={`text-[10px] font-semibold md:text-[11px] ${ui.subtle}`}>
                      {totalReviewedTrades} logged • {closedTrades.length} closed
                    </div>
                  </div>

                  <div className={`mt-3 h-4 overflow-hidden rounded-full ${ui.barTrack}`}>
                    <div className="flex h-full w-full">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-500"
                        style={{ width: `${winRate}%` }}
                      />
                      <div
                        className="h-full bg-red-400/80 transition-all duration-500"
                        style={{ width: `${Math.max(0, 100 - winRate)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Net P&L', `${totalNetPnl >= 0 ? '+' : ''}${totalNetPnl.toFixed(2)}`],
                    ['Avg R', `${averageR >= 0 ? '+' : ''}${averageR.toFixed(2)}R`],
                    ['Long W/L', `${longWins}/${longLosses}`],
                    ['Short W/L', `${shortWins}/${shortLosses}`],
                  ].map((item) => (
                    <div key={item[0]} className={`rounded-[16px] border px-2.5 py-2 text-center ${ui.statBox}`}>
                      <div className={`text-[8px] uppercase tracking-[0.14em] ${ui.muted}`}>{item[0]}</div>
                      <div className="mt-1 text-[13px] font-bold leading-5 md:text-sm">{item[1]}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="relative mx-auto max-w-7xl px-4 pb-6 md:px-6 lg:px-8 lg:pb-8"
        style={{ paddingTop: mode === 'stats' ? 0 : topOffset }}
      >
        {mode === 'standard' && (
        <div className={`mb-6 rounded-[28px] p-5 md:p-6 ${ui.card}`}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-2 flex items-center justify-center">
                <h1 className="text-center text-xl font-bold md:text-2xl">
                  Edge Confirm - Best Trading Discipline App
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

        )}

        <div className="space-y-4">
          {mode === 'stats' && (
            <>
              <div className={`mt-4 rounded-[24px] p-3 md:p-4 ${ui.card}`}>
                <div className="grid gap-3 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className={`order-2 rounded-[22px] p-3 xl:order-1 ${ui.innerCard}`}>
                    <div className={`mb-2 text-sm font-semibold ${ui.secondaryStrong}`}>Journal entry</div>
                    <p className={`mb-3 text-xs ${ui.muted}`}>Log the trade, the emotion, and the result. Keep it honest and fast.</p>

                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      <ManagedOptionDropdown
                        label="Instrument"
                        value={journalInstrument}
                        options={journalInstrumentOptions}
                        onSelect={setJournalInstrument}
                        onDelete={deleteJournalInstrumentOption}
                        onAdd={addJournalInstrumentOption}
                        theme={theme}
                        triggerClassName={ui.select}
                        inputClassName={ui.input}
                        mutedClassName={ui.muted}
                        addButtonClassName={styles.button}
                        secondaryButtonClassName={ui.secondaryBtn}
                      />

                      <FixedOptionDropdown
                        label="Session"
                        value={proSession}
                        options={sessionOptions}
                        onSelect={(item) => setProSession(item as SessionType)}
                        theme={theme}
                        triggerClassName={ui.select}
                        mutedClassName={ui.muted}
                      />

                      <ManagedOptionDropdown
                        label="Setup"
                        value={journalSetup}
                        options={journalSetupOptions}
                        onSelect={setJournalSetup}
                        onDelete={deleteJournalSetupOption}
                        onAdd={addJournalSetupOption}
                        theme={theme}
                        triggerClassName={ui.select}
                        inputClassName={ui.input}
                        mutedClassName={ui.muted}
                        addButtonClassName={styles.button}
                        secondaryButtonClassName={ui.secondaryBtn}
                      />

                      <FixedOptionDropdown
                        label="Strategy"
                        value={journalStrategy}
                        options={journalStrategyOptions}
                        onSelect={setJournalStrategy}
                        theme={theme}
                        triggerClassName={ui.select}
                        mutedClassName={ui.muted}
                      />

                      <ManagedOptionDropdown
                        label="Market condition"
                        value={journalMarketCondition}
                        options={journalMarketConditionOptions}
                        onSelect={setJournalMarketCondition}
                        onDelete={deleteJournalMarketConditionOption}
                        onAdd={addJournalMarketConditionOption}
                        theme={theme}
                        triggerClassName={ui.select}
                        inputClassName={ui.input}
                        mutedClassName={ui.muted}
                        addButtonClassName={styles.button}
                        secondaryButtonClassName={ui.secondaryBtn}
                      />

                      <ManagedOptionDropdown
                        label="Emotion"
                        value={journalEmotion}
                        options={journalEmotionOptions}
                        onSelect={setJournalEmotion}
                        onDelete={deleteJournalEmotionOption}
                        onAdd={addJournalEmotionOption}
                        theme={theme}
                        triggerClassName={ui.select}
                        inputClassName={ui.input}
                        mutedClassName={ui.muted}
                        addButtonClassName={styles.button}
                        secondaryButtonClassName={ui.secondaryBtn}
                      />

                      <FixedOptionDropdown
                        label="Direction"
                        value={journalDirection === 'long' ? 'Long' : 'Short'}
                        options={['Long', 'Short']}
                        onSelect={(item) => setJournalDirection(item.toLowerCase() as TradeDirection)}
                        theme={theme}
                        triggerClassName={ui.select}
                        mutedClassName={ui.muted}
                      />

                      <FixedOptionDropdown
                        label="Outcome"
                        value={tradeOutcome === 'win' ? 'Win' : tradeOutcome === 'loss' ? 'Loss' : 'Breakeven'}
                        options={['Win', 'Loss', 'Breakeven']}
                        onSelect={(item) =>
                          setTradeOutcome(item.toLowerCase() === 'breakeven' ? 'breakeven' : (item.toLowerCase() as JournalOutcome))
                        }
                        theme={theme}
                        triggerClassName={ui.select}
                        mutedClassName={ui.muted}
                      />

                      <input type="number" value={journalPnl || ''} onChange={(e) => setJournalPnl(Number(e.target.value) || 0)} className={`rounded-2xl px-3 py-2.5 text-sm outline-none transition ${ui.input}`} placeholder="Net P&L" />
                      <input type="number" step="0.1" value={journalRMultiple || ''} onChange={(e) => setJournalRMultiple(Number(e.target.value) || 0)} className={`rounded-2xl px-3 py-2.5 text-sm outline-none transition ${ui.input}`} placeholder="Result in R" />
                    </div>

                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <FixedOptionDropdown
                        label=""
                        value={
                          followedVerdict === 'yes'
                            ? 'I followed the verdict'
                            : followedVerdict === 'partially'
                              ? 'I partly followed it'
                              : 'I ignored it'
                        }
                        options={['I followed the verdict', 'I partly followed it', 'I ignored it']}
                        onSelect={(item) =>
                          setFollowedVerdict(
                            item === 'I followed the verdict' ? 'yes' : item === 'I partly followed it' ? 'partially' : 'no'
                          )
                        }
                        theme={theme}
                        triggerClassName={ui.select}
                        mutedClassName={ui.muted}
                        showLabelInTrigger={false}
                      />

                      <label className={`inline-flex cursor-pointer items-center justify-center rounded-2xl px-3 py-2 text-xs font-semibold transition ${ui.secondaryBtn}`}>
                        Upload screenshot
                        <input type="file" accept="image/*" className="hidden" onChange={handleScreenshotUpload} />
                      </label>
                    </div>

                    <textarea value={tradeNote} onChange={(e) => setTradeNote(e.target.value)} placeholder="What happened? Why did you take it, skip it, or break the verdict?" className={`mt-2 min-h-[108px] w-full rounded-[22px] px-3 py-3 text-sm outline-none transition ${ui.input}`} />

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={saveJournalEntry} className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${styles.button}`}>Save journal entry</button>
                      <button type="button" onClick={shareSummary} className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${ui.secondaryBtn}`}>{copiedSummary ? 'Copied' : 'Copy summary'}</button>
                    </div>

                    {screenshotDataUrl && (
                      <div className="mt-3 overflow-hidden rounded-[20px] border border-white/10">
                        <img src={screenshotDataUrl} alt="Uploaded chart" className="h-40 w-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className={`order-1 rounded-[22px] p-2.5 xl:order-2 md:p-3 ${ui.innerCard}`}>
                    <div className={`mb-2 text-sm font-semibold ${ui.secondaryStrong}`}>Performance snapshot</div>
                    <p className={`mb-3 text-xs ${ui.muted}`}>The stats that matter most when reviewing discipline and execution.</p>

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        ['Win rate', `${winRate}%`],
                        ['Loss rate', `${lossRate}%`],
                        ['Wins / losses', `${winCount}/${lossCount}`],
                        ['Breakevens', `${breakevenCount}`],
                        ['Long W/L', `${longWins}/${longLosses}`],
                        ['Short W/L', `${shortWins}/${shortLosses}`],
                        ['Average win', averageWin !== null ? `${averageWin >= 0 ? '+' : ''}${averageWin.toFixed(2)}` : 'No winning trades yet.'],
                        ['Average loss', averageLoss !== null ? `${averageLoss.toFixed(2)}` : 'No losing trades yet.'],
                        ['Largest win', largestWin !== null ? `${largestWin >= 0 ? '+' : ''}${largestWin.toFixed(2)}` : 'No winning trades yet.'],
                        ['Largest loss', largestLoss !== null ? `${largestLoss.toFixed(2)}` : 'No losing trades yet.'],
                        ['Top setup', setupBreakdown ? `${setupBreakdown[0]} • ${setupBreakdown[1]} entries` : 'No journal entries yet.'],
                        ['Top strategy', strategyBreakdown ? `${strategyBreakdown[0]} • ${strategyBreakdown[1]} entries` : 'No journal entries yet.'],
                        ['Most common emotion', emotionBreakdown ? `${emotionBreakdown[0]} • ${emotionBreakdown[1]} entries` : 'No journal entries yet.'],
                        ['Most missed rule', mostMissedRule ? mostMissedRule[0] : 'No missed-rule data yet.'],
                      ].map((item) => (
                        <div key={item[0]} className={`min-h-[78px] rounded-[16px] border px-2 py-2 ${ui.statBox}`}>
                          <div className={`text-[8px] uppercase tracking-[0.13em] leading-4 ${ui.muted}`}>{item[0]}</div>
                          <div className="mt-1 text-[12px] font-semibold leading-5 md:text-sm">{item[1]}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedPerformance(true)}
                        className={`rounded-2xl px-4 py-2 text-xs font-semibold transition ${ui.secondaryBtn}`}
                      >
                        Advanced performance
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`rounded-[24px] p-3 md:p-4 ${ui.card}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className={`text-sm font-semibold ${ui.secondaryStrong}`}>Recent journal entries</div>
                    <p className={`mt-1 text-xs ${ui.muted}`}>Your latest trades, screenshots, and review notes.</p>
                  </div>

                  <div className={`rounded-full border px-4 py-2 text-sm font-medium ${qualificationStyles.badge}`}>
                    {journal.length} entries
                  </div>
                </div>

                {journal.length === 0 ? (
                  <div className={`mt-3 rounded-[22px] border border-dashed p-6 text-center text-sm ${ui.statBox}`}>
                    No journal entries yet. Save your first trade in Stats mode.
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {journal.slice(0, 10).map((entry) => (
                      <div key={entry.id} className={`rounded-[22px] border p-3 ${ui.statBox}`}>
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold">{entry.instrument} • {entry.setupType}</div>
                              <div className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${theme === 'light' ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                                {entry.strategy}
                              </div>
                              <div className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${entry.outcome === 'win' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200' : entry.outcome === 'loss' ? 'border-red-500/20 bg-red-500/10 text-red-200' : entry.outcome === 'breakeven' ? 'border-amber-500/20 bg-amber-500/10 text-amber-200' : qualificationStyles.badge}`}>
                                {entry.outcome}
                              </div>
                              <div className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${entry.direction === 'long' ? 'border-sky-500/20 bg-sky-500/10 text-sky-200' : 'border-violet-500/20 bg-violet-500/10 text-violet-200'}`}>
                                {entry.direction}
                              </div>
                            </div>

                            <div className={`mt-1 text-xs ${ui.muted}`}>
                              {formatDate(entry.createdAt)} • {entry.session} • {entry.strategy} • {entry.marketCondition} • {entry.emotion} • score {entry.score}% • {entry.verdict}
                            </div>

                            <div className={`mt-2 flex flex-wrap gap-2 text-xs ${ui.muted}`}>
                              <span>P&L: {entry.pnl >= 0 ? '+' : ''}{entry.pnl.toFixed(2)}</span>
                              <span>R: {entry.rMultiple >= 0 ? '+' : ''}{entry.rMultiple.toFixed(2)}R</span>
                              <span>{entry.followedVerdict === 'yes' ? 'Followed verdict' : entry.followedVerdict === 'partially' ? 'Partly followed verdict' : 'Ignored verdict'}</span>
                            </div>

                            {entry.note && <p className="mt-2 text-sm">{entry.note}</p>}
                          </div>

                          <div className="flex gap-3 lg:flex-col lg:items-end">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedJournalEntry(entry)}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${ui.secondaryBtn}`}
                              >
                                Show
                              </button>

                              <button type="button" onClick={() => setJournal((prev) => prev.filter((item) => item.id !== entry.id))} className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${ui.deleteRule}`}>
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {mode === 'standard' && (
            <>
          <div className={`rounded-[24px] p-3 md:p-4 ${ui.card}`}>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className={`relative z-20 rounded-[22px] p-3 ${ui.innerCard}`}>
                <div className="mb-2 flex items-center justify-between gap-2 md:gap-3">
                  <div className={`min-w-0 text-sm font-semibold ${ui.secondaryStrong}`}>
                    Set your minimum setup quality threshold
                  </div>
                </div>

                <div className="mt-1 flex items-center gap-2 md:gap-3">
                  <button
                    type="button"
                    onClick={() => setMinScore((prev) => Math.max(0, prev - 5))}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-red-300 bg-red-500 text-xl font-semibold text-white transition hover:bg-red-600 active:scale-[0.98]"
                    aria-label="Decrease threshold"
                  >
                    −
                  </button>

                  <div
                    className={`relative flex-1 overflow-hidden rounded-full border ${
                      theme === 'light'
                        ? 'border-slate-300 bg-white'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-emerald-500 transition-all duration-200"
                      style={{ width: `${minScore}%` }}
                    />
                    <div className={`relative px-3 py-2.5 text-center text-[13px] font-semibold md:px-4 md:text-sm ${
                      theme === 'light' ? 'text-slate-800' : 'text-white'
                    }`}>
                      Threshold: {minScore}%
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMinScore((prev) => Math.min(100, prev + 5))}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-300 bg-emerald-500 text-xl font-semibold text-white transition hover:bg-emerald-600 active:scale-[0.98]"
                    aria-label="Increase threshold"
                  >
                    +
                  </button>
                </div>


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
                  Build your strategy checklist
                </div>
                <p className={`mb-3 text-xs leading-5 ${ui.muted}`}>
                  Create a strategy first, then add rules under that strategy so you can reload the full checklist in one tap later.
                </p>

                <div className="mt-3 flex flex-col gap-2">
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

                  <button
                    type="button"
                    onClick={() => setShowEditStrategyRuleSet((prev) => !prev)}
                    className={`rounded-2xl px-3 py-2 text-left text-[11px] font-semibold transition sm:text-xs ${ui.secondaryBtn}`}
                  >
                    Edit your strategy ruleset
                  </button>

                  {showEditStrategyRuleSet && (
                    <div className={`rounded-[22px] border p-3 ${ui.innerCard}`}>
                      <div className={`text-sm font-semibold ${ui.secondaryStrong}`}>{selectedStrategy} ruleset</div>
                      <p className={`mt-1 text-xs leading-5 ${ui.muted}`}>
                        Remove rules from this selected strategy whenever you want to refine or clean up the set.
                      </p>

                      <div className="mt-3 space-y-2">
                        {ruleLibrary.filter((rule) => rule.strategy.toLowerCase() === selectedStrategy.toLowerCase()).length === 0 ? (
                          <div className={`rounded-2xl px-3 py-3 text-sm ${ui.empty}`}>
                            No saved rules yet inside {selectedStrategy}.
                          </div>
                        ) : (
                          ruleLibrary
                            .filter((rule) => rule.strategy.toLowerCase() === selectedStrategy.toLowerCase())
                            .map((rule) => {
                              const importanceBadge = getImportanceBadge(rule.importance, theme)
                              return (
                                <div key={rule.id} className={`flex items-center gap-2 rounded-[18px] border p-3 ${ui.statBox}`}>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-semibold">{rule.text}</div>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      <div className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${importanceBadge.className}`}>
                                        {importanceBadge.label}
                                      </div>
                                      <div className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${theme === 'light' ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                                        {rule.strategy}
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => removeRuleFromStrategySet(rule)}
                                    className={`flex h-8 min-w-[42px] items-center justify-center rounded-full px-2 text-sm font-semibold transition ${ui.deleteRule}`}
                                  >
                                    -
                                  </button>
                                </div>
                              )
                            })
                        )}
                      </div>
                    </div>
                  )}

                  <ManagedOptionDropdown
                    label="Strategy"
                    value={selectedStrategy}
                    options={visibleStrategyOptions}
                    onSelect={(value) => {
                      setSelectedStrategy(value)
                      setShowSavedRulesPicker(false)
                      setShowLoadStrategyPicker(false)
                      setShowEditStrategyRuleSet(false)
                      setImportanceNeedsAttention(false)
                      setNewRuleError('')
                    }}
                    onDelete={deleteStrategyOption}
                    onAdd={addStrategyOption}
                    theme={theme}
                    triggerClassName={ui.select}
                    inputClassName={ui.input}
                    mutedClassName={ui.muted}
                    addButtonClassName={styles.button}
                    secondaryButtonClassName={ui.secondaryBtn}
                  />

                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                    <div className="relative">
                      <select
                        ref={importanceSelectRef}
                        value={newRuleImportance}
                        onChange={(e) => {
                          setNewRuleImportance(e.target.value as Importance | '')
                          setImportanceNeedsAttention(false)
                          if (newRuleError === 'Choose this rule importance level before adding the rule.') {
                            setNewRuleError('')
                          }
                        }}
                        className={`h-10 w-full appearance-none rounded-2xl px-3 pr-10 text-sm outline-none transition ${ui.select} ${
                          importanceNeedsAttention
                            ? theme === 'light'
                              ? 'border-red-400 bg-red-50 ring-2 ring-red-200'
                              : 'border-red-400/60 bg-red-500/10 ring-2 ring-red-500/20'
                            : ''
                        }`}
                      >
                        <option value="" disabled>
                          Choose this rule importance level
                        </option>
                        {importanceOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <span className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[11px] leading-none ${ui.muted}`}>▼</span>
                    </div>

                    <button
                      onClick={addRule}
                      aria-label="Add rule"
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-xl font-bold transition ${styles.button}`}
                    >
                      +
                    </button>
                  </div>

                  <div className={`rounded-2xl px-3 py-2 text-[11px] leading-5 md:text-xs ${ui.statBox}`}>
                    New rules added below will be saved under <span className="font-semibold">{selectedStrategy}</span>.
                  </div>
                </div>

                {newRuleError && (
                  <div className={`mt-2 rounded-2xl px-3 py-2 text-[11px] leading-5 md:text-xs ${ui.errorBox}`}>
                    {newRuleError}
                  </div>
                )}
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

            <div className="mb-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <button
                onClick={loadStarterRules}
                className={`rounded-2xl px-3 py-2 text-[11px] font-semibold transition sm:text-xs ${ui.secondaryBtn}`}
              >
                Load Starter Set
              </button>

              <button
                onClick={() => {
                  if (availableStrategyRuleOptions.length <= 1) {
                    const fallbackStrategy = availableStrategyRuleOptions[0] ?? selectedStrategy
                    loadSelectedStrategy(fallbackStrategy)
                    return
                  }
                  setShowSavedRulesPicker(false)
                  setShowEditStrategyRuleSet(false)
                  setShowLoadStrategyPicker((prev) => !prev)
                }}
                className={`rounded-2xl px-3 py-2 text-[11px] font-semibold transition sm:text-xs ${ui.secondaryBtn}`}
              >
                Load Strategy Rules
              </button>

              <button
                onClick={resetChecks}
                className={`rounded-2xl px-3 py-2 text-[11px] font-semibold transition sm:text-xs ${ui.secondaryBtn}`}
              >
                Reset
              </button>

              <button
                onClick={clearAllRules}
                className={`rounded-2xl px-3 py-2 text-[11px] font-semibold transition sm:text-xs ${ui.dangerBtn}`}
              >
                Delete Rules
              </button>
            </div>

            {showLoadStrategyPicker && (
              <div className={`mb-3 rounded-[22px] border p-3 ${ui.innerCard}`}>
                <div className={`mb-2 text-sm font-semibold ${ui.secondaryStrong}`}>Choose strategy rules</div>
                <p className={`mb-3 text-xs ${ui.muted}`}>
                  Select which saved strategy you want to load into the checklist.
                </p>

                {availableStrategyRuleOptions.length === 0 ? (
                  <div className={`rounded-2xl px-3 py-3 text-sm ${ui.empty}`}>
                    No saved strategy rules available yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableStrategyRuleOptions.map((strategy) => (
                      <button
                        key={strategy}
                        type="button"
                        onClick={() => loadSelectedStrategy(strategy)}
                        className={`rounded-2xl px-3 py-2 text-[11px] font-semibold transition sm:text-xs ${ui.secondaryBtn}`}
                      >
                        {strategy}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {rules.length === 0 ? (
              <div className={`rounded-[24px] p-8 text-center ${ui.empty}`}>
                No rules yet. Add rules using the + button above.
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule) => {
                  const importanceBadge = getImportanceBadge(rule.importance, theme)
                  const categoryBadge = getCategoryBadge(rule.category, theme)
                  const strategyBadgeClassName =
                    theme === 'light'
                      ? 'border-slate-300 bg-slate-100 text-slate-700'
                      : 'border-white/10 bg-white/5 text-slate-300'

                  return (
                    <div
                      key={rule.id}
                      className={`group flex items-start gap-2.5 rounded-[20px] border p-3 transition md:items-center md:gap-3 md:p-3.5 ${
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

                      <div className="flex shrink-0 flex-col items-end gap-1 md:flex-row md:items-center md:gap-2">

                        <div className="flex items-center gap-1">
                          <div
                            className={`inline-flex h-6 items-center rounded-lg border px-2 text-[10px] font-medium leading-none md:h-auto md:rounded-xl md:px-2.5 md:py-2 md:text-xs ${importanceBadge.className}`}
                          >
                            {importanceBadge.label}
                          </div>

                          <div
                            className={`inline-flex h-6 items-center rounded-lg border px-2 text-[10px] font-medium leading-none md:h-auto md:rounded-xl md:px-2.5 md:py-2 md:text-xs ${strategyBadgeClassName}`}
                          >
                            {rule.strategy}
                          </div>
                        </div>

                        <button
                          onClick={() => deleteRule(rule.id)}
                          className={`flex h-6 min-w-[40px] items-center justify-center rounded-full px-2 text-sm transition md:h-10 md:min-w-[52px] md:rounded-full md:text-lg ${ui.deleteRule}`}
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

            <div className="mt-4 flex flex-col items-center gap-3">
              {showSavedRulesPicker && (
                <div className={`w-full rounded-[22px] border p-3 ${ui.innerCard}`}>
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className={`text-sm font-semibold ${ui.secondaryStrong}`}>Add saved rule</div>
                      <p className={`mt-1 text-xs ${ui.muted}`}>
                        Showing saved rules for <span className="font-semibold">{selectedStrategy}</span>.
                      </p>
                    </div>
                  </div>

                  {ruleLibrary.filter((rule) => rule.strategy === selectedStrategy && !rules.some((currentRule) => normalizeRuleText(currentRule.text) === normalizeRuleText(rule.text) && currentRule.strategy.toLowerCase() === rule.strategy.toLowerCase())).length === 0 ? (
                    <div className={`rounded-2xl px-3 py-3 text-sm ${ui.empty}`}>
                      No saved rules available yet for this strategy.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {ruleLibrary
                        .filter((rule) => rule.strategy === selectedStrategy)
                        .filter((rule) => !rules.some((currentRule) => normalizeRuleText(currentRule.text) === normalizeRuleText(rule.text) && currentRule.strategy.toLowerCase() === rule.strategy.toLowerCase()))
                        .map((rule) => {
                          const importanceBadge = getImportanceBadge(rule.importance, theme)
                          return (
                            <div key={rule.id} className={`flex items-center gap-2 rounded-[18px] border p-3 ${ui.statBox}`}>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold">{rule.text}</div>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  <div className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${importanceBadge.className}`}>
                                    {importanceBadge.label}
                                  </div>
                                  <div className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${theme === 'light' ? 'border-slate-300 bg-slate-100 text-slate-700' : 'border-white/10 bg-white/5 text-slate-300'}`}>
                                    {rule.strategy}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => addSavedRuleToChecklist(rule)}
                                className={`rounded-2xl px-3 py-2 text-xs font-semibold transition ${ui.secondaryBtn}`}
                              >
                                Add
                              </button>
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

            </>
          )}
        </div>
      </div>
    </main>
  )
}
