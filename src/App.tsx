import { useEffect, useMemo, useRef, useState } from 'react'
import CatMark from './catMark'

type SoundId = 'rain' | 'ocean' | 'brown' | 'white'
type TimerOption = number
type LayerVolumeMap = Record<SoundId, number>

type SleepCycle = {
  label: string
  bedtime: string
  sleepTime: string
}

type NapWindow = {
  label: string
  duration: number
  endTime: string
  benefit: string
}

type SoundOption = {
  id: SoundId
  name: string
  description: string
  mood: string
}

type Scenario = {
  id: string
  name: string
  soundId: SoundId
  timer: TimerOption
  benefit: string
}

type ToolLink = {
  href: string
  kicker: string
  title: string
  description: string
}

type SavedSoundCollection = SoundId[]

type BreathingPhase = 'inhale' | 'hold' | 'exhale'

type BreathingStep = {
  phase: BreathingPhase
  label: string
  seconds: number
  guidance: string
}

const soundOptions: SoundOption[] = [
  {
    id: 'rain',
    name: 'Rain on Window',
    description: 'Soft filtered rain for winding down fast.',
    mood: 'For easing into sleep without effort.',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    description: 'A slower pulse for longer, deeper relaxation.',
    mood: 'For a gentler full-night drift.',
  },
  {
    id: 'brown',
    name: 'Brown Noise',
    description: 'Deep low-end masking for racing thoughts and city noise.',
    mood: 'For shutting down mental chatter.',
  },
  {
    id: 'white',
    name: 'White Noise',
    description: 'Balanced broadband noise for light sleepers and late-night wakeups.',
    mood: 'For quick sleep restarts after waking.',
  },
]

const defaultLayerVolumes: LayerVolumeMap = {
  rain: 0.7,
  ocean: 0.7,
  brown: 0.62,
  white: 0.58,
}

const scenarios: Scenario[] = [
  {
    id: 'cant-sleep',
    name: "Can't fall asleep",
    soundId: 'rain',
    timer: 20,
    benefit: 'Start with gentle rain and a 20 minute sleep timer.',
  },
  {
    id: 'wake-up-3am',
    name: 'Woke up at 3 AM',
    soundId: 'white',
    timer: 10,
    benefit: 'Restart sleep quickly without committing to an all-night loop.',
  },
]

const timerOptions: TimerOption[] = [10, 20, 30, 45, 60]
const TIMER_SCALE_MS = 1000
const FALL_ASLEEP_BUFFER_MINUTES = 15
const SLEEP_CYCLE_MINUTES = 90
const FAVORITES_STORAGE_KEY = 'sleepfast-favorite-sounds'
const RECENT_STORAGE_KEY = 'sleepfast-recent-sounds'
const breathingSteps: BreathingStep[] = [
  {
    phase: 'inhale',
    label: 'Inhale',
    seconds: 4,
    guidance: 'Breathe in slowly through your nose and let your shoulders stay soft.',
  },
  {
    phase: 'hold',
    label: 'Hold',
    seconds: 7,
    guidance: 'Hold gently without straining. Keep your jaw, neck, and forehead loose.',
  },
  {
    phase: 'exhale',
    label: 'Exhale',
    seconds: 8,
    guidance: 'Exhale slowly through your mouth and let the room feel heavier and quieter.',
  },
]
const toolLinks: ToolLink[] = [
  {
    href: '/sleep-breathing-exercise',
    kicker: 'For fast calming',
    title: 'Sleep breathing exercise',
    description: 'Use a simple 4-7-8 breathing reset when your body is tired but your mind still feels too switched on.',
  },
  {
    href: '/white-noise-for-sleep',
    kicker: 'For lighter sleepers',
    title: 'White noise for sleep',
    description: 'Mask house noise, neighbors, and sudden wake-up triggers with a steadier layer.',
  },
  {
    href: '/brown-noise-for-sleep',
    kicker: 'For mental chatter',
    title: 'Brown noise for sleep',
    description: 'Use a deeper sound layer when silence makes thoughts or city hum feel louder.',
  },
  {
    href: '/rain-sounds-for-sleep',
    kicker: 'For winding down',
    title: 'Rain sounds for sleep',
    description: 'Settle into a softer rain layer when you want the room to feel dimmer, quieter, and less exposed.',
  },
  {
    href: '/ocean-sounds-for-sleep',
    kicker: 'For longer drifting',
    title: 'Ocean sounds for sleep',
    description: 'Lean on a slower shoreline when you want a deeper, steadier layer for full-body unwinding before sleep.',
  },
  {
    href: '/sleep-calculator',
    kicker: 'For bedtime timing',
    title: 'Sleep calculator',
    description: 'Pick a wake-up time and get realistic bedtime targets built around sleep cycles.',
  },
  {
    href: '/nap-calculator',
    kicker: 'For daytime recovery',
    title: 'Nap calculator',
    description: 'See the best time to wake up from a 20, 30, or 90 minute nap, then move straight into a calmer Sleepfast reset.',
  },
  {
    href: '/fall-asleep-fast',
    kicker: 'For tonight’s reset',
    title: 'Fall asleep fast',
    description: 'Open a simpler browser-first reset when you feel tired but sleep still will not start.',
  },
  {
    href: '/wake-up-at-3am',
    kicker: 'For 3AM wake-ups',
    title: 'Wake up at 3AM',
    description: 'Restart sleep faster with a short white-noise reset built for middle-of-the-night waking.',
  },
  {
    href: '/mind-racing-at-night',
    kicker: 'For racing thoughts',
    title: 'Mind racing at night',
    description: 'Ground overstimulated bedtimes with a calmer brown-noise routine and fewer inputs.',
  },
  {
    href: '/sleep-better-tonight',
    kicker: 'For a gentler reset',
    title: 'Sleep better tonight',
    description: 'Use a calmer bedtime bridge with one sound, one timer, and one next step when tonight already feels off track.',
  },
]

const formatTimerLabel = (timeLeftMs: number | null, timerMinutes: TimerOption) => {
  if (timeLeftMs !== null) {
    return `${Math.max(Math.ceil(timeLeftMs / TIMER_SCALE_MS), 0)} min left`
  }

  return `${timerMinutes} min preset`
}

const padTime = (value: number) => value.toString().padStart(2, '0')

const minutesToTimeInput = (totalMinutes: number) => {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440
  const hours = Math.floor(wrapped / 60)
  const minutes = wrapped % 60
  return `${padTime(hours)}:${padTime(minutes)}`
}

const timeInputToMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

const formatMinutesForHumans = (totalMinutes: number) => {
  const wrapped = ((totalMinutes % 1440) + 1440) % 1440
  const hours = Math.floor(wrapped / 60)
  const minutes = wrapped % 60
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const normalizedHours = hours % 12 || 12
  return `${normalizedHours}:${padTime(minutes)} ${suffix}`
}

const buildSleepCycles = (wakeMinutes: number): SleepCycle[] =>
  [6, 5, 4].map((cycles) => {
    const sleepTimeMinutes = wakeMinutes - cycles * SLEEP_CYCLE_MINUTES
    const bedtimeMinutes = sleepTimeMinutes - FALL_ASLEEP_BUFFER_MINUTES

    return {
      label: `${cycles} sleep cycles`,
      bedtime: formatMinutesForHumans(bedtimeMinutes),
      sleepTime: formatMinutesForHumans(sleepTimeMinutes),
    }
  })

const buildNapWindows = (startMinutes: number): NapWindow[] =>
  [
    {
      label: 'Quick reset',
      duration: 20,
      benefit: 'Best when you need a lighter midday reset without sliding into a groggy wake-up.',
    },
    {
      label: 'Longer recharge',
      duration: 30,
      benefit: 'Good when you want a little more breathing room before getting back to work or travel.',
    },
    {
      label: 'Full sleep cycle',
      duration: 90,
      benefit: 'Use this when you can protect a full cycle and want to avoid waking up halfway through deeper sleep.',
    },
  ].map((window) => ({
    ...window,
    endTime: formatMinutesForHumans(startMinutes + window.duration),
  }))

const readSavedSounds = (storageKey: string): SavedSoundCollection => {
  if (typeof window === 'undefined') return []

  try {
    const rawValue = window.localStorage.getItem(storageKey)
    if (!rawValue) return []

    const parsedValue = JSON.parse(rawValue)
    if (!Array.isArray(parsedValue)) return []

    return parsedValue.filter((value): value is SoundId => soundOptions.some((option) => option.id === value)).slice(0, 4)
  } catch {
    return []
  }
}

const writeSavedSounds = (storageKey: string, soundIds: SavedSoundCollection) => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(storageKey, JSON.stringify(soundIds))
}

const pushUniqueSound = (soundIds: SavedSoundCollection, soundId: SoundId, limit = 4) =>
  [soundId, ...soundIds.filter((id) => id !== soundId)].slice(0, limit)

const normalizeTimerMinutes = (value: number) => {
  if (!Number.isFinite(value)) return 20

  return Math.min(Math.max(Math.round(value), 1), 180)
}

const readCustomTimerMinutes = (value: string) => {
  const parsedValue = Number.parseInt(value, 10)
  return normalizeTimerMinutes(parsedValue)
}

const getCustomTimerValue = (value: string) => `${readCustomTimerMinutes(value)}`

const getHeroScene = (soundId: SoundId) => {
  if (soundId === 'ocean') {
    return {
      backdropClassName: 'rain-backdrop ocean-backdrop',
      vignetteClassName: 'night-vignette ocean-vignette',
      mistLeftClassName: 'mist mist-left ocean-mist-left',
      mistRightClassName: 'mist mist-right ocean-mist-right',
      eyebrow: 'Moon over the water',
      microCopy: 'For the nights when your body is tired, but your thoughts still keep washing back in.',
      comfortNote: 'A small moonlit shoreline for the moment your shoulders are tired, but the rest of you has not drifted there yet.',
      ritualLabel: 'Ocean ritual',
      ritualCopy: 'Choose one sound, dim the room, and let the water keep moving without changing much. The less you manage, the easier it is to drift.',
      ambientClassName: 'ambient-preview ambient-preview-healing',
      scene: 'ocean' as const,
    }
  }

  if (soundId === 'rain') {
    return {
      backdropClassName: 'rain-backdrop rain-backdrop-window',
      vignetteClassName: 'night-vignette',
      mistLeftClassName: 'mist mist-left',
      mistRightClassName: 'mist mist-right',
      eyebrow: 'Rain on the glass',
      microCopy: 'For the nights when a softer room matters more than another attempt at control.',
      comfortNote: 'A sheltered window scene for the moment you need the room to feel dimmer, quieter, and less exposed.',
      ritualLabel: 'Rain ritual',
      ritualCopy: 'Let the rain carry the background, keep the lights low, and stop asking the room to change every few minutes.',
      ambientClassName: 'ambient-preview ambient-preview-healing ambient-preview-rain',
      scene: 'rain' as const,
    }
  }

  return {
    backdropClassName: 'rain-backdrop deep-space-backdrop',
    vignetteClassName: 'night-vignette deep-space-vignette',
    mistLeftClassName: 'mist mist-left deep-space-mist-left',
    mistRightClassName: 'mist mist-right deep-space-mist-right',
    eyebrow: soundId === 'brown' ? 'Ground the room' : 'Quiet the sharp edges',
    microCopy:
      soundId === 'brown'
        ? 'For the nights when silence makes your thoughts feel even louder.'
        : 'For the wake-ups where every tiny sound suddenly feels too bright.',
    comfortNote:
      soundId === 'brown'
        ? 'A deeper night layer for the moments when your mind needs something heavier than silence to lean against.'
        : 'A cleaner masking layer for the moments when you need the room to stop surprising you.',
    ritualLabel: soundId === 'brown' ? 'Brown noise ritual' : 'White noise ritual',
    ritualCopy:
      soundId === 'brown'
        ? 'Keep one grounding layer in place and let the deeper texture hold the room steady while your thoughts lose momentum.'
        : 'Use one steady masking layer, keep the room predictable, and give sudden sounds fewer chances to pull you awake again.',
    ambientClassName:
      soundId === 'brown'
        ? 'ambient-preview ambient-preview-healing ambient-preview-brown'
        : 'ambient-preview ambient-preview-healing ambient-preview-white',
    scene: soundId === 'brown' ? ('brown' as const) : ('white' as const),
  }
}

const App = () => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const isWhiteNoisePage = normalizedPath === '/white-noise-for-sleep'
  const isBrownNoisePage = normalizedPath === '/brown-noise-for-sleep'
  const isRainSoundsPage = normalizedPath === '/rain-sounds-for-sleep'
  const isOceanSoundsPage = normalizedPath === '/ocean-sounds-for-sleep'
  const isSleepCalculatorPage = normalizedPath === '/sleep-calculator'
  const isNapCalculatorPage = normalizedPath === '/nap-calculator'
  const isSleepBreathingExercisePage = normalizedPath === '/sleep-breathing-exercise'
  const isFallAsleepFastPage = normalizedPath === '/fall-asleep-fast'
  const isWakeUpAt3amPage = normalizedPath === '/wake-up-at-3am'
  const isMindRacingAtNightPage = normalizedPath === '/mind-racing-at-night'
  const isSleepBetterTonightPage = normalizedPath === '/sleep-better-tonight'
  const isNoiseToolPage = isWhiteNoisePage || isBrownNoisePage
  const [wakeTime, setWakeTime] = useState(() => {
    if (typeof window === 'undefined') return '07:00'

    const now = new Date()
    const nextHour = new Date(now)
    nextHour.setHours(now.getHours() + 8, 0, 0, 0)
    return minutesToTimeInput(nextHour.getHours() * 60 + nextHour.getMinutes())
  })
  const [selectedSound, setSelectedSound] = useState<SoundId>('rain')
  const [selectedScenario, setSelectedScenario] = useState<string>(scenarios[0].id)
  const [supportSoundIds, setSupportSoundIds] = useState<SoundId[]>([])
  const [layerVolumes, setLayerVolumes] = useState<LayerVolumeMap>(defaultLayerVolumes)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const volume = 0.55
  const [timerMinutes, setTimerMinutes] = useState<TimerOption>(20)
  const [customTimerMinutes, setCustomTimerMinutes] = useState('90')
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [favoriteSoundIds, setFavoriteSoundIds] = useState<SavedSoundCollection>(() => readSavedSounds(FAVORITES_STORAGE_KEY))
  const [recentSoundIds, setRecentSoundIds] = useState<SavedSoundCollection>(() => readSavedSounds(RECENT_STORAGE_KEY))
  const [breathingActive, setBreathingActive] = useState(false)
  const [breathingStepIndex, setBreathingStepIndex] = useState(0)
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState(breathingSteps[0].seconds)
  const [breathingCycleCount, setBreathingCycleCount] = useState(0)

  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const activeNodesRef = useRef<
    Array<{
      source: AudioBufferSourceNode
      filter?: BiquadFilterNode
      gain?: GainNode
      modulator?: OscillatorNode
      modulationDepth?: GainNode
    }>
  >([])
  const timerDeadlineRef = useRef<number | null>(null)
  const fadeOutTimeoutRef = useRef<number | null>(null)

  const currentSound = useMemo(
    () => soundOptions.find((option) => option.id === selectedSound) ?? soundOptions[0],
    [selectedSound],
  )
  const heroScene = useMemo(() => getHeroScene(selectedSound), [selectedSound])
  const sleepCycles = useMemo(() => buildSleepCycles(timeInputToMinutes(wakeTime)), [wakeTime])
  const napWindows = useMemo(() => buildNapWindows(timeInputToMinutes(wakeTime)), [wakeTime])
  const relatedToolLinks = useMemo(
    () => toolLinks.filter((tool) => tool.href !== normalizedPath).slice(0, 3),
    [normalizedPath],
  )
  const activeLayerIds = useMemo(
    () => [selectedSound, ...supportSoundIds.filter((soundId) => soundId !== selectedSound)],
    [selectedSound, supportSoundIds],
  )
  const availableSupportSounds = useMemo(
    () => soundOptions.filter((option) => option.id !== selectedSound),
    [selectedSound],
  )
  const favoriteSounds = useMemo(
    () => favoriteSoundIds.map((soundId) => soundOptions.find((option) => option.id === soundId)).filter(Boolean) as SoundOption[],
    [favoriteSoundIds],
  )
  const recentSounds = useMemo(
    () => recentSoundIds.map((soundId) => soundOptions.find((option) => option.id === soundId)).filter(Boolean) as SoundOption[],
    [recentSoundIds],
  )
  const currentBreathingStep = breathingSteps[breathingStepIndex]

  useEffect(() => {
    if (isWhiteNoisePage || isWakeUpAt3amPage) {
      setSelectedSound('white')
      setSelectedScenario('wake-up-3am')
      setTimerMinutes(isWakeUpAt3amPage ? 10 : 30)
    }

    if (isBrownNoisePage || isMindRacingAtNightPage) {
      setSelectedSound('brown')
      setSelectedScenario('cant-sleep')
      setTimerMinutes(45)
    }

    if (isRainSoundsPage) {
      setSelectedSound('rain')
      setSelectedScenario('cant-sleep')
      setTimerMinutes(30)
    }

    if (isOceanSoundsPage) {
      setSelectedSound('ocean')
      setSelectedScenario('cant-sleep')
      setTimerMinutes(45)
    }
  }, [isBrownNoisePage, isMindRacingAtNightPage, isOceanSoundsPage, isRainSoundsPage, isWakeUpAt3amPage, isWhiteNoisePage])

  useEffect(() => {
    setSupportSoundIds((current) => current.filter((soundId) => soundId !== selectedSound))
  }, [selectedSound])

  useEffect(() => {
    writeSavedSounds(FAVORITES_STORAGE_KEY, favoriteSoundIds)
  }, [favoriteSoundIds])

  useEffect(() => {
    writeSavedSounds(RECENT_STORAGE_KEY, recentSoundIds)
  }, [recentSoundIds])

  useEffect(() => {
    if (!isPlaying) return

    setRecentSoundIds((current) => pushUniqueSound(current, selectedSound))
  }, [isPlaying, selectedSound])

  useEffect(() => {
    const title = isWhiteNoisePage
        ? 'White Noise for Sleep — Play Instantly in Your Browser | Sleepfast'
      : isBrownNoisePage
        ? 'Brown Noise for Sleep — Play Instantly in Your Browser | Sleepfast'
        : isRainSoundsPage
          ? 'Rain Sounds for Sleep — Play Instantly in Your Browser | Sleepfast'
        : isOceanSoundsPage
          ? 'Ocean Sounds for Sleep — Play Instantly in Your Browser | Sleepfast'
        : isSleepCalculatorPage
          ? 'Sleep Calculator — Best Bedtime and Wake Time Tool | Sleepfast'
          : isNapCalculatorPage
            ? 'Nap Calculator — Best Nap Length and Wake-Up Time Tool | Sleepfast'
          : isSleepBreathingExercisePage
            ? 'Sleep Breathing Exercise — 4-7-8 Reset for Bedtime | Sleepfast'
          : isFallAsleepFastPage
            ? 'Fall Asleep Fast — Sleep Sounds and Bedtime Reset | Sleepfast'
            : isWakeUpAt3amPage
              ? 'Wake Up at 3AM — Fall Back Asleep Faster | Sleepfast'
              : isMindRacingAtNightPage
                ? 'Mind Racing at Night — Calm Down and Fall Asleep Faster | Sleepfast'
                : isSleepBetterTonightPage
                  ? 'Sleep Better Tonight — Calm Bedtime Reset and Sleep Sounds | Sleepfast'
            : 'Sleepfast — Fall asleep faster tonight'
    const description = isWhiteNoisePage
        ? 'Play white noise for sleep instantly in your browser with a simple timer, light-sleeper masking, and a calmer way to restart sleep after waking up at night.'
      : isBrownNoisePage
        ? 'Play brown noise for sleep instantly in your browser with a deeper low-end layer for racing thoughts, city noise, and harder-to-settle nights.'
        : isRainSoundsPage
          ? 'Play rain sounds for sleep instantly in your browser with a softer wind-down layer, a simple timer, and a calmer way to settle into bed tonight.'
        : isOceanSoundsPage
          ? 'Play ocean sounds for sleep instantly in your browser with a slower shoreline layer, a simple timer, and a calmer way to drift into deeper relaxation tonight.'
        : isSleepCalculatorPage
          ? 'Use the Sleepfast sleep calculator to find better bedtimes based on 90-minute sleep cycles, then start sleep sounds right away in your browser.'
          : isNapCalculatorPage
            ? 'Use the Sleepfast nap calculator to see the best wake-up time for a 20, 30, or 90 minute nap, then move into a calmer browser reset right away.'
          : isSleepBreathingExercisePage
            ? 'Use a simple 4-7-8 sleep breathing exercise in your browser to calm down before bed, then move into Sleepfast sounds for the rest of the night.'
          : isFallAsleepFastPage
            ? 'Fall asleep fast with instant browser sleep sounds, a simple bedtime reset, and calmer steps for racing thoughts or noisy nights.'
            : isWakeUpAt3amPage
              ? 'Use Sleepfast to fall back asleep after waking up at 3AM with instant white noise, a short restart timer, and a calmer middle-of-the-night reset.'
              : isMindRacingAtNightPage
                ? 'Use Sleepfast when your mind is racing at night with instant brown noise, a simple timer, and a calmer reset built for overstimulated bedtimes.'
                : isSleepBetterTonightPage
                  ? 'Sleep better tonight with a simple browser bedtime reset, calming sleep sounds, and short next steps when your night already feels a little off.'
            : 'Sleepfast helps you fall asleep faster with calming sleep sounds, a simple timer, and problem-based bedtime tools right in your browser.'

    document.title = title

    const updateMeta = (selector: string, content: string) => {
      const element = document.querySelector<HTMLMetaElement>(selector)
      if (element) {
        element.content = content
      }
    }

    updateMeta('meta[name="description"]', description)
    updateMeta('meta[property="og:title"]', title)
    updateMeta('meta[property="og:description"]', description)
    updateMeta('meta[name="twitter:title"]', title)
    updateMeta('meta[name="twitter:description"]', description)
  }, [isBrownNoisePage, isFallAsleepFastPage, isMindRacingAtNightPage, isNapCalculatorPage, isOceanSoundsPage, isRainSoundsPage, isSleepBetterTonightPage, isSleepBreathingExercisePage, isSleepCalculatorPage, isWakeUpAt3amPage, isWhiteNoisePage])

  useEffect(() => {
    if (!breathingActive) return undefined

    const interval = window.setInterval(() => {
      setBreathingSecondsLeft((currentSecondsLeft) => {
        if (currentSecondsLeft > 1) {
          return currentSecondsLeft - 1
        }

        setBreathingStepIndex((currentIndex) => {
          const nextIndex = (currentIndex + 1) % breathingSteps.length

          if (nextIndex === 0) {
            setBreathingCycleCount((count) => count + 1)
          }

          setBreathingSecondsLeft(breathingSteps[nextIndex].seconds)
          return nextIndex
        })

        return currentSecondsLeft
      })
    }, 1000)

    return () => window.clearInterval(interval)
  }, [breathingActive])

  const toggleBreathingExercise = () => {
    if (breathingActive) {
      setBreathingActive(false)
      return
    }

    setBreathingStepIndex(0)
    setBreathingSecondsLeft(breathingSteps[0].seconds)
    setBreathingCycleCount(0)
    setBreathingActive(true)
  }

  const stopPlayback = () => {
    if (fadeOutTimeoutRef.current) {
      window.clearTimeout(fadeOutTimeoutRef.current)
      fadeOutTimeoutRef.current = null
    }

    activeNodesRef.current.forEach(({ source, filter, gain, modulator, modulationDepth }) => {
      source.stop?.()
      source.disconnect()
      filter?.disconnect()
      gain?.disconnect()
      modulator?.stop?.()
      modulator?.disconnect()
      modulationDepth?.disconnect()
    })
    activeNodesRef.current = []

    setIsPlaying(false)
  }

  const fadeOutAndStopPlayback = (durationMs = 1800) => {
    const context = audioContextRef.current
    const masterGain = masterGainRef.current

    if (!context || !masterGain || activeNodesRef.current.length === 0) {
      stopPlayback()
      return
    }

    if (fadeOutTimeoutRef.current) {
      window.clearTimeout(fadeOutTimeoutRef.current)
    }

    const now = context.currentTime
    masterGain.gain.cancelScheduledValues(now)
    masterGain.gain.setValueAtTime(masterGain.gain.value, now)
    masterGain.gain.linearRampToValueAtTime(0.0001, now + durationMs / 1000)

    fadeOutTimeoutRef.current = window.setTimeout(() => {
      stopPlayback()

      if (masterGainRef.current) {
        masterGainRef.current.gain.cancelScheduledValues(context.currentTime)
        masterGainRef.current.gain.value = volume
      }
    }, durationMs)
  }

  const ensureAudioGraph = () => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported in this browser.')
      }

      audioContextRef.current = new AudioContextClass()
      const masterGain = audioContextRef.current.createGain()
      masterGain.gain.value = volume
      masterGain.connect(audioContextRef.current.destination)
      masterGainRef.current = masterGain
    }

    return audioContextRef.current
  }

  const createNoiseBuffer = (context: AudioContext, color: 'white' | 'brown') => {
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate)
    const channel = buffer.getChannelData(0)

    if (color === 'white') {
      for (let i = 0; i < channel.length; i += 1) {
        channel[i] = Math.random() * 2 - 1
      }
      return buffer
    }

    let lastOut = 0
    for (let i = 0; i < channel.length; i += 1) {
      const white = Math.random() * 2 - 1
      lastOut = (lastOut + 0.02 * white) / 1.02
      channel[i] = lastOut * 3.5
    }

    return buffer
  }

  const startLayer = (context: AudioContext, soundId: SoundId, outputGain: GainNode) => {
    if (soundId === 'white' || soundId === 'brown') {
      const source = context.createBufferSource()
      source.buffer = createNoiseBuffer(context, soundId)
      source.loop = true

      const filter = context.createBiquadFilter()
      filter.type = soundId === 'brown' ? 'lowpass' : 'bandpass'
      filter.frequency.value = soundId === 'brown' ? 650 : 1800
      filter.Q.value = soundId === 'brown' ? 0.2 : 0.7

      source.connect(filter)
      filter.connect(outputGain)
      source.start()

      activeNodesRef.current.push({ source, filter, gain: outputGain })
      return
    }

    const source = context.createBufferSource()
    source.buffer = createNoiseBuffer(context, 'white')
    source.loop = true

    const filter = context.createBiquadFilter()
    filter.type = soundId === 'rain' ? 'lowpass' : 'bandpass'
    filter.frequency.value = soundId === 'rain' ? 1100 : 750
    filter.Q.value = soundId === 'rain' ? 0.4 : 1.3

    const shapedGain = context.createGain()
    shapedGain.gain.value = soundId === 'rain' ? 0.32 : 0.22

    source.connect(filter)
    filter.connect(shapedGain)
    shapedGain.connect(outputGain)

    const modulator = context.createOscillator()
    modulator.type = 'sine'
    modulator.frequency.value = soundId === 'rain' ? 0.11 : 0.07

    const modulationDepth = context.createGain()
    modulationDepth.gain.value = soundId === 'rain' ? 0.06 : 0.12

    modulator.connect(modulationDepth)
    modulationDepth.connect(shapedGain.gain)

    source.start()
    modulator.start()

    activeNodesRef.current.push({ source, filter, gain: shapedGain, modulator, modulationDepth })
  }

  const rebuildPlayback = async (soundIds: SoundId[]) => {
    const context = ensureAudioGraph()

    if (context.state === 'suspended') {
      await context.resume()
    }

    stopPlayback()

    const masterGain = masterGainRef.current
    if (!masterGain) return

    soundIds.forEach((soundId, index) => {
      const layerGain = context.createGain()
      const targetVolume = Math.min(Math.max(layerVolumes[soundId], 0), 1)
      layerGain.gain.value = index === 0 ? targetVolume : targetVolume * 0.78
      layerGain.connect(masterGain)
      startLayer(context, soundId, layerGain)
    })

    setIsPlaying(true)
  }

  const handleTogglePlayback = async () => {
    if (isPlaying) {
      stopPlayback()
      timerDeadlineRef.current = null
      setTimeLeftMs(null)
      return
    }

    await rebuildPlayback(activeLayerIds)
    timerDeadlineRef.current = Date.now() + timerMinutes * TIMER_SCALE_MS
    setTimeLeftMs(timerMinutes * TIMER_SCALE_MS)
  }

  const syncPlaybackAfterChange = async (nextLayerIds: SoundId[]) => {
    if (!isPlaying) return

    await rebuildPlayback(nextLayerIds)
    if (timerDeadlineRef.current) {
      setTimeLeftMs(Math.max(timerDeadlineRef.current - Date.now(), 0))
    }
  }

  const applyScenario = async (scenario: Scenario) => {
    setSelectedScenario(scenario.id)
    setSelectedSound(scenario.soundId)
    setTimerMinutes(scenario.timer)
    setSupportSoundIds([])

    if (isPlaying) {
      await rebuildPlayback([scenario.soundId])
      timerDeadlineRef.current = Date.now() + scenario.timer * TIMER_SCALE_MS
      setTimeLeftMs(scenario.timer * TIMER_SCALE_MS)
    }
  }

  const toggleSupportSound = async (soundId: SoundId) => {
    const isActive = supportSoundIds.includes(soundId)
    const nextSupportSoundIds = isActive
      ? supportSoundIds.filter((id) => id !== soundId)
      : [...supportSoundIds.slice(-1), soundId]

    setSupportSoundIds(nextSupportSoundIds)
    await syncPlaybackAfterChange([selectedSound, ...nextSupportSoundIds])
  }

  const updateLayerVolume = async (soundId: SoundId, nextVolume: number) => {
    const normalizedVolume = Math.min(Math.max(nextVolume, 0), 1)
    const nextVolumes = { ...layerVolumes, [soundId]: normalizedVolume }
    const nextLayerIds = activeLayerIds.map((layerId) => layerId)
    setLayerVolumes(nextVolumes)

    if (isPlaying) {
      await rebuildPlayback(nextLayerIds)
      if (timerDeadlineRef.current) {
        setTimeLeftMs(Math.max(timerDeadlineRef.current - Date.now(), 0))
      }
    }
  }

  const toggleFavoriteSound = (soundId: SoundId) => {
    setFavoriteSoundIds((current) =>
      current.includes(soundId) ? current.filter((id) => id !== soundId) : pushUniqueSound(current, soundId),
    )
  }

  const startSavedSound = async (soundId: SoundId) => {
    setSelectedSound(soundId)
    setSelectedScenario('cant-sleep')
    setSupportSoundIds([])

    if (isPlaying) {
      await rebuildPlayback([soundId])
      if (timerDeadlineRef.current) {
        setTimeLeftMs(Math.max(timerDeadlineRef.current - Date.now(), 0))
      }
      return
    }

    await rebuildPlayback([soundId])
    timerDeadlineRef.current = Date.now() + timerMinutes * TIMER_SCALE_MS
    setTimeLeftMs(timerMinutes * TIMER_SCALE_MS)
  }

  const startBreathingFollowUp = async (soundId: SoundId, timer: TimerOption, scenarioId: Scenario['id']) => {
    setBreathingActive(false)
    setBreathingStepIndex(0)
    setBreathingSecondsLeft(breathingSteps[0].seconds)
    setSelectedScenario(scenarioId)
    setSelectedSound(soundId)
    setTimerMinutes(timer)
    setSupportSoundIds([])

    await rebuildPlayback([soundId])
    timerDeadlineRef.current = Date.now() + timer * TIMER_SCALE_MS
    setTimeLeftMs(timer * TIMER_SCALE_MS)
  }

  const handleTimerOptionSelect = (nextTimerMinutes: TimerOption) => {
    setTimerMinutes(nextTimerMinutes)
    if (isPlaying) {
      timerDeadlineRef.current = Date.now() + nextTimerMinutes * TIMER_SCALE_MS
      setTimeLeftMs(nextTimerMinutes * TIMER_SCALE_MS)
    }
  }

  const handleCustomTimerApply = () => {
    const nextTimerMinutes = readCustomTimerMinutes(customTimerMinutes)
    setCustomTimerMinutes(`${nextTimerMinutes}`)
    handleTimerOptionSelect(nextTimerMinutes)
  }

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume
    }
  }, [volume])

  useEffect(() => {
    if (!isPlaying || timeLeftMs === null) {
      return undefined
    }

    const interval = window.setInterval(() => {
      if (!timerDeadlineRef.current) return

      const remaining = Math.max(timerDeadlineRef.current - Date.now(), 0)
      setTimeLeftMs(remaining)

      if (remaining <= 0) {
        timerDeadlineRef.current = null
        setTimeLeftMs(null)
        fadeOutAndStopPlayback()
      }
    }, 250)

    return () => window.clearInterval(interval)
  }, [isPlaying, timeLeftMs])

  useEffect(() => {
    return () => {
      stopPlayback()
      audioContextRef.current?.close()
    }
  }, [])

  const handleEmailSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email.trim()) return
    setEmailSubmitted(true)
  }

  if (isNoiseToolPage) {
    const toolTitle = isWhiteNoisePage ? 'White noise for sleep' : 'Brown noise for sleep'
    const toolHeroTitle = isWhiteNoisePage
      ? 'Block late-night sounds and drift back faster.'
      : 'Soften racing thoughts and settle into sleep faster.'
    const toolTagline = isWhiteNoisePage
      ? 'white noise for lighter sleepers'
      : 'brown noise for racing minds'
    const toolSubtitle = isWhiteNoisePage
      ? 'Play steady white noise instantly in your browser for light sleep, noisy apartments, and those wakeups where every little sound suddenly feels too sharp.'
      : 'Play deeper brown noise instantly in your browser for overstimulated nights, city hum, and the kind of mental chatter that keeps your body tired but alert.'
    const toolBenefits = isWhiteNoisePage
      ? ['Instant browser playback', 'Better for light sleepers', 'Simple rest timer']
      : ['Instant browser playback', 'Better for racing thoughts', 'Simple rest timer']
    const toolQuietLine = isWhiteNoisePage
      ? 'Best for light sleepers, city apartments, shared walls, and 3 AM wakeups that need a softer reset.'
      : 'Best for busy minds, low-frequency city noise, and bedtime stretches where silence feels too exposed.'
    const toolNowPlayingTitle = isWhiteNoisePage ? 'White Noise' : 'Brown Noise'
    const toolNowPlayingNote = isWhiteNoisePage
      ? 'A steady broadband layer that helps mask sudden sound changes before they pull you fully awake.'
      : 'A deeper low-end layer that feels less sharp than white noise when your thoughts need something heavier to lean against.'
    const toolPlayLabel = isWhiteNoisePage ? 'Play white noise now' : 'Play brown noise now'
    const toolPauseLabel = isWhiteNoisePage ? 'Pause white noise' : 'Pause brown noise'
    const toolKeepLabel = isWhiteNoisePage ? 'Keep this running' : 'Keep this grounding layer'
    const toolWhyTitle = isWhiteNoisePage ? 'Why white noise helps with sleep' : 'Why brown noise helps with sleep'
    const toolWhyParagraphOne = isWhiteNoisePage
      ? 'White noise spreads evenly across frequencies, which makes it useful for masking sharp changes like traffic, hallway noise, or a partner moving around beside you.'
      : 'Brown noise leans heavier into lower frequencies, which can feel smoother and less piercing when your nervous system already feels overloaded at bedtime.'
    const toolWhyParagraphTwo = isWhiteNoisePage
      ? 'If your sleep gets interrupted by little sounds more than by racing thoughts, white noise is often the simplest place to start.'
      : 'If your problem is less about tiny sounds and more about mental static, brown noise is often the calmer place to start.'
    const toolWhenTitle = isWhiteNoisePage ? 'When to use it' : 'When brown noise usually fits better'
    const toolWhenItems = isWhiteNoisePage
      ? [
          'When you fall asleep lightly and wake easily to background noise.',
          'When city noise, shared walls, or hallway sounds keep breaking the room open.',
          'When you wake up at 3 AM and need one steady layer before trying to drift back.',
        ]
      : [
          'When your mind keeps looping even though your body feels tired.',
          'When higher, sharper sounds feel irritating and you want a deeper texture instead.',
          'When city hum, HVAC rumble, or internal restlessness make silence feel too loud.',
        ]
    const faqItems = isWhiteNoisePage
      ? [
          {
            q: 'Is white noise better than rain sounds?',
            a: 'Usually for masking sudden background noise, yes. Rain can feel softer emotionally, but white noise is often stronger for consistent sound coverage.',
          },
          {
            q: 'Can I use this after waking up in the middle of the night?',
            a: 'Yes. This page is built for quick restarts too — press play, set a short timer, and avoid over-adjusting once it feels steady.',
          },
          {
            q: 'What if white noise feels too bright?',
            a: 'Try brown noise from Sleepfast next. It has more low-end weight and can feel gentler when your mind feels overstimulated instead of just noise-sensitive.',
          },
        ]
      : [
          {
            q: 'Is brown noise better than white noise?',
            a: 'Not always. Brown noise usually feels softer and deeper, while white noise is stronger for masking sharper outside sounds. The better choice depends on whether your problem is mental chatter or external noise.',
          },
          {
            q: 'Can brown noise help with racing thoughts?',
            a: 'It can help some people because the lower tone feels more grounding and less busy. It will not solve anxiety on its own, but it can make the room feel easier to settle into.',
          },
          {
            q: 'What if I need a cleaner masking sound?',
            a: 'Switch to Sleepfast white noise when the issue is more about neighbors, traffic, or sudden household sounds than about your own mind staying active.',
          },
        ]
    const ctaTitle = isWhiteNoisePage
      ? 'Need something gentler than plain white noise?'
      : 'Need a softer reset than brown noise alone?'
    const ctaCopy = isWhiteNoisePage
      ? "Go back to the full Sleepfast experience for rain, ocean, brown noise, and softer bedtime framing built for tonight's specific kind of restless."
      : "Go back to the full Sleepfast experience for rain, ocean, white noise, and softer bedtime framing built for tonight's specific kind of restless."

    return (
      <main className="app-shell tool-shell">
        <section className="tool-hero rain-stage">
          <div className="top-brandbar">
            <a className="brand-lockup" aria-label="Sleepfast home" href="/">
              <CatMark className="brand-cat" />
              <div className="brand-copy">
                <span className="brand-name">Sleepfast</span>
                <span className="brand-tag">{toolTagline}</span>
              </div>
            </a>
          </div>

          <div className="rain-backdrop tool-backdrop" aria-hidden="true">
            <div className="night-vignette" />
            <div className="mist mist-left" />
            <div className="mist mist-right" />
            <div className="city-glow" />
            <div className="window-sheen" />
          </div>

          <div className="tool-layout">
            <section className="tool-copy glass-panel">
              <span className="eyebrow">{toolTitle}</span>
              <h1>{toolHeroTitle}</h1>
              <p className="hero-text tool-subtitle">
                {toolSubtitle}
              </p>
              <div className="result-pills" aria-label={`${toolTitle} benefits`}>
                {toolBenefits.map((benefit) => (
                  <span key={benefit}>{benefit}</span>
                ))}
              </div>
              <div className="cta-row">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedSound(isWhiteNoisePage ? 'white' : 'brown')
                    await handleTogglePlayback()
                  }}
                >
                  {isPlaying && selectedSound === (isWhiteNoisePage ? 'white' : 'brown') ? toolPauseLabel : toolPlayLabel}
                </button>
                <a className="text-link" href="/">
                  Try the full Sleepfast homepage
                </a>
              </div>
              <p className="quiet-line tool-quiet-line">{toolQuietLine}</p>
            </section>

            <aside className="player-card player-card-healing glass-panel tool-player-card">
              <div className="now-playing now-playing-minimal">
                <span className="player-kicker">Now playing</span>
                <h2>{toolNowPlayingTitle}</h2>
                <p className="comfort-note">{toolNowPlayingNote}</p>
              </div>

              <div className="utility-row utility-row-saved">
                <button
                  type="button"
                  className={`utility-chip ${favoriteSoundIds.includes(isWhiteNoisePage ? 'white' : 'brown') ? 'active' : ''}`}
                  onClick={() => toggleFavoriteSound(isWhiteNoisePage ? 'white' : 'brown')}
                >
                  {favoriteSoundIds.includes(isWhiteNoisePage ? 'white' : 'brown') ? 'Saved for later' : 'Save this sound'}
                </button>
              </div>

              <div className="player-footer player-footer-artful player-footer-healing player-footer-single">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedSound(isWhiteNoisePage ? 'white' : 'brown')
                    await handleTogglePlayback()
                  }}
                >
                  {toolKeepLabel}
                </button>
              </div>

              <div className="control-drawer glass-subpanel control-drawer-healing control-drawer-open">
                <div className="player-controls">
                  <div className="timer-block timer-block-minimal">
                    <div className="timer-label-row timer-label-row-minimal">
                      <strong>Rest timer</strong>
                      <span>{formatTimerLabel(timeLeftMs, timerMinutes)}</span>
                    </div>
                    <div className="timer-row">
                      {timerOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={option === timerMinutes ? 'active' : ''}
                          onClick={() => {
                            handleTimerOptionSelect(option)
                          }}
                        >
                          {option} min
                        </button>
                      ))}
                    </div>
                    <div className="custom-timer-row">
                      <label className="custom-timer-label" htmlFor="custom-timer-minutes">
                        Custom minutes
                      </label>
                      <div className="custom-timer-input-wrap">
                        <input
                          id="custom-timer-minutes"
                          className="custom-timer-input"
                          inputMode="numeric"
                          min={1}
                          max={180}
                          step={1}
                          type="number"
                          value={customTimerMinutes}
                          onChange={(event) => {
                            setCustomTimerMinutes(event.target.value)
                          }}
                          onBlur={() => {
                            setCustomTimerMinutes(getCustomTimerValue(customTimerMinutes))
                          }}
                        />
                        <button type="button" className="custom-timer-apply" onClick={handleCustomTimerApply}>
                          Use custom
                        </button>
                      </div>
                      <span className="custom-timer-note">Use 1–180 minutes for naps, longer drift, or travel recovery.</span>
                    </div>
                  </div>
                </div>

                <div className="saved-panel glass-subpanel">
                  <div className="saved-panel-section">
                    <div className="saved-panel-header">
                      <strong>Saved for later</strong>
                      <span>Keep go-to sounds one tap away.</span>
                    </div>
                    <div className="saved-chip-row">
                      {favoriteSounds.length > 0 ? (
                        favoriteSounds.map((sound) => (
                          <button key={sound.id} type="button" className="saved-sound-chip" onClick={() => void startSavedSound(sound.id)}>
                            {sound.name}
                          </button>
                        ))
                      ) : (
                        <p className="saved-empty-state">Save this sound once and it will stay ready for tomorrow night.</p>
                      )}
                    </div>
                  </div>

                  <div className="saved-panel-section">
                    <div className="saved-panel-header">
                      <strong>Recent tonight</strong>
                      <span>Restart the last room you used.</span>
                    </div>
                    <div className="saved-chip-row">
                      {recentSounds.length > 0 ? (
                        recentSounds.map((sound) => (
                          <button key={sound.id} type="button" className="saved-sound-chip" onClick={() => void startSavedSound(sound.id)}>
                            {sound.name}
                          </button>
                        ))
                      ) : (
                        <p className="saved-empty-state">Play one sound once and it will show up here for faster restarts.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="tool-sections">
          <section className="tool-section glass-panel">
            <h2>{toolWhyTitle}</h2>
            <p>{toolWhyParagraphOne}</p>
            <p>{toolWhyParagraphTwo}</p>
          </section>

          <section className="tool-section glass-panel">
            <h2>{toolWhenTitle}</h2>
            <ul className="tool-list">
              {toolWhenItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="tool-section glass-panel">
            <h2>FAQ</h2>
            <div className="faq-list">
              {faqItems.map((item) => (
                <div key={item.q}>
                  <h3>{item.q}</h3>
                  <p>{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="tool-section glass-panel related-tools-panel">
            <h2>More Sleepfast tools for tonight</h2>
            <div className="related-tools-grid">
              {relatedToolLinks.map((tool) => (
                <a key={tool.href} className="related-tool-link glass-subpanel" href={tool.href}>
                  <span className="related-tool-kicker">{tool.kicker}</span>
                  <strong>{tool.title}</strong>
                  <p>{tool.description}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="conversion-story glass-panel tool-cta-panel">
            <div className="conversion-intro">
              <span className="eyebrow">Keep going with Sleepfast</span>
              <h2>{ctaTitle}</h2>
              <p>{ctaCopy}</p>
            </div>
            <div className="tool-cta-actions">
              <a className="link-button" href="/">
                Open the full Sleepfast player
              </a>
            </div>
          </section>
        </section>
      </main>
    )
  }

  if (isRainSoundsPage) {
    return (
      <main className="app-shell tool-shell">
        <section className="tool-hero rain-stage">
          <div className="top-brandbar">
            <a className="brand-lockup" aria-label="Sleepfast home" href="/">
              <CatMark className="brand-cat" />
              <div className="brand-copy">
                <span className="brand-name">Sleepfast</span>
                <span className="brand-tag">rain sounds for sleep</span>
              </div>
            </a>
          </div>

          <div className="rain-backdrop rain-backdrop-window tool-backdrop" aria-hidden="true">
            <div className="night-vignette" />
            <div className="mist mist-left" />
            <div className="mist mist-right" />
            <div className="city-glow" />
            <div className="window-sheen" />
            <div className="window-frame frame-left" />
            <div className="window-frame frame-right" />
            <div className="window-frame frame-top" />
            <div className="rain-layer rain-layer-soft" />
          </div>

          <div className="tool-layout">
            <section className="tool-copy glass-panel">
              <span className="eyebrow">Rain sounds for sleep</span>
              <h1>Let a softer rain layer carry the room into sleep.</h1>
              <p className="hero-text tool-subtitle">
                Play filtered rain instantly in your browser when you want bedtime to feel dimmer, quieter, and less mentally sharp than silence or a busier room.
              </p>
              <div className="result-pills" aria-label="Rain sounds for sleep benefits">
                <span>Instant browser playback</span>
                <span>Better for winding down</span>
                <span>Simple 10 to 60 minute timer</span>
              </div>
              <div className="cta-row">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedSound('rain')
                    await handleTogglePlayback()
                  }}
                >
                  {isPlaying && selectedSound === 'rain' ? 'Pause the rain layer' : 'Play rain sounds now'}
                </button>
                <a className="text-link" href="/">
                  Try the full Sleepfast homepage
                </a>
              </div>
              <p className="quiet-line tool-quiet-line">
                Best for bedtime wind-downs, light stress, and nights when you want something softer than plain noise but steadier than silence.
              </p>
            </section>

            <aside className="player-card player-card-healing glass-panel tool-player-card">
              <div className="now-playing now-playing-minimal">
                <span className="player-kicker">Now playing</span>
                <h2>Rain on Window</h2>
                <p className="comfort-note">
                  A filtered rain layer that softens the edges of the room without feeling too bright, too neutral, or too active.
                </p>
              </div>

              <div className="utility-row utility-row-saved">
                <button
                  type="button"
                  className={`utility-chip ${favoriteSoundIds.includes('rain') ? 'active' : ''}`}
                  onClick={() => toggleFavoriteSound('rain')}
                >
                  {favoriteSoundIds.includes('rain') ? 'Saved for later' : 'Save this sound'}
                </button>
              </div>

              <div className="player-footer player-footer-artful player-footer-healing player-footer-single">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedSound('rain')
                    await handleTogglePlayback()
                  }}
                >
                  {isPlaying && selectedSound === 'rain' ? 'Keep the room steady' : 'Keep this rain nearby'}
                </button>
              </div>

              <div className="control-drawer glass-subpanel control-drawer-healing control-drawer-open">
                <div className="player-controls">
                  <div className="timer-block timer-block-minimal">
                    <div className="timer-label-row timer-label-row-minimal">
                      <strong>Rest timer</strong>
                      <span>{formatTimerLabel(timeLeftMs, timerMinutes)}</span>
                    </div>
                    <div className="timer-row">
                      {timerOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={option === timerMinutes ? 'active' : ''}
                          onClick={() => {
                            handleTimerOptionSelect(option)
                          }}
                        >
                          {option} min
                        </button>
                      ))}
                    </div>
                    <div className="custom-timer-row">
                      <label className="custom-timer-label" htmlFor="custom-timer-minutes">
                        Custom minutes
                      </label>
                      <div className="custom-timer-input-wrap">
                        <input
                          id="custom-timer-minutes"
                          className="custom-timer-input"
                          inputMode="numeric"
                          min={1}
                          max={180}
                          step={1}
                          type="number"
                          value={customTimerMinutes}
                          onChange={(event) => {
                            setCustomTimerMinutes(event.target.value)
                          }}
                          onBlur={() => {
                            setCustomTimerMinutes(getCustomTimerValue(customTimerMinutes))
                          }}
                        />
                        <button type="button" className="custom-timer-apply" onClick={handleCustomTimerApply}>
                          Use custom
                        </button>
                      </div>
                      <span className="custom-timer-note">Use 1–180 minutes for naps, longer drift, or travel recovery.</span>
                    </div>
                  </div>
                </div>

                <div className="saved-panel glass-subpanel">
                  <div className="saved-panel-section">
                    <div className="saved-panel-header">
                      <strong>Saved for later</strong>
                      <span>Keep your go-to rain layer one tap away.</span>
                    </div>
                    <div className="saved-chip-row">
                      {favoriteSounds.length > 0 ? (
                        favoriteSounds.map((sound) => (
                          <button key={sound.id} type="button" className="saved-sound-chip" onClick={() => void startSavedSound(sound.id)}>
                            {sound.name}
                          </button>
                        ))
                      ) : (
                        <p className="saved-empty-state">Save this sound once and it will stay ready for tomorrow night.</p>
                      )}
                    </div>
                  </div>

                  <div className="saved-panel-section">
                    <div className="saved-panel-header">
                      <strong>Recent tonight</strong>
                      <span>Restart the last room you used.</span>
                    </div>
                    <div className="saved-chip-row">
                      {recentSounds.length > 0 ? (
                        recentSounds.map((sound) => (
                          <button key={sound.id} type="button" className="saved-sound-chip" onClick={() => void startSavedSound(sound.id)}>
                            {sound.name}
                          </button>
                        ))
                      ) : (
                        <p className="saved-empty-state">Play one sound once and it will show up here for faster restarts.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="tool-sections">
          <section className="tool-section glass-panel">
            <h2>Why rain sounds help with sleep</h2>
            <p>
              Rain often works well because it gives the room motion without demanding attention. It feels softer than silence, but it also does not hit as evenly or as sharply as white noise.
            </p>
            <p>
              That makes it a strong wind-down sound when your goal is not only masking noise, but also helping bedtime feel less exposed and less effortful.
            </p>
          </section>

          <section className="tool-section glass-panel">
            <h2>When rain sounds usually fit best</h2>
            <ul className="tool-list">
              <li>When you want a softer bedtime transition instead of a more neutral masking layer.</li>
              <li>When stress is present, but the room itself also feels too sharp or too empty.</li>
              <li>When you want a calming sound before moving into deeper sleep or longer overnight playback later.</li>
            </ul>
          </section>

          <section className="tool-section glass-panel">
            <h2>FAQ</h2>
            <div className="faq-list">
              <div>
                <h3>Are rain sounds better than white noise for sleep?</h3>
                <p>Usually for emotional wind-down, yes. For stronger masking against sharp outside sounds, white noise can still work better.</p>
              </div>
              <div>
                <h3>Can I use rain sounds if my mind is racing?</h3>
                <p>Yes, especially if you want something softer before trying brown noise or a breathing reset. Rain can make the room feel less exposed while you settle.</p>
              </div>
              <div>
                <h3>How long should I leave rain sounds on?</h3>
                <p>Start with 20 to 30 minutes for bedtime wind-down. Go longer when you want a more gradual transition or know you wake easily in the first hour.</p>
              </div>
            </div>
          </section>

          <section className="tool-section glass-panel related-tools-panel">
            <h2>More Sleepfast tools for tonight</h2>
            <div className="related-tools-grid">
              {relatedToolLinks.map((tool) => (
                <a key={tool.href} className="related-tool-link glass-subpanel" href={tool.href}>
                  <span className="related-tool-kicker">{tool.kicker}</span>
                  <strong>{tool.title}</strong>
                  <p>{tool.description}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="conversion-story glass-panel tool-cta-panel">
            <div className="conversion-intro">
              <span className="eyebrow">Keep going with Sleepfast</span>
              <h2>Need a broader bedtime reset than rain alone?</h2>
              <p>
                Go back to the full Sleepfast player for rain, ocean, white noise, brown noise, and a calmer homepage flow built for different kinds of restless nights.
              </p>
            </div>
            <div className="tool-cta-actions">
              <a className="link-button" href="/">
                Open the full Sleepfast player
              </a>
            </div>
          </section>
        </section>
      </main>
    )
  }

  if (isOceanSoundsPage) {
    return (
      <main className="app-shell tool-shell">
        <section className="tool-hero rain-stage">
          <div className="top-brandbar">
            <a className="brand-lockup" aria-label="Sleepfast home" href="/">
              <CatMark className="brand-cat" />
              <div className="brand-copy">
                <span className="brand-name">Sleepfast</span>
                <span className="brand-tag">ocean sounds for sleep</span>
              </div>
            </a>
          </div>

          <div className="rain-backdrop ocean-backdrop tool-backdrop" aria-hidden="true">
            <div className="night-vignette ocean-vignette" />
            <div className="mist mist-left ocean-mist-left" />
            <div className="mist mist-right ocean-mist-right" />
            <div className="moon-glow" />
            <div className="ocean-horizon" />
            <div className="ocean-wave-layer ocean-wave-back" />
            <div className="ocean-wave-layer ocean-wave-mid" />
            <div className="ocean-wave-layer ocean-wave-front" />
            <div className="ocean-foam" />
          </div>

          <div className="tool-layout">
            <section className="tool-copy glass-panel">
              <span className="eyebrow">Ocean sounds for sleep</span>
              <h1>Let a slower shoreline carry you into deeper sleep.</h1>
              <p className="hero-text tool-subtitle">
                Play ocean sounds instantly in your browser when you want a steadier, room-filling layer that feels slower than rain and softer than chasing silence.
              </p>
              <div className="result-pills" aria-label="Ocean sounds for sleep benefits">
                <span>Instant browser playback</span>
                <span>Better for longer unwinding</span>
                <span>Simple 10 to 60 minute timer</span>
              </div>
              <div className="cta-row">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedSound('ocean')
                    await handleTogglePlayback()
                  }}
                >
                  {isPlaying && selectedSound === 'ocean' ? 'Pause the shoreline' : 'Play ocean sounds now'}
                </button>
                <a className="text-link" href="/">
                  Try the full Sleepfast homepage
                </a>
              </div>
              <p className="quiet-line tool-quiet-line">
                Best for longer wind-downs, deeper exhale moments, and nights when you want the room to feel broad, slow, and less mentally busy.
              </p>
            </section>

            <aside className="player-card player-card-healing glass-panel tool-player-card">
              <div className="now-playing now-playing-minimal">
                <span className="player-kicker">Now playing</span>
                <h2>Ocean Waves</h2>
                <p className="comfort-note">
                  A moonlit shoreline layer that moves slowly enough to feel immersive without turning bedtime into another thing to manage.
                </p>
              </div>

              <div className="utility-row utility-row-saved">
                <button
                  type="button"
                  className={`utility-chip ${favoriteSoundIds.includes('ocean') ? 'active' : ''}`}
                  onClick={() => toggleFavoriteSound('ocean')}
                >
                  {favoriteSoundIds.includes('ocean') ? 'Saved for later' : 'Save this sound'}
                </button>
              </div>

              <div className="player-footer player-footer-artful player-footer-healing player-footer-single">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedSound('ocean')
                    await handleTogglePlayback()
                  }}
                >
                  {isPlaying && selectedSound === 'ocean' ? 'Keep the shoreline slow' : 'Stay with the shoreline'}
                </button>
              </div>

              <div className="control-drawer glass-subpanel control-drawer-healing control-drawer-open">
                <div className="player-controls">
                  <div className="timer-block timer-block-minimal">
                    <div className="timer-label-row timer-label-row-minimal">
                      <strong>Rest timer</strong>
                      <span>{formatTimerLabel(timeLeftMs, timerMinutes)}</span>
                    </div>
                    <div className="timer-row">
                      {timerOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={option === timerMinutes ? 'active' : ''}
                          onClick={() => {
                            handleTimerOptionSelect(option)
                          }}
                        >
                          {option} min
                        </button>
                      ))}
                    </div>
                    <div className="custom-timer-row">
                      <label className="custom-timer-label" htmlFor="custom-timer-minutes">
                        Custom minutes
                      </label>
                      <div className="custom-timer-input-wrap">
                        <input
                          id="custom-timer-minutes"
                          className="custom-timer-input"
                          inputMode="numeric"
                          min={1}
                          max={180}
                          step={1}
                          type="number"
                          value={customTimerMinutes}
                          onChange={(event) => {
                            setCustomTimerMinutes(event.target.value)
                          }}
                          onBlur={() => {
                            setCustomTimerMinutes(getCustomTimerValue(customTimerMinutes))
                          }}
                        />
                        <button type="button" className="custom-timer-apply" onClick={handleCustomTimerApply}>
                          Use custom
                        </button>
                      </div>
                      <span className="custom-timer-note">Use 1–180 minutes for naps, longer drift, or travel recovery.</span>
                    </div>
                  </div>
                </div>

                <div className="saved-panel glass-subpanel">
                  <div className="saved-panel-section">
                    <div className="saved-panel-header">
                      <strong>Saved for later</strong>
                      <span>Keep your calmest shoreline one tap away.</span>
                    </div>
                    <div className="saved-chip-row">
                      {favoriteSounds.length > 0 ? (
                        favoriteSounds.map((sound) => (
                          <button key={sound.id} type="button" className="saved-sound-chip" onClick={() => void startSavedSound(sound.id)}>
                            {sound.name}
                          </button>
                        ))
                      ) : (
                        <p className="saved-empty-state">Save this sound once and it will stay ready for tomorrow night.</p>
                      )}
                    </div>
                  </div>

                  <div className="saved-panel-section">
                    <div className="saved-panel-header">
                      <strong>Recent tonight</strong>
                      <span>Restart the last room you used.</span>
                    </div>
                    <div className="saved-chip-row">
                      {recentSounds.length > 0 ? (
                        recentSounds.map((sound) => (
                          <button key={sound.id} type="button" className="saved-sound-chip" onClick={() => void startSavedSound(sound.id)}>
                            {sound.name}
                          </button>
                        ))
                      ) : (
                        <p className="saved-empty-state">Play one sound once and it will show up here for faster restarts.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="tool-sections">
          <section className="tool-section glass-panel">
            <h2>Why ocean sounds help with sleep</h2>
            <p>
              Ocean sound can work well when you want something immersive but not too busy. The slower pulse gives your attention one broad rhythm to lean on without the sharper texture of white noise.
            </p>
            <p>
              That often makes it a strong fit for longer wind-downs, full-body unwinding, and nights when you want the room to feel expansive instead of empty.
            </p>
          </section>

          <section className="tool-section glass-panel">
            <h2>When ocean sounds usually fit best</h2>
            <ul className="tool-list">
              <li>When you want a slower, broader sound than rain for deeper relaxation before sleep.</li>
              <li>When silence feels too exposed, but sharper masking sounds feel too active for your nervous system.</li>
              <li>When you want a longer bedtime drift instead of a quick 3AM restart.</li>
            </ul>
          </section>

          <section className="tool-section glass-panel">
            <h2>FAQ</h2>
            <div className="faq-list">
              <div>
                <h3>Are ocean sounds better than rain for sleep?</h3>
                <p>Usually when you want a slower and more spacious feeling, yes. Rain is often better for softer emotional wind-down, while ocean can feel broader and steadier for a longer drift.</p>
              </div>
              <div>
                <h3>Can ocean sounds help if outside noise keeps waking me up?</h3>
                <p>They can help with general atmosphere, but white noise is still usually stronger if your main problem is sharp or sudden outside sound.</p>
              </div>
              <div>
                <h3>How long should I leave ocean sounds on?</h3>
                <p>Start with 30 to 45 minutes when you want a longer wind-down. Go shorter when you mainly need help crossing into sleep and longer only if the early part of the night feels fragile.</p>
              </div>
            </div>
          </section>

          <section className="tool-section glass-panel related-tools-panel">
            <h2>More Sleepfast tools for tonight</h2>
            <div className="related-tools-grid">
              {relatedToolLinks.map((tool) => (
                <a key={tool.href} className="related-tool-link glass-subpanel" href={tool.href}>
                  <span className="related-tool-kicker">{tool.kicker}</span>
                  <strong>{tool.title}</strong>
                  <p>{tool.description}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="conversion-story glass-panel tool-cta-panel">
            <div className="conversion-intro">
              <span className="eyebrow">Keep going with Sleepfast</span>
              <h2>Need a faster restart or a deeper mask than ocean alone?</h2>
              <p>
                Go back to the full Sleepfast player for rain, white noise, brown noise, and calmer bedtime flows built for different kinds of restless nights.
              </p>
            </div>
            <div className="tool-cta-actions">
              <a className="link-button" href="/">
                Open the full Sleepfast player
              </a>
            </div>
          </section>
        </section>
      </main>
    )
  }

  if (isSleepCalculatorPage) {
    return (
      <main className="app-shell tool-shell">
        <section className="tool-hero rain-stage">
          <div className="top-brandbar">
            <a className="brand-lockup" aria-label="Sleepfast home" href="/">
              <CatMark className="brand-cat" />
              <div className="brand-copy">
                <span className="brand-name">Sleepfast</span>
                <span className="brand-tag">sleep calculator</span>
              </div>
            </a>
          </div>

          <div className="rain-backdrop tool-backdrop" aria-hidden="true">
            <div className="night-vignette" />
            <div className="mist mist-left" />
            <div className="mist mist-right" />
            <div className="city-glow" />
            <div className="window-sheen" />
          </div>

          <div className="tool-layout">
            <section className="tool-copy glass-panel">
              <span className="eyebrow">Sleep calculator</span>
              <h1>Find a bedtime that fits real sleep cycles.</h1>
              <p className="hero-text tool-subtitle">
                Pick when you want to wake up and get bedtime targets built around 90-minute sleep cycles, with a 15-minute buffer to actually fall asleep.
              </p>
              <div className="result-pills" aria-label="Sleep calculator benefits">
                <span>Instant bedtime targets</span>
                <span>Built around sleep cycles</span>
                <span>Works for tonight</span>
              </div>
              <div className="cta-row">
                <a className="link-button" href="#sleep-calculator-tool">
                  Use the calculator
                </a>
                <a className="text-link" href="/">
                  Try the full Sleepfast homepage
                </a>
              </div>
              <p className="quiet-line tool-quiet-line">
                Best when you want a quick bedtime answer without opening another app or overthinking the math.
              </p>
            </section>

            <aside className="player-card player-card-healing glass-panel tool-player-card sleep-calculator-card" id="sleep-calculator-tool">
              <div className="now-playing now-playing-minimal">
                <span className="player-kicker">Wake-up goal</span>
                <h2>{formatMinutesForHumans(timeInputToMinutes(wakeTime))}</h2>
                <p className="comfort-note">Choose the time you want to get up. Sleepfast will suggest bedtimes that line up with full sleep cycles instead of random guesses.</p>
              </div>

              <div className="sleep-calculator-input glass-subpanel">
                <label htmlFor="wake-time">Wake up at</label>
                <input
                  id="wake-time"
                  type="time"
                  value={wakeTime}
                  onChange={(event) => setWakeTime(event.target.value)}
                />
                <p>
                  Assumes about {FALL_ASLEEP_BUFFER_MINUTES} minutes to fall asleep and {SLEEP_CYCLE_MINUTES}-minute sleep cycles.
                </p>
              </div>

              <div className="sleep-cycle-list">
                {sleepCycles.map((cycle, index) => (
                  <div className={`sleep-cycle-item glass-subpanel ${index === 0 ? 'recommended' : ''}`} key={cycle.label}>
                    <div>
                      <span className="sleep-cycle-kicker">{index === 0 ? 'Recommended' : 'Also works'}</span>
                      <strong>{cycle.bedtime}</strong>
                    </div>
                    <p>
                      Aim to be asleep by {cycle.sleepTime} for {cycle.label} before your wake-up time.
                    </p>
                  </div>
                ))}
              </div>

              <div className="player-footer player-footer-artful player-footer-healing player-footer-single">
                <a className="link-button" href="/">
                  Start sleep sounds for tonight
                </a>
              </div>
            </aside>
          </div>
        </section>

        <section className="tool-sections">
          <section className="tool-section glass-panel">
            <h2>How this sleep calculator works</h2>
            <p>
              Most sleep calculators count backward in 90-minute blocks because a full sleep cycle often moves through light, deep, and REM sleep in about that range.
            </p>
            <p>
              Sleepfast also adds a short fall-asleep buffer, so the bedtime you see is closer to when you should get in bed, not the exact minute your eyes close.
            </p>
          </section>

          <section className="tool-section glass-panel">
            <h2>When to use it</h2>
            <ul className="tool-list">
              <li>When you know what time you need to wake up and want a realistic bedtime target.</li>
              <li>When you want to avoid waking up in the middle of a deep sleep stretch.</li>
              <li>When you need a simple tonight-only answer, not a full sleep tracking system.</li>
            </ul>
          </section>

          <section className="tool-section glass-panel">
            <h2>FAQ</h2>
            <div className="faq-list">
              <div>
                <h3>Is 90 minutes exact for everyone?</h3>
                <p>No. Sleep cycles vary by person, but 90 minutes is a useful planning baseline when you want a practical bedtime estimate fast.</p>
              </div>
              <div>
                <h3>Why does this add 15 minutes?</h3>
                <p>Because most people do not fall asleep the second they get into bed. The short buffer makes the bedtime suggestion more realistic.</p>
              </div>
              <div>
                <h3>What should I do after picking a bedtime?</h3>
                <p>Keep the room dark, stop adjusting everything, and start one steady sleep sound so your body has fewer reasons to stay alert.</p>
              </div>
            </div>
          </section>

          <section className="tool-section glass-panel related-tools-panel">
            <h2>More Sleepfast tools for tonight</h2>
            <div className="related-tools-grid">
              {relatedToolLinks.map((tool) => (
                <a key={tool.href} className="related-tool-link glass-subpanel" href={tool.href}>
                  <span className="related-tool-kicker">{tool.kicker}</span>
                  <strong>{tool.title}</strong>
                  <p>{tool.description}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="conversion-story glass-panel tool-cta-panel">
            <div className="conversion-intro">
              <span className="eyebrow">Keep going with Sleepfast</span>
              <h2>Got your bedtime? Pair it with a softer room.</h2>
              <p>
                Use the calculator to choose when to get in bed, then switch to Sleepfast sounds for the part that still matters most: actually winding down and falling asleep.
              </p>
            </div>
            <div className="tool-cta-actions">
              <a className="link-button" href="/">
                Open the full Sleepfast player
              </a>
              <a className="text-link" href="/white-noise-for-sleep">
                Or try white noise for sleep
              </a>
            </div>
          </section>
        </section>
      </main>
    )
  }

  if (isNapCalculatorPage) {
    return (
      <main className="app-shell tool-shell">
        <section className="tool-hero rain-stage">
          <div className="top-brandbar">
            <a className="brand-lockup" aria-label="Sleepfast home" href="/">
              <CatMark className="brand-cat" />
              <div className="brand-copy">
                <span className="brand-name">Sleepfast</span>
                <span className="brand-tag">nap calculator</span>
              </div>
            </a>
          </div>

          <div className="rain-backdrop tool-backdrop" aria-hidden="true">
            <div className="night-vignette" />
            <div className="mist mist-left" />
            <div className="mist mist-right" />
            <div className="city-glow" />
            <div className="window-sheen" />
          </div>

          <div className="tool-layout">
            <section className="tool-copy glass-panel">
              <span className="eyebrow">Nap calculator</span>
              <h1>Find the best time to wake up from a nap without doing the math.</h1>
              <p className="hero-text tool-subtitle">
                Pick the time you want to close your eyes and get clean wake-up targets for a 20-minute reset, a 30-minute recharge, or a full 90-minute sleep cycle.
              </p>
              <div className="result-pills" aria-label="Nap calculator benefits">
                <span>Instant nap wake-up targets</span>
                <span>20, 30, and 90 minute options</span>
                <span>Built for today, not a full app</span>
              </div>
              <div className="cta-row">
                <a className="link-button" href="#nap-calculator-tool">
                  Use the nap calculator
                </a>
                <a className="text-link" href="/sleep-breathing-exercise">
                  Or do a quick breathing reset
                </a>
              </div>
              <p className="quiet-line tool-quiet-line">
                Best when you need a simple daytime recovery plan before a late shift, travel window, or harder night ahead.
              </p>
            </section>

            <aside className="player-card player-card-healing glass-panel tool-player-card sleep-calculator-card" id="nap-calculator-tool">
              <div className="now-playing now-playing-minimal">
                <span className="player-kicker">Nap start time</span>
                <h2>{formatMinutesForHumans(timeInputToMinutes(wakeTime))}</h2>
                <p className="comfort-note">Choose when you can actually start resting. Sleepfast will show the cleanest wake-up options so your nap stays simple.</p>
              </div>

              <div className="sleep-calculator-input glass-subpanel">
                <label htmlFor="nap-start-time">Start nap at</label>
                <input
                  id="nap-start-time"
                  type="time"
                  value={wakeTime}
                  onChange={(event) => setWakeTime(event.target.value)}
                />
                <p>
                  Uses common nap windows: {napWindows.map((window) => `${window.duration} minutes`).join(', ')}.
                </p>
              </div>

              <div className="sleep-cycle-list">
                {napWindows.map((window, index) => (
                  <div className={`sleep-cycle-item glass-subpanel ${index === 0 ? 'recommended' : ''}`} key={window.label}>
                    <div>
                      <span className="sleep-cycle-kicker">{window.label}</span>
                      <strong>Wake up at {window.endTime}</strong>
                    </div>
                    <p>{window.benefit}</p>
                  </div>
                ))}
              </div>

              <div className="tool-bridge-card glass-subpanel">
                <span className="sleep-cycle-kicker">Nap support</span>
                <strong>Pair your nap with one low-friction reset before or after.</strong>
                <p>Use the breathing reset if you cannot drop into rest, or move into Rain on Window if you need a softer landing after travel or a broken night.</p>
                <div className="tool-bridge-links">
                  <a className="text-link" href="/sleep-breathing-exercise">
                    Open the breathing reset
                  </a>
                  <a className="text-link" href="/rain-sounds-for-sleep">
                    Play rain sounds now
                  </a>
                </div>
              </div>

              <div className="player-footer player-footer-artful player-footer-healing player-footer-single">
                <a className="link-button" href="/sleep-better-tonight">
                  Use Sleepfast tonight too
                </a>
              </div>
            </aside>
          </div>
        </section>

        <section className="tool-sections">
          <section className="tool-section glass-panel">
            <h2>How this nap calculator works</h2>
            <p>
              The point of a nap calculator is not perfect science. It is giving you a clean answer fast so you can stop guessing whether 20 minutes, 30 minutes, or a full cycle fits the part of the day you are in.
            </p>
            <p>
              Sleepfast keeps it simple by turning your nap start time into realistic wake-up targets you can use right away in a browser.
            </p>
          </section>

          <section className="tool-section glass-panel">
            <h2>When to use each nap length</h2>
            <ul className="tool-list">
              <li>Choose 20 minutes when you want a quicker mental reset without risking a heavier wake-up.</li>
              <li>Choose 30 minutes when you have a little more room and want a slightly longer recharge.</li>
              <li>Choose 90 minutes when you can protect a full cycle and want to wake up with less interruption in deeper sleep.</li>
            </ul>
          </section>

          <section className="tool-section glass-panel">
            <h2>FAQ</h2>
            <div className="faq-list">
              <div>
                <h3>What is the best nap length?</h3>
                <p>A 20-minute nap is usually the easiest place to start for a quick reset. A 90-minute nap can work better when you have enough time to protect a full cycle.</p>
              </div>
              <div>
                <h3>Can I use this after a bad night?</h3>
                <p>Yes. It is useful when last night went badly and you need a daytime recovery plan that does not turn into another messy sleep window.</p>
              </div>
              <div>
                <h3>What should I do after my nap?</h3>
                <p>Keep the restart simple. Get some light, avoid opening too many stimulating inputs, and come back to Sleepfast tonight if you need a calmer wind-down again.</p>
              </div>
            </div>
          </section>

          <section className="tool-section glass-panel related-tools-panel">
            <h2>More Sleepfast tools for tonight</h2>
            <div className="related-tools-grid">
              {relatedToolLinks.map((tool) => (
                <a key={tool.href} className="related-tool-link glass-subpanel" href={tool.href}>
                  <span className="related-tool-kicker">{tool.kicker}</span>
                  <strong>{tool.title}</strong>
                  <p>{tool.description}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="conversion-story glass-panel tool-cta-panel">
            <div className="conversion-intro">
              <span className="eyebrow">Keep going with Sleepfast</span>
              <h2>Need a softer room after your nap too?</h2>
              <p>
                Use the nap calculator for daytime timing, then come back to Sleepfast tonight for rain, ocean, white noise, brown noise, and calmer browser-first sleep resets.
              </p>
            </div>
            <div className="tool-cta-actions">
              <a className="link-button" href="/">
                Open the full Sleepfast player
              </a>
              <a className="text-link" href="/sleep-better-tonight">
                Or open sleep better tonight
              </a>
            </div>
          </section>
        </section>
      </main>
    )
  }

  if (isSleepBreathingExercisePage) {
    return (
      <main className="app-shell tool-shell">
        <section className="tool-hero rain-stage">
          <div className="top-brandbar">
            <a className="brand-lockup" aria-label="Sleepfast home" href="/">
              <CatMark className="brand-cat" />
              <div className="brand-copy">
                <span className="brand-name">Sleepfast</span>
                <span className="brand-tag">sleep breathing exercise</span>
              </div>
            </a>
          </div>

          <div className="rain-backdrop tool-backdrop" aria-hidden="true">
            <div className="night-vignette" />
            <div className="mist mist-left" />
            <div className="mist mist-right" />
            <div className="deep-space-glow" />
            <div className="floating-stars deep-space-stars" />
          </div>

          <div className="tool-layout">
            <section className="tool-copy glass-panel">
              <span className="eyebrow">Sleep breathing exercise</span>
              <h1>Slow your body down before you ask it to sleep.</h1>
              <p className="hero-text tool-subtitle">
                Use a simple 4-7-8 breathing reset when bedtime feels overstimulated, then move into Sleepfast sounds once your room and your nervous system feel less sharp.
              </p>
              <div className="result-pills" aria-label="Sleep breathing exercise benefits">
                <span>Instant 4-7-8 reset</span>
                <span>Made for overstimulated bedtimes</span>
                <span>Easy bridge into sleep sounds</span>
              </div>
              <div className="cta-row">
                <button type="button" onClick={toggleBreathingExercise}>
                  {breathingActive ? 'Pause the breathing reset' : 'Start the breathing reset'}
                </button>
                <a className="text-link" href="#sleep-breathing-tool">
                  Jump to the exercise
                </a>
              </div>
              <p className="quiet-line tool-quiet-line">
                Best when your thoughts are loud, your chest feels tight, or you need a calmer bridge before switching on rain, ocean, or noise.
              </p>
            </section>

            <aside className="player-card player-card-healing glass-panel tool-player-card breathing-tool-card" id="sleep-breathing-tool">
              <div className="now-playing now-playing-minimal">
                <span className="player-kicker">Current breathing phase</span>
                <h2>{currentBreathingStep.label}</h2>
                <p className="comfort-note">{currentBreathingStep.guidance}</p>
              </div>

              <div className={`breathing-visual glass-subpanel breathing-${currentBreathingStep.phase} ${breathingActive ? 'active' : ''}`} aria-live="polite">
                <div className="breathing-orb" />
                <div className="breathing-copy">
                  <strong>{currentBreathingStep.label}</strong>
                  <span>{breathingSecondsLeft}s left in this step</span>
                </div>
              </div>

              <div className="sleep-cycle-list breathing-step-list">
                {breathingSteps.map((step, index) => (
                  <div className={`sleep-cycle-item glass-subpanel ${index === breathingStepIndex ? 'recommended' : ''}`} key={step.label}>
                    <div>
                      <span className="sleep-cycle-kicker">{step.phase}</span>
                      <strong>
                        {step.label} · {step.seconds}s
                      </strong>
                    </div>
                    <p>{step.guidance}</p>
                  </div>
                ))}
              </div>

              <div className="breathing-summary glass-subpanel">
                <strong>{breathingCycleCount} full cycles completed</strong>
                <p>Do 2 to 4 cycles, then move straight into one steady Sleepfast sound instead of reopening stimulation.</p>
              </div>

              <div className="player-footer player-footer-artful player-footer-healing breathing-footer">
                <button type="button" onClick={toggleBreathingExercise}>
                  {breathingActive ? 'Keep this pace gentle' : 'Begin 4-7-8 now'}
                </button>
                <a className="text-link" href="/fall-asleep-fast">
                  Then open the sleep reset
                </a>
              </div>

              <div className="breathing-follow-up-grid">
                <button
                  type="button"
                  className="breathing-follow-up-card glass-subpanel"
                  onClick={() => void startBreathingFollowUp('rain', 20, 'cant-sleep')}
                >
                  <span className="sleep-cycle-kicker">After softening the room</span>
                  <strong>Play Rain on Window · 20 min</strong>
                  <p>Best when you want a gentler wind-down right after 2 to 4 breathing cycles.</p>
                </button>
                <button
                  type="button"
                  className="breathing-follow-up-card glass-subpanel"
                  onClick={() => void startBreathingFollowUp('brown', 30, 'cant-sleep')}
                >
                  <span className="sleep-cycle-kicker">After overthinking</span>
                  <strong>Play Brown Noise · 30 min</strong>
                  <p>Use a deeper layer when your breathing has slowed down but your thoughts still feel loud.</p>
                </button>
                <button
                  type="button"
                  className="breathing-follow-up-card glass-subpanel"
                  onClick={() => void startBreathingFollowUp('white', 10, 'wake-up-3am')}
                >
                  <span className="sleep-cycle-kicker">After a sudden wake-up</span>
                  <strong>Play White Noise · 10 min</strong>
                  <p>Use a shorter restart if breathing helped but you still need to cover small sounds without fully waking back up.</p>
                </button>
                <button
                  type="button"
                  className="breathing-follow-up-card glass-subpanel"
                  onClick={() => void startBreathingFollowUp('ocean', 45, 'cant-sleep')}
                >
                  <span className="sleep-cycle-kicker">After deeper unwinding</span>
                  <strong>Play Ocean Waves · 45 min</strong>
                  <p>Choose the slower shoreline when your body is calmer and you want a longer drift without switching tracks again.</p>
                </button>
              </div>
            </aside>
          </div>
        </section>

        <section className="tool-sections">
          <section className="tool-section glass-panel">
            <h2>How this sleep breathing exercise helps</h2>
            <p>
              Breathing exercises do not force sleep, but they can lower the sense that your body needs to keep doing something. That matters when bedtime feels tense, buzzy, or mentally overactive.
            </p>
            <p>
              This page keeps the routine simple: inhale for 4 seconds, hold for 7, exhale for 8, then go straight into a steadier Sleepfast sound instead of searching for a perfect next step.
            </p>
          </section>

          <section className="tool-section glass-panel">
            <h2>When to use it</h2>
            <ul className="tool-list">
              <li>When your body feels tired but your chest, jaw, or thoughts still feel too activated for sleep.</li>
              <li>When you want a short pre-sleep reset before switching on rain, ocean, white noise, or brown noise.</li>
              <li>When you need a lighter bedtime ritual that does not require downloading another meditation app.</li>
            </ul>
          </section>

          <section className="tool-section glass-panel">
            <h2>FAQ</h2>
            <div className="faq-list">
              <div>
                <h3>Do I need to finish a certain number of cycles?</h3>
                <p>No. Two to four gentle cycles are enough for a quick bedtime reset. Stop sooner if you already feel calmer.</p>
              </div>
              <div>
                <h3>Should I use this instead of sleep sounds?</h3>
                <p>Usually not. This works best as a bridge into the main Sleepfast experience: calm your breathing first, then keep the room steady with one sound.</p>
              </div>
              <div>
                <h3>What if holding for 7 seconds feels too intense?</h3>
                <p>Keep the breathing soft and never strain. The goal is a gentler rhythm, not perfect performance.</p>
              </div>
            </div>
          </section>

          <section className="tool-section glass-panel related-tools-panel">
            <h2>More Sleepfast tools for tonight</h2>
            <div className="related-tools-grid">
              {relatedToolLinks.map((tool) => (
                <a key={tool.href} className="related-tool-link glass-subpanel" href={tool.href}>
                  <span className="related-tool-kicker">{tool.kicker}</span>
                  <strong>{tool.title}</strong>
                  <p>{tool.description}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="conversion-story glass-panel tool-cta-panel">
            <div className="conversion-intro">
              <span className="eyebrow">Keep going with Sleepfast</span>
              <h2>Once your breathing slows, let one steady sound take over.</h2>
              <p>
                Use this 4-7-8 reset to soften the first few minutes of bedtime, then switch into the full Sleepfast player for rain, ocean, white noise, brown noise, and calmer sleep restarts.
              </p>
            </div>
            <div className="tool-cta-actions">
              <a className="link-button" href="/fall-asleep-fast">
                Open the bedtime reset
              </a>
              <a className="text-link" href="/">
                Or open the full Sleepfast player
              </a>
            </div>
          </section>
        </section>
      </main>
    )
  }

  if (isFallAsleepFastPage) {
    return (
      <main className="app-shell tool-shell">
        <section className="tool-hero rain-stage">
          <div className="top-brandbar">
            <a className="brand-lockup" aria-label="Sleepfast home" href="/">
              <CatMark className="brand-cat" />
              <div className="brand-copy">
                <span className="brand-name">Sleepfast</span>
                <span className="brand-tag">fall asleep fast</span>
              </div>
            </a>
          </div>

          <div className="rain-backdrop tool-backdrop" aria-hidden="true">
            <div className="night-vignette" />
            <div className="mist mist-left" />
            <div className="mist mist-right" />
            <div className="city-glow" />
            <div className="window-sheen" />
          </div>

          <div className="tool-layout">
            <section className="tool-copy glass-panel">
              <span className="eyebrow">Fall asleep fast</span>
              <h1>Fall asleep faster without opening another app.</h1>
              <p className="hero-text tool-subtitle">
                Start a sleep sound instantly, pick the kind of restless night you are having, and use a simpler bedtime reset built for tonight instead of a full sleep program.
              </p>
              <div className="result-pills" aria-label="Fall asleep fast benefits">
                <span>Instant browser sleep sounds</span>
                <span>Made for tonight's restless window</span>
                <span>Simple 10 to 60 minute timer</span>
              </div>
              <div className="cta-row">
                <button type="button" onClick={() => void handleTogglePlayback()}>
                  {isPlaying ? 'Pause the sleep sound' : 'Start falling asleep faster'}
                </button>
                <a className="text-link" href="#fall-asleep-fast-tool">
                  Jump to the bedtime reset
                </a>
              </div>
              <p className="quiet-line tool-quiet-line">
                Best when your body feels tired but your room, your mind, or your momentum still will not let sleep start cleanly.
              </p>
            </section>

            <aside className="player-card player-card-healing glass-panel tool-player-card" id="fall-asleep-fast-tool">
              <div className="now-playing now-playing-minimal">
                <span className="player-kicker">Tonight's faster reset</span>
                <h2>{currentSound.name}</h2>
                <p className="comfort-note">
                  Pick one steady layer, stop switching, and give your nervous system fewer new signals to react to while you are trying to drift off.
                </p>
              </div>

              <div className="sleep-reset-list">
                {scenarios.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    className={`sleep-reset-item glass-subpanel ${scenario.id === selectedScenario ? 'active' : ''}`}
                    onClick={() => void applyScenario(scenario)}
                  >
                    <div>
                      <span className="sleep-cycle-kicker">{scenario.name}</span>
                      <strong>
                        {soundOptions.find((option) => option.id === scenario.soundId)?.name} · {scenario.timer} min
                      </strong>
                    </div>
                    <p>{scenario.benefit}</p>
                  </button>
                ))}
              </div>

              <div className="control-drawer glass-subpanel control-drawer-healing control-drawer-open">
                <div className="sound-grid sound-grid-minimal">
                  {soundOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`sound-button ${option.id === selectedSound ? 'active' : ''}`}
                      onClick={async () => {
                        setSelectedSound(option.id)
                        if (isPlaying) {
                          await rebuildPlayback([option.id])
                        }
                      }}
                    >
                      <strong>{option.name}</strong>
                    </button>
                  ))}
                </div>

                <div className="player-controls">
                  <div className="timer-block timer-block-minimal">
                    <div className="timer-label-row timer-label-row-minimal">
                      <strong>Rest timer</strong>
                      <span>{formatTimerLabel(timeLeftMs, timerMinutes)}</span>
                    </div>
                    <div className="timer-row">
                      {timerOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={option === timerMinutes ? 'active' : ''}
                          onClick={() => {
                            handleTimerOptionSelect(option)
                          }}
                        >
                          {option} min
                        </button>
                      ))}
                    </div>
                    <div className="custom-timer-row">
                      <label className="custom-timer-label" htmlFor="custom-timer-minutes">
                        Custom minutes
                      </label>
                      <div className="custom-timer-input-wrap">
                        <input
                          id="custom-timer-minutes"
                          className="custom-timer-input"
                          inputMode="numeric"
                          min={1}
                          max={180}
                          step={1}
                          type="number"
                          value={customTimerMinutes}
                          onChange={(event) => {
                            setCustomTimerMinutes(event.target.value)
                          }}
                          onBlur={() => {
                            setCustomTimerMinutes(getCustomTimerValue(customTimerMinutes))
                          }}
                        />
                        <button type="button" className="custom-timer-apply" onClick={handleCustomTimerApply}>
                          Use custom
                        </button>
                      </div>
                      <span className="custom-timer-note">Use 1–180 minutes for naps, longer drift, or travel recovery.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="player-footer player-footer-artful player-footer-healing player-footer-single">
                <button type="button" onClick={() => void handleTogglePlayback()}>
                  {isPlaying ? 'Keep this room steady' : 'Use this sleep sound now'}
                </button>
              </div>
            </aside>
          </div>
        </section>

        <section className="tool-sections">
          <section className="tool-section glass-panel">
            <h2>How to fall asleep fast tonight</h2>
            <p>
              The fastest reset is usually not adding more stimulation. It is reducing decisions, picking one consistent sound, and giving your brain a single background layer instead of silence plus interruptions.
            </p>
            <p>
              Sleepfast is built for that specific moment: when you are already tired, but a noisy room, racing thoughts, or a broken bedtime rhythm keeps the last step into sleep from happening.
            </p>
          </section>

          <section className="tool-section glass-panel">
            <h2>A simple bedtime reset</h2>
            <ul className="tool-list">
              <li>Choose the restless-night preset that feels closest to what is happening right now.</li>
              <li>Start one sound and set a short timer so the room feels held without becoming another thing to manage.</li>
              <li>Keep lights low, stop changing tracks, and let your body settle around the same steady layer.</li>
            </ul>
          </section>

          <section className="tool-section glass-panel">
            <h2>FAQ</h2>
            <div className="faq-list">
              <div>
                <h3>What is the best sound to fall asleep fast?</h3>
                <p>There is no single best sound for everyone. Rain often feels easiest to start with, white noise helps more with outside sounds, and brown noise can feel better when your own thoughts are the loudest thing in the room.</p>
              </div>
              <div>
                <h3>Can this help if I cannot turn my mind off?</h3>
                <p>It can help by giving your attention one steady place to land. It will not solve stress on its own, but it can lower the number of little things your brain keeps tracking.</p>
              </div>
              <div>
                <h3>How long should I leave sleep sounds on?</h3>
                <p>Start with 20 to 30 minutes if you mainly need help crossing into sleep. Use longer only if the room or your wake-ups keep pulling you alert again.</p>
              </div>
            </div>
          </section>

          <section className="tool-section glass-panel related-tools-panel">
            <h2>More Sleepfast tools for tonight</h2>
            <div className="related-tools-grid">
              {relatedToolLinks.map((tool) => (
                <a key={tool.href} className="related-tool-link glass-subpanel" href={tool.href}>
                  <span className="related-tool-kicker">{tool.kicker}</span>
                  <strong>{tool.title}</strong>
                  <p>{tool.description}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="conversion-story glass-panel tool-cta-panel">
            <div className="conversion-intro">
              <span className="eyebrow">Keep going with Sleepfast</span>
              <h2>Need a softer room after tonight too?</h2>
              <p>
                Go back to the full Sleepfast player for rain, ocean, brown noise, white noise, and a calmer homepage experience built around falling asleep faster and restarting sleep after night wake-ups.
              </p>
            </div>
            <div className="tool-cta-actions">
              <a className="link-button" href="/">
                Open the full Sleepfast player
              </a>
              <a className="text-link" href="/sleep-calculator">
                Or use the sleep calculator
              </a>
            </div>
          </section>
        </section>
      </main>
    )
  }

  if (isWakeUpAt3amPage) {
    return (
      <main className="app-shell tool-shell">
        <section className="tool-hero rain-stage">
          <div className="top-brandbar">
            <a className="brand-lockup" aria-label="Sleepfast home" href="/">
              <CatMark className="brand-cat" />
              <div className="brand-copy">
                <span className="brand-name">Sleepfast</span>
                <span className="brand-tag">wake up at 3am</span>
              </div>
            </a>
          </div>

          <div className="rain-backdrop tool-backdrop" aria-hidden="true">
            <div className="night-vignette" />
            <div className="mist mist-left" />
            <div className="mist mist-right" />
            <div className="city-glow" />
            <div className="window-sheen" />
          </div>

          <div className="tool-layout">
            <section className="tool-copy glass-panel">
              <span className="eyebrow">Wake up at 3AM</span>
              <h1>Fall back asleep faster after a 3AM wake-up.</h1>
              <p className="hero-text tool-subtitle">
                Start instant white noise, keep the room steady, and use a short middle-of-the-night reset instead of fully waking yourself up trying to fix sleep.
              </p>
              <div className="result-pills" aria-label="Wake up at 3AM benefits">
                <span>Instant white noise restart</span>
                <span>Built for late-night wake-ups</span>
                <span>Simple 10 minute reset</span>
              </div>
              <div className="cta-row">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedSound('white')
                    if (selectedScenario !== 'wake-up-3am') {
                      setSelectedScenario('wake-up-3am')
                    }
                    setTimerMinutes(10)
                    await handleTogglePlayback()
                  }}
                >
                  {isPlaying && selectedSound === 'white' ? 'Pause the 3AM reset' : 'Start the 3AM reset'}
                </button>
                <a className="text-link" href="#wake-up-at-3am-tool">
                  Jump to the reset steps
                </a>
              </div>
              <p className="quiet-line tool-quiet-line">
                Best when you woke suddenly, checked the time, and can feel yourself getting more alert the longer the room stays too sharp or too silent.
              </p>
            </section>

            <aside className="player-card player-card-healing glass-panel tool-player-card" id="wake-up-at-3am-tool">
              <div className="now-playing now-playing-minimal">
                <span className="player-kicker">3AM sleep restart</span>
                <h2>White Noise</h2>
                <p className="comfort-note">
                  Use one steady masking layer, skip track-hopping, and give your brain fewer reasons to fully come back online.
                </p>
              </div>

              <div className="sleep-reset-list">
                <button
                  type="button"
                  className={`sleep-reset-item glass-subpanel ${selectedScenario === 'wake-up-3am' ? 'active' : ''}`}
                  onClick={() => void applyScenario(scenarios[1])}
                >
                  <div>
                    <span className="sleep-cycle-kicker">Default restart preset</span>
                    <strong>White Noise · 10 min</strong>
                  </div>
                  <p>Restart sleep quickly without turning a brief wake-up into a full awake window.</p>
                </button>
                <button
                  type="button"
                  className={`sleep-reset-item glass-subpanel ${selectedSound === 'rain' ? 'active' : ''}`}
                  onClick={async () => {
                    setSelectedScenario('wake-up-3am')
                    setSelectedSound('rain')
                    setTimerMinutes(20)
                    if (isPlaying) {
                      await rebuildPlayback(['rain'])
                      timerDeadlineRef.current = Date.now() + 20 * TIMER_SCALE_MS
                      setTimeLeftMs(20 * TIMER_SCALE_MS)
                    }
                  }}
                >
                  <div>
                    <span className="sleep-cycle-kicker">Gentler backup</span>
                    <strong>Rain on Window · 20 min</strong>
                  </div>
                  <p>Switch here if white noise feels too crisp and you need a softer texture before drifting back down.</p>
                </button>
              </div>

              <div className="control-drawer glass-subpanel control-drawer-healing control-drawer-open">
                <div className="player-controls">
                  <div className="timer-block timer-block-minimal">
                    <div className="timer-label-row timer-label-row-minimal">
                      <strong>Restart timer</strong>
                      <span>{formatTimerLabel(timeLeftMs, timerMinutes)}</span>
                    </div>
                    <div className="timer-row">
                      {timerOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={option === timerMinutes ? 'active' : ''}
                          onClick={() => {
                            handleTimerOptionSelect(option)
                          }}
                        >
                          {option} min
                        </button>
                      ))}
                    </div>
                    <div className="custom-timer-row">
                      <label className="custom-timer-label" htmlFor="custom-timer-minutes">
                        Custom minutes
                      </label>
                      <div className="custom-timer-input-wrap">
                        <input
                          id="custom-timer-minutes"
                          className="custom-timer-input"
                          inputMode="numeric"
                          min={1}
                          max={180}
                          step={1}
                          type="number"
                          value={customTimerMinutes}
                          onChange={(event) => {
                            setCustomTimerMinutes(event.target.value)
                          }}
                          onBlur={() => {
                            setCustomTimerMinutes(getCustomTimerValue(customTimerMinutes))
                          }}
                        />
                        <button type="button" className="custom-timer-apply" onClick={handleCustomTimerApply}>
                          Use custom
                        </button>
                      </div>
                      <span className="custom-timer-note">Use 1–180 minutes for naps, longer drift, or travel recovery.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="player-footer player-footer-artful player-footer-healing player-footer-single">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedSound('white')
                    await handleTogglePlayback()
                  }}
                >
                  {isPlaying && selectedSound === 'white' ? 'Keep the room steady' : 'Use white noise now'}
                </button>
              </div>

              <div className="tool-bridge-card glass-subpanel">
                <span className="sleep-cycle-kicker">Need to settle first?</span>
                <strong>Do a 4-7-8 breathing reset before restarting sleep.</strong>
                <p>If the wake-up already made your chest or thoughts feel too active, use the guided breathing page first and then come back into rain or white noise.</p>
                <a className="text-link" href="/sleep-breathing-exercise">
                  Open the breathing reset
                </a>
              </div>
            </aside>
          </div>
        </section>

        <section className="tool-sections">
          <section className="tool-section glass-panel">
            <h2>What to do when you wake up at 3AM</h2>
            <p>
              The goal is not to make the perfect fix. It is to avoid giving your brain more light, more decisions, or more stimulation than the wake-up already created.
            </p>
            <p>
              Sleepfast is built for that exact moment: start one steady layer, keep your eyes off everything else, and let the room feel less exposed while your body settles again.
            </p>
          </section>

          <section className="tool-section glass-panel">
            <h2>A simple 3AM reset</h2>
            <ul className="tool-list">
              <li>Do not start scrolling or checking more than the time once.</li>
              <li>Play one steady sound and keep the volume low enough that it feels like coverage, not activity.</li>
              <li>Pick a short timer so you can relax back into sleep without worrying about managing playback.</li>
            </ul>
          </section>

          <section className="tool-section glass-panel">
            <h2>FAQ</h2>
            <div className="faq-list">
              <div>
                <h3>Why does waking up at 3AM feel so activating?</h3>
                <p>Because the room is quiet, your mind notices the wake-up fast, and even small choices can make you feel more awake than you were a minute earlier.</p>
              </div>
              <div>
                <h3>Should I use white noise or rain after waking up?</h3>
                <p>White noise is usually better if outside sounds or house sounds keep pulling your attention. Rain is a good fallback if you want something softer and less neutral.</p>
              </div>
              <div>
                <h3>How long should the restart timer be?</h3>
                <p>Start with 10 minutes for a brief wake-up. Go longer only if you know your room stays noisy or your body takes more time to settle back down.</p>
              </div>
            </div>
          </section>

          <section className="tool-section glass-panel related-tools-panel">
            <h2>More Sleepfast tools for tonight</h2>
            <div className="related-tools-grid">
              {relatedToolLinks.map((tool) => (
                <a key={tool.href} className="related-tool-link glass-subpanel" href={tool.href}>
                  <span className="related-tool-kicker">{tool.kicker}</span>
                  <strong>{tool.title}</strong>
                  <p>{tool.description}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="conversion-story glass-panel tool-cta-panel">
            <div className="conversion-intro">
              <span className="eyebrow">Keep going with Sleepfast</span>
              <h2>Need help before bed too, not just after waking up?</h2>
              <p>
                Go back to the full Sleepfast player for rain, ocean, brown noise, white noise, and a calmer homepage experience built for falling asleep faster before the 3AM wake-up even starts.
              </p>
            </div>
            <div className="tool-cta-actions">
              <a className="link-button" href="/">
                Open the full Sleepfast player
              </a>
              <a className="text-link" href="/white-noise-for-sleep">
                Or try white noise for sleep
              </a>
            </div>
          </section>
        </section>
      </main>
    )
  }

  if (isMindRacingAtNightPage) {
    return (
      <main className="app-shell tool-shell">
        <section className="tool-hero rain-stage">
          <div className="top-brandbar">
            <a className="brand-lockup" aria-label="Sleepfast home" href="/">
              <CatMark className="brand-cat" />
              <div className="brand-copy">
                <span className="brand-name">Sleepfast</span>
                <span className="brand-tag">mind racing at night</span>
              </div>
            </a>
          </div>

          <div className="rain-backdrop tool-backdrop" aria-hidden="true">
            <div className="night-vignette" />
            <div className="mist mist-left" />
            <div className="mist mist-right" />
            <div className="city-glow" />
            <div className="window-sheen" />
          </div>

          <div className="tool-layout">
            <section className="tool-copy glass-panel">
              <span className="eyebrow">Mind racing at night</span>
              <h1>Calm a racing mind before it turns into a longer night.</h1>
              <p className="hero-text tool-subtitle">
                Start deeper brown noise instantly, keep your room from feeling too exposed, and use one simple reset when your thoughts will not stop looping at bedtime.
              </p>
              <div className="result-pills" aria-label="Mind racing at night benefits">
                <span>Instant brown noise reset</span>
                <span>Built for overstimulated nights</span>
                <span>Simple 20 to 60 minute timer</span>
              </div>
              <div className="cta-row">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedSound('brown')
                    if (selectedScenario !== 'cant-sleep') {
                      setSelectedScenario('cant-sleep')
                    }
                    setTimerMinutes(45)
                    await handleTogglePlayback()
                  }}
                >
                  {isPlaying && selectedSound === 'brown' ? 'Pause the grounding layer' : 'Start calming the mental noise'}
                </button>
                <a className="text-link" href="#mind-racing-tool">
                  Jump to the calmer reset
                </a>
              </div>
              <p className="quiet-line tool-quiet-line">
                Best when silence makes your thoughts louder, your body feels tired, and every new idea keeps pulling you farther from sleep.
              </p>
            </section>

            <aside className="player-card player-card-healing glass-panel tool-player-card" id="mind-racing-tool">
              <div className="now-playing now-playing-minimal">
                <span className="player-kicker">Grounding bedtime layer</span>
                <h2>{selectedSound === 'white' ? 'White Noise' : 'Brown Noise'}</h2>
                <p className="comfort-note">
                  Start with a deeper layer that feels less sharp than silence, then keep the room steady instead of searching for the perfect sleep fix.
                </p>
              </div>

              <div className="sleep-reset-list">
                <button
                  type="button"
                  className={`sleep-reset-item glass-subpanel ${selectedSound === 'brown' ? 'active' : ''}`}
                  onClick={async () => {
                    setSelectedScenario('cant-sleep')
                    setSelectedSound('brown')
                    setTimerMinutes(45)
                    if (isPlaying) {
                      await rebuildPlayback(['brown'])
                      timerDeadlineRef.current = Date.now() + 45 * TIMER_SCALE_MS
                      setTimeLeftMs(45 * TIMER_SCALE_MS)
                    }
                  }}
                >
                  <div>
                    <span className="sleep-cycle-kicker">Default grounding preset</span>
                    <strong>Brown Noise · 45 min</strong>
                  </div>
                  <p>Use a deeper, heavier sound when mental chatter feels louder than the room itself.</p>
                </button>
                <button
                  type="button"
                  className={`sleep-reset-item glass-subpanel ${selectedSound === 'white' ? 'active' : ''}`}
                  onClick={async () => {
                    setSelectedScenario('cant-sleep')
                    setSelectedSound('white')
                    setTimerMinutes(30)
                    if (isPlaying) {
                      await rebuildPlayback(['white'])
                      timerDeadlineRef.current = Date.now() + 30 * TIMER_SCALE_MS
                      setTimeLeftMs(30 * TIMER_SCALE_MS)
                    }
                  }}
                >
                  <div>
                    <span className="sleep-cycle-kicker">Cleaner backup</span>
                    <strong>White Noise · 30 min</strong>
                  </div>
                  <p>Switch here if your thoughts are racing but outside sounds are also keeping your brain on alert.</p>
                </button>
              </div>

              <div className="control-drawer glass-subpanel control-drawer-healing control-drawer-open">
                <div className="player-controls">
                  <div className="timer-block timer-block-minimal">
                    <div className="timer-label-row timer-label-row-minimal">
                      <strong>Grounding timer</strong>
                      <span>{formatTimerLabel(timeLeftMs, timerMinutes)}</span>
                    </div>
                    <div className="timer-row">
                      {timerOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={option === timerMinutes ? 'active' : ''}
                          onClick={() => {
                            handleTimerOptionSelect(option)
                          }}
                        >
                          {option} min
                        </button>
                      ))}
                    </div>
                    <div className="custom-timer-row">
                      <label className="custom-timer-label" htmlFor="custom-timer-minutes">
                        Custom minutes
                      </label>
                      <div className="custom-timer-input-wrap">
                        <input
                          id="custom-timer-minutes"
                          className="custom-timer-input"
                          inputMode="numeric"
                          min={1}
                          max={180}
                          step={1}
                          type="number"
                          value={customTimerMinutes}
                          onChange={(event) => {
                            setCustomTimerMinutes(event.target.value)
                          }}
                          onBlur={() => {
                            setCustomTimerMinutes(getCustomTimerValue(customTimerMinutes))
                          }}
                        />
                        <button type="button" className="custom-timer-apply" onClick={handleCustomTimerApply}>
                          Use custom
                        </button>
                      </div>
                      <span className="custom-timer-note">Use 1–180 minutes for naps, longer drift, or travel recovery.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="player-footer player-footer-artful player-footer-healing player-footer-single">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedSound('brown')
                    await handleTogglePlayback()
                  }}
                >
                  {isPlaying && selectedSound === 'brown' ? 'Keep the room grounded' : 'Use brown noise now'}
                </button>
              </div>

              <div className="tool-bridge-card glass-subpanel">
                <span className="sleep-cycle-kicker">Need to slow your body first?</span>
                <strong>Start with the 4-7-8 breathing reset, then move into brown noise.</strong>
                <p>Use the breathing exercise when your thoughts are looping so fast that even the right sound still feels like too much input at first.</p>
                <a className="text-link" href="/sleep-breathing-exercise">
                  Open the breathing reset
                </a>
              </div>
            </aside>
          </div>
        </section>

        <section className="tool-sections">
          <section className="tool-section glass-panel">
            <h2>Why your mind races more at night</h2>
            <p>
              At night there is less distraction, less outside structure, and more silence for unfinished thoughts to bounce around in. That does not mean anything is wrong with you. It just means your brain suddenly has more space to keep going.
            </p>
            <p>
              Sleepfast is built for that exact window: one steady sound, fewer new inputs, and less pressure to solve everything before sleep can start.
            </p>
          </section>

          <section className="tool-section glass-panel">
            <h2>A simple reset for racing thoughts</h2>
            <ul className="tool-list">
              <li>Pick one sound and leave it alone instead of testing five options in a row.</li>
              <li>Set a short or medium timer so the room feels covered without becoming another thing to manage.</li>
              <li>Keep lights low and let your attention return to the same steady layer each time your mind tries to sprint ahead.</li>
            </ul>
          </section>

          <section className="tool-section glass-panel">
            <h2>FAQ</h2>
            <div className="faq-list">
              <div>
                <h3>What is the best sound when my mind will not slow down?</h3>
                <p>Brown noise is often the best place to start because it feels deeper and less sharp than white noise, which can help when your problem is mental chatter more than outside sound.</p>
              </div>
              <div>
                <h3>Can sound stop anxious thoughts completely?</h3>
                <p>No. But it can give your attention one steady background layer so every small thought does not feel like the loudest thing in the room.</p>
              </div>
              <div>
                <h3>How long should I leave brown noise on?</h3>
                <p>Start with 30 to 45 minutes if your thoughts keep looping at bedtime. Go shorter when you mainly need help crossing the first few minutes into sleep.</p>
              </div>
            </div>
          </section>

          <section className="tool-section glass-panel related-tools-panel">
            <h2>More Sleepfast tools for tonight</h2>
            <div className="related-tools-grid">
              {relatedToolLinks.map((tool) => (
                <a key={tool.href} className="related-tool-link glass-subpanel" href={tool.href}>
                  <span className="related-tool-kicker">{tool.kicker}</span>
                  <strong>{tool.title}</strong>
                  <p>{tool.description}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="conversion-story glass-panel tool-cta-panel">
            <div className="conversion-intro">
              <span className="eyebrow">Keep going with Sleepfast</span>
              <h2>Need help with night wake-ups too?</h2>
              <p>
                Go back to the full Sleepfast player for rain, ocean, white noise, brown noise, and a calmer homepage flow built for both bedtime overthinking and middle-of-the-night restarts.
              </p>
            </div>
            <div className="tool-cta-actions">
              <a className="link-button" href="/">
                Open the full Sleepfast player
              </a>
              <a className="text-link" href="/wake-up-at-3am">
                Or try the 3AM wake-up reset
              </a>
            </div>
          </section>
        </section>
      </main>
    )
  }

  if (isSleepBetterTonightPage) {
    return (
      <main className="app-shell tool-shell">
        <section className="tool-hero rain-stage">
          <div className="top-brandbar">
            <a className="brand-lockup" aria-label="Sleepfast home" href="/">
              <CatMark className="brand-cat" />
              <div className="brand-copy">
                <span className="brand-name">Sleepfast</span>
                <span className="brand-tag">sleep better tonight</span>
              </div>
            </a>
          </div>

          <div className="rain-backdrop tool-backdrop" aria-hidden="true">
            <div className="night-vignette" />
            <div className="mist mist-left" />
            <div className="mist mist-right" />
            <div className="city-glow" />
            <div className="window-sheen" />
          </div>

          <div className="tool-layout">
            <section className="tool-copy glass-panel">
              <span className="eyebrow">Sleep better tonight</span>
              <h1>Sleep better tonight with one calmer next step, not a bigger routine.</h1>
              <p className="hero-text tool-subtitle">
                Pick one sound, set one timer, and use a simpler browser bedtime reset when tonight already feels late, restless, or harder to recover than usual.
              </p>
              <div className="result-pills" aria-label="Sleep better tonight benefits">
                <span>Instant browser sleep sounds</span>
                <span>Simple reset for restless nights</span>
                <span>Breathing and calculator bridges</span>
              </div>
              <div className="cta-row">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedSound('rain')
                    setSelectedScenario('cant-sleep')
                    setTimerMinutes(30)
                    await handleTogglePlayback()
                  }}
                >
                  {isPlaying && selectedSound === 'rain' ? 'Pause tonight’s reset' : 'Start sleeping better tonight'}
                </button>
                <a className="text-link" href="#sleep-better-tonight-tool">
                  Jump to tonight’s reset
                </a>
              </div>
              <p className="quiet-line tool-quiet-line">
                Best when tonight is not a full crisis, but you can already feel the room, your thoughts, or your timing drifting away from a clean bedtime.
              </p>
            </section>

            <aside className="player-card player-card-healing glass-panel tool-player-card" id="sleep-better-tonight-tool">
              <div className="now-playing now-playing-minimal">
                <span className="player-kicker">Tonight’s gentler reset</span>
                <h2>{currentSound.name}</h2>
                <p className="comfort-note">
                  The goal tonight is not to optimize sleep perfectly. It is to make the room feel steady enough that sleep has fewer chances to slip away.
                </p>
              </div>

              <div className="sleep-reset-list">
                <button
                  type="button"
                  className={`sleep-reset-item glass-subpanel ${selectedSound === 'rain' && timerMinutes === 30 ? 'active' : ''}`}
                  onClick={async () => {
                    setSelectedScenario('cant-sleep')
                    setSelectedSound('rain')
                    setTimerMinutes(30)
                    if (isPlaying) {
                      await rebuildPlayback(['rain'])
                      timerDeadlineRef.current = Date.now() + 30 * TIMER_SCALE_MS
                      setTimeLeftMs(30 * TIMER_SCALE_MS)
                    }
                  }}
                >
                  <div>
                    <span className="sleep-cycle-kicker">Soft landing preset</span>
                    <strong>Rain on Window · 30 min</strong>
                  </div>
                  <p>Start here when you mainly need the room to feel dimmer, quieter, and easier to stop managing.</p>
                </button>
                <button
                  type="button"
                  className={`sleep-reset-item glass-subpanel ${selectedSound === 'brown' && timerMinutes === 45 ? 'active' : ''}`}
                  onClick={async () => {
                    setSelectedScenario('cant-sleep')
                    setSelectedSound('brown')
                    setTimerMinutes(45)
                    if (isPlaying) {
                      await rebuildPlayback(['brown'])
                      timerDeadlineRef.current = Date.now() + 45 * TIMER_SCALE_MS
                      setTimeLeftMs(45 * TIMER_SCALE_MS)
                    }
                  }}
                >
                  <div>
                    <span className="sleep-cycle-kicker">For noisier thoughts</span>
                    <strong>Brown Noise · 45 min</strong>
                  </div>
                  <p>Switch here if tonight feels mentally louder and silence is making every unfinished thought more noticeable.</p>
                </button>
                <button
                  type="button"
                  className={`sleep-reset-item glass-subpanel ${selectedSound === 'ocean' && timerMinutes === 45 ? 'active' : ''}`}
                  onClick={async () => {
                    setSelectedScenario('cant-sleep')
                    setSelectedSound('ocean')
                    setTimerMinutes(45)
                    if (isPlaying) {
                      await rebuildPlayback(['ocean'])
                      timerDeadlineRef.current = Date.now() + 45 * TIMER_SCALE_MS
                      setTimeLeftMs(45 * TIMER_SCALE_MS)
                    }
                  }}
                >
                  <div>
                    <span className="sleep-cycle-kicker">For longer unwinding</span>
                    <strong>Ocean Waves · 45 min</strong>
                  </div>
                  <p>Use this when you need a slower rhythm and want your body to drift down more gradually before sleep starts.</p>
                </button>
              </div>

              <div className="control-drawer glass-subpanel control-drawer-healing control-drawer-open">
                <div className="player-controls">
                  <div className="timer-block timer-block-minimal">
                    <div className="timer-label-row timer-label-row-minimal">
                      <strong>Tonight’s timer</strong>
                      <span>{formatTimerLabel(timeLeftMs, timerMinutes)}</span>
                    </div>
                    <div className="timer-row">
                      {timerOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={option === timerMinutes ? 'active' : ''}
                          onClick={() => {
                            handleTimerOptionSelect(option)
                          }}
                        >
                          {option} min
                        </button>
                      ))}
                    </div>
                    <div className="custom-timer-row">
                      <label className="custom-timer-label" htmlFor="custom-timer-minutes">
                        Custom minutes
                      </label>
                      <div className="custom-timer-input-wrap">
                        <input
                          id="custom-timer-minutes"
                          className="custom-timer-input"
                          inputMode="numeric"
                          min={1}
                          max={180}
                          step={1}
                          type="number"
                          value={customTimerMinutes}
                          onChange={(event) => {
                            setCustomTimerMinutes(event.target.value)
                          }}
                          onBlur={() => {
                            setCustomTimerMinutes(getCustomTimerValue(customTimerMinutes))
                          }}
                        />
                        <button type="button" className="custom-timer-apply" onClick={handleCustomTimerApply}>
                          Use custom
                        </button>
                      </div>
                      <span className="custom-timer-note">Use 1–180 minutes for naps, longer drift, or travel recovery.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="player-footer player-footer-artful player-footer-healing player-footer-single">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedSound('rain')
                    await handleTogglePlayback()
                  }}
                >
                  {isPlaying && selectedSound === 'rain' ? 'Keep tonight simple' : 'Use the rain reset now'}
                </button>
              </div>

              <div className="tool-bridge-card glass-subpanel">
                <span className="sleep-cycle-kicker">Need help choosing the next move?</span>
                <strong>Do the breathing reset first if your body feels activated, or use the sleep calculator if tonight started late.</strong>
                <p>That keeps this page connected to the two most useful support tools instead of leaving you stuck between broad advice and too many choices.</p>
                <div className="tool-bridge-links">
                  <a className="text-link" href="/sleep-breathing-exercise">
                    Open the breathing reset
                  </a>
                  <a className="text-link" href="/sleep-calculator">
                    Use the sleep calculator
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="tool-sections">
          <section className="tool-section glass-panel">
            <h2>How to sleep better tonight</h2>
            <p>
              Sleeping better tonight usually comes from reducing friction, not adding a bigger system. A steady sound, a short timer, and one calmer next step can be enough to stop a slightly off night from turning into a fully wired one.
            </p>
            <p>
              Sleepfast is built for that in-between state: you know tonight is not flowing well, but you still have a realistic chance to settle it if the room gets softer fast enough.
            </p>
          </section>

          <section className="tool-section glass-panel">
            <h2>A simple plan for tonight</h2>
            <ul className="tool-list">
              <li>Choose the closest sound preset instead of testing too many options in a row.</li>
              <li>Set a timer that covers your first settling window without becoming another thing to monitor.</li>
              <li>If your body feels activated, do the breathing reset first. If your schedule is off, use the sleep calculator and then come back to one sound.</li>
            </ul>
          </section>

          <section className="tool-section glass-panel">
            <h2>FAQ</h2>
            <div className="faq-list">
              <div>
                <h3>What is the best sound if I just want to sleep better tonight?</h3>
                <p>Rain is usually the easiest place to start because it feels softer and less demanding. Brown noise helps more when your own thoughts feel louder than the room.</p>
              </div>
              <div>
                <h3>Should I do breathing or play sounds first?</h3>
                <p>If your chest, jaw, or thoughts feel too activated, do the breathing reset first. If you mainly need the room to feel covered, start with one sound right away.</p>
              </div>
              <div>
                <h3>Can this help if I started bedtime later than I wanted?</h3>
                <p>Yes. Use the sleep calculator to choose a more realistic bedtime target, then come back here and use one sound to make the transition into sleep easier tonight.</p>
              </div>
            </div>
          </section>

          <section className="tool-section glass-panel related-tools-panel">
            <h2>More Sleepfast tools for tonight</h2>
            <div className="related-tools-grid">
              {relatedToolLinks.map((tool) => (
                <a key={tool.href} className="related-tool-link glass-subpanel" href={tool.href}>
                  <span className="related-tool-kicker">{tool.kicker}</span>
                  <strong>{tool.title}</strong>
                  <p>{tool.description}</p>
                </a>
              ))}
            </div>
          </section>

          <section className="conversion-story glass-panel tool-cta-panel">
            <div className="conversion-intro">
              <span className="eyebrow">Keep going with Sleepfast</span>
              <h2>Want the full player after tonight’s quick fix?</h2>
              <p>
                Go back to the full Sleepfast player for rain, ocean, brown noise, white noise, timer presets, saved sounds, and a calmer homepage flow built around faster bedtime recovery.
              </p>
            </div>
            <div className="tool-cta-actions">
              <a className="link-button" href="/">
                Open the full Sleepfast player
              </a>
              <a className="text-link" href="/fall-asleep-fast">
                Or open the bedtime reset
              </a>
            </div>
          </section>
        </section>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <section className="rain-stage">
        <div className="top-brandbar">
          <div className="brand-lockup" aria-label="Sleepfast brand">
            <CatMark className="brand-cat" />
            <div className="brand-copy">
              <span className="brand-name">Sleepfast</span>
              <span className="brand-tag">a softer room for tonight</span>
            </div>
          </div>
        </div>
        <div className={heroScene.backdropClassName} aria-hidden="true">
          <div className={heroScene.vignetteClassName} />
          <div className={heroScene.mistLeftClassName} />
          <div className={heroScene.mistRightClassName} />
          {heroScene.scene === 'ocean' ? (
            <>
              <div className="moon-glow" />
              <div className="ocean-horizon" />
              <div className="ocean-wave-layer ocean-wave-back" />
              <div className="ocean-wave-layer ocean-wave-mid" />
              <div className="ocean-wave-layer ocean-wave-front" />
              <div className="ocean-foam" />
            </>
          ) : null}
          {heroScene.scene === 'rain' ? (
            <>
              <div className="city-glow" />
              <div className="window-sheen" />
              <div className="window-frame frame-left" />
              <div className="window-frame frame-right" />
              <div className="window-frame frame-top" />
              <div className="rain-layer rain-layer-soft" />
            </>
          ) : null}
          {heroScene.scene === 'brown' || heroScene.scene === 'white' ? (
            <>
              <div className="deep-space-glow" />
              <div className="deep-space-orbit deep-space-orbit-one" />
              <div className="deep-space-orbit deep-space-orbit-two" />
              <div className="floating-stars deep-space-stars" />
            </>
          ) : null}
        </div>

        <div className="hero-layout">
          <section className="story-panel">
            <div className="story-copy glass-panel">
              <div className="hero-badge-row">
                <span className="eyebrow">{heroScene.eyebrow}</span>
                <div className="hero-cat-badge" aria-label="Sleepfast cat mark">
                  <CatMark className="hero-cat" />
                </div>
              </div>
              <p className="micro-copy">{heroScene.microCopy}</p>
              <h1>Fall asleep faster tonight without leaving the browser.</h1>
              <p className="hero-text">
                Sleepfast gives you a softer shoreline for sleep — moving water, steady sound, and a simpler browser-first reset for bedtime overthinking, 3AM wake-ups, and hard-to-settle nights.
              </p>
              <p className="result-line">
                Open it, press play, and let one steady layer help you fall asleep faster tonight instead of chasing a different fix every few minutes.
              </p>
              <div className="result-pills result-pills-minimal" aria-label="Sleepfast outcomes">
                <span>Fall asleep faster tonight</span>
                <span>Browser-first sleep reset</span>
                <span>Better for restless nights</span>
              </div>

              <div className="cta-row cta-row-single">
                <button type="button" onClick={() => void handleTogglePlayback()}>
                  {isPlaying ? 'Stay with the tide' : 'Let the waves stay with me'}
                </button>
              </div>

              <p className="quiet-line">No setup. Just one moving horizon, one sound, and a little less to carry into sleep.</p>
            </div>

            <div className="scenario-row scenario-row-whisper">
              <span className="scenario-whisper">If the tide in your head still feels choppy, choose a gentler starting point.</span>
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  className={`scenario-chip scenario-chip-soft ${scenario.id === selectedScenario ? 'active' : ''}`}
                  onClick={() => void applyScenario(scenario)}
                >
                  <span>{scenario.name}</span>
                </button>
              ))}
            </div>
          </section>

          <aside className="player-card player-card-healing glass-panel">
            <div className="now-playing now-playing-minimal">
              <span className="player-kicker">Tonight's shoreline</span>
              <h2>{currentSound.name}</h2>
              <p className="comfort-note">{heroScene.comfortNote}</p>
            </div>

            <div className={heroScene.ambientClassName} aria-hidden="true">
              {heroScene.scene === 'ocean' ? (
                <>
                  <div className="moon-halo" />
                  <div className="moon-core" />
                  <div className="ambient-orb ambient-orb-one" />
                  <div className="ambient-orb ambient-orb-two" />
                  <div className="ambient-grid ambient-grid-soft" />
                  <div className="floating-stars" />
                </>
              ) : null}
              {heroScene.scene === 'rain' ? (
                <>
                  <div className="rain-preview-glow" />
                  <div className="window-sheen ambient-window-sheen" />
                  <div className="window-frame frame-left" />
                  <div className="window-frame frame-right" />
                  <div className="window-frame frame-top" />
                  <div className="rain-layer rain-layer-preview" />
                </>
              ) : null}
              {heroScene.scene === 'brown' || heroScene.scene === 'white' ? (
                <>
                  <div className="noise-halo" />
                  <div className="noise-core" />
                  <div className="ambient-orb ambient-orb-one" />
                  <div className="ambient-orb ambient-orb-two" />
                  <div className="ambient-grid ambient-grid-soft" />
                  <div className="floating-stars" />
                </>
              ) : null}
            </div>

            <div className="ritual-copy">
              <span className="ritual-label">{heroScene.ritualLabel}</span>
              <p>{heroScene.ritualCopy}</p>
            </div>

            <div className="utility-row utility-row-saved">
              <button
                type="button"
                className={`utility-chip ${favoriteSoundIds.includes(selectedSound) ? 'active' : ''}`}
                onClick={() => toggleFavoriteSound(selectedSound)}
              >
                {favoriteSoundIds.includes(selectedSound) ? 'Saved for later' : 'Save this sound'}
              </button>
            </div>

            <div className="player-footer player-footer-artful player-footer-healing player-footer-single">
              <button type="button" onClick={() => void handleTogglePlayback()}>
                {isPlaying ? 'Stay inside the tide' : 'Keep these waves beside me'}
              </button>
              <button
                type="button"
                className="secondary-trigger secondary-trigger-soft"
                onClick={() => setShowControls((value) => !value)}
              >
                {showControls ? 'Hide the little details' : 'If you need to adjust anything'}
              </button>
            </div>

            {showControls ? (
              <div className="control-drawer glass-subpanel control-drawer-healing">
                <div className="mix-panel glass-subpanel">
                  <div className="mix-panel-header">
                    <strong>Sound blend</strong>
                    <span>Layer up to 3 sounds for a softer room.</span>
                  </div>

                  <div className="mix-chip-row">
                    {availableSupportSounds.map((option) => {
                      const isActive = supportSoundIds.includes(option.id)

                      return (
                        <button
                          key={option.id}
                          type="button"
                          className={`mix-chip ${isActive ? 'active' : ''}`}
                          onClick={() => void toggleSupportSound(option.id)}
                        >
                          {isActive ? 'Remove' : 'Add'} {option.name}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mix-layer-list">
                    {activeLayerIds.map((soundId, index) => {
                      const sound = soundOptions.find((option) => option.id === soundId)
                      if (!sound) return null

                      return (
                        <label key={soundId} className="mix-layer-item">
                          <div>
                            <strong>{sound.name}</strong>
                            <span>{index === 0 ? 'Main layer' : 'Support layer'}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={Math.round(layerVolumes[soundId] * 100)}
                            onChange={(event) => void updateLayerVolume(soundId, Number(event.target.value) / 100)}
                            aria-label={`${sound.name} volume`}
                          />
                        </label>
                      )
                    })}
                  </div>
                </div>

                <div className="sound-grid sound-grid-minimal">
                  {soundOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`sound-button ${option.id === selectedSound ? 'active' : ''}`}
                      onClick={async () => {
                        const nextLayerIds = [option.id, ...supportSoundIds.filter((soundId) => soundId !== option.id)]
                        setSelectedSound(option.id)
                        if (isPlaying) {
                          await rebuildPlayback(nextLayerIds)
                        }
                      }}
                    >
                      <strong>{option.name}</strong>
                    </button>
                  ))}
                </div>

                <div className="player-controls">
                  <div className="timer-block timer-block-minimal">
                    <div className="timer-label-row timer-label-row-minimal">
                      <strong>Rest timer</strong>
                      <span>{formatTimerLabel(timeLeftMs, timerMinutes)}</span>
                    </div>
                    <div className="timer-row">
                      {timerOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={option === timerMinutes ? 'active' : ''}
                          onClick={() => {
                            handleTimerOptionSelect(option)
                          }}
                        >
                          {option} min
                        </button>
                      ))}
                    </div>
                    <div className="custom-timer-row">
                      <label className="custom-timer-label" htmlFor="custom-timer-minutes">
                        Custom minutes
                      </label>
                      <div className="custom-timer-input-wrap">
                        <input
                          id="custom-timer-minutes"
                          className="custom-timer-input"
                          inputMode="numeric"
                          min={1}
                          max={180}
                          step={1}
                          type="number"
                          value={customTimerMinutes}
                          onChange={(event) => {
                            setCustomTimerMinutes(event.target.value)
                          }}
                          onBlur={() => {
                            setCustomTimerMinutes(getCustomTimerValue(customTimerMinutes))
                          }}
                        />
                        <button type="button" className="custom-timer-apply" onClick={handleCustomTimerApply}>
                          Use custom
                        </button>
                      </div>
                      <span className="custom-timer-note">Use 1–180 minutes for naps, longer drift, or travel recovery.</span>
                    </div>
                  </div>
                </div>

                <div className="saved-panel glass-subpanel">
                  <div className="saved-panel-section">
                    <div className="saved-panel-header">
                      <strong>Saved for later</strong>
                      <span>Keep go-to sounds one tap away.</span>
                    </div>
                    <div className="saved-chip-row">
                      {favoriteSounds.length > 0 ? (
                        favoriteSounds.map((sound) => (
                          <button key={sound.id} type="button" className="saved-sound-chip" onClick={() => void startSavedSound(sound.id)}>
                            {sound.name}
                          </button>
                        ))
                      ) : (
                        <p className="saved-empty-state">Save the sound you want to come back to tomorrow night.</p>
                      )}
                    </div>
                  </div>

                  <div className="saved-panel-section">
                    <div className="saved-panel-header">
                      <strong>Recent tonight</strong>
                      <span>Restart the last room you used.</span>
                    </div>
                    <div className="saved-chip-row">
                      {recentSounds.length > 0 ? (
                        recentSounds.map((sound) => (
                          <button key={sound.id} type="button" className="saved-sound-chip" onClick={() => void startSavedSound(sound.id)}>
                            {sound.name}
                          </button>
                        ))
                      ) : (
                        <p className="saved-empty-state">Play one sound once and it will show up here for faster restarts.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </section>

      <section className="result-strip" aria-label="Sleepfast results">
        <div className="result-strip-panel glass-panel">
          <div className="result-strip-copy">
            <span className="eyebrow">What Sleepfast helps you do tonight</span>
            <h2>Use the browser-first tool that matches the way sleep is getting stuck.</h2>
            <p>
              Start here when you need more than a pretty sound page: faster sleep starts, calmer
              3AM restarts, and simpler support for nights when your mind will not slow down.
            </p>
          </div>

          <div className="result-strip-grid">
            <a className="result-strip-card glass-subpanel" href="/fall-asleep-fast">
              <span className="result-strip-kicker">Fall asleep faster</span>
              <strong>Start a lower-friction bedtime reset.</strong>
              <p>Use one simple sound-and-timer flow when you feel tired but sleep still will not begin.</p>
            </a>

            <a className="result-strip-card glass-subpanel" href="/wake-up-at-3am">
              <span className="result-strip-kicker">Restart sleep after waking</span>
              <strong>Get back down without turning on a full awake mode.</strong>
              <p>Open a short white-noise reset built for the middle of the night instead of more stimulation.</p>
            </a>

            <a className="result-strip-card glass-subpanel" href="/mind-racing-at-night">
              <span className="result-strip-kicker">Calm racing thoughts</span>
              <strong>Ground mental noise before it drags bedtime longer.</strong>
              <p>Switch to a deeper brown-noise layer when silence makes looping thoughts feel louder.</p>
            </a>
          </div>
        </div>
      </section>

      <section className="tool-directory" aria-label="Sleepfast sleep tools">
        <div className="tool-directory-panel glass-panel">
          <div className="tool-directory-copy">
            <span className="eyebrow">Sleep tools for specific nights</span>
            <h2>Start with the exact sleep problem you want to solve tonight.</h2>
            <p>
              Sleepfast is not just one pretty sound page. Use the tool that fits your night best, then come back to the full player when you want a softer all-around bedtime room.
            </p>
          </div>

          <div className="tool-directory-grid">
            <a className="tool-directory-card glass-subpanel" href="/white-noise-for-sleep">
              <span className="tool-directory-kicker">For light sleepers</span>
              <strong>White noise for sleep</strong>
              <p>Start instant masking for house noise, neighbors, and middle-of-the-night wake-ups.</p>
            </a>
            <a className="tool-directory-card glass-subpanel" href="/brown-noise-for-sleep">
              <span className="tool-directory-kicker">For mental chatter</span>
              <strong>Brown noise for sleep</strong>
              <p>Use a deeper sound layer when silence makes your thoughts or city noise feel louder.</p>
            </a>
            <a className="tool-directory-card glass-subpanel" href="/sleep-calculator">
              <span className="tool-directory-kicker">For bedtime timing</span>
              <strong>Sleep calculator</strong>
              <p>Find a realistic bedtime based on sleep cycles, then start sleep sounds right away.</p>
            </a>
            <a className="tool-directory-card glass-subpanel" href="/nap-calculator">
              <span className="tool-directory-kicker">For daytime recovery</span>
              <strong>Nap calculator</strong>
              <p>See when to wake up from a 20, 30, or 90 minute nap without opening another app.</p>
            </a>
            <a className="tool-directory-card glass-subpanel" href="/sleep-breathing-exercise">
              <span className="tool-directory-kicker">For fast calming</span>
              <strong>Sleep breathing exercise</strong>
              <p>Do a short 4-7-8 reset before switching into your main sleep sound for the night.</p>
            </a>
            <a className="tool-directory-card glass-subpanel" href="/fall-asleep-fast">
              <span className="tool-directory-kicker">For tonight's reset</span>
              <strong>Fall asleep fast</strong>
              <p>Use a simpler browser-first reset when you feel tired but sleep still will not start.</p>
            </a>
            <a className="tool-directory-card glass-subpanel" href="/wake-up-at-3am">
              <span className="tool-directory-kicker">For night wake-ups</span>
              <strong>Wake up at 3AM</strong>
              <p>Restart sleep faster with a short white-noise reset instead of fully waking yourself up.</p>
            </a>
            <a className="tool-directory-card glass-subpanel" href="/mind-racing-at-night">
              <span className="tool-directory-kicker">For racing thoughts</span>
              <strong>Mind racing at night</strong>
              <p>Ground bedtime overthinking with deeper brown noise and a calmer, lower-input routine.</p>
            </a>
          </div>
        </div>
      </section>

      <section className="conversion-strip conversion-strip-story" aria-label="Sleepfast email and premium signup">
        <div className="conversion-story glass-panel">
          <div className="conversion-intro">
            <span className="eyebrow">For softer nights ahead</span>
            <h2>Keep close if you want gentler nights, not more noise.</h2>
            <p>
              Leave your email if you want soft sleep notes, kinder bedtime ideas, and first
              access when Sleepfast grows into a deeper overnight companion.
            </p>
          </div>

          <form className="signup-form signup-form-story" onSubmit={handleEmailSubmit}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
                if (emailSubmitted) setEmailSubmitted(false)
              }}
              aria-label="Email address"
              required
            />
            <button type="submit">Stay close to launch</button>
          </form>

          <p className="form-note form-note-story">
            {emailSubmitted
              ? `Saved ${email.trim()} for early Sleepfast access.`
              : 'No pressure. Just a quiet note when something genuinely better is ready.'}
          </p>

          <div className="premium-preview" id="membership" aria-label="Sleepfast premium preview">
            <div className="premium-preview-copy">
              <span className="eyebrow">Sleepfast premium preview</span>
              <h3>Free helps you settle tonight. Premium is for harder overnight nights.</h3>
              <p>
                Keep the free player for instant sleep sounds and short timers. Upgrade when you want longer overnight playback, calmer restarts after waking up, and presets built for more specific sleep problems.
              </p>
            </div>

            <div className="premium-compare-grid">
              <div className="premium-tier glass-subpanel">
                <span className="premium-tier-label">Free tonight</span>
                <ul>
                  <li>Instant browser sleep sounds</li>
                  <li>10 to 60 minute timer presets</li>
                  <li>Quick help for falling asleep faster</li>
                </ul>
              </div>

              <div className="premium-tier premium-tier-highlight glass-subpanel">
                <span className="premium-tier-label">Premium overnight</span>
                <ul>
                  <li>Longer playback for all-night rooms</li>
                  <li>Night waking restart mode for 3 AM wake-ups</li>
                  <li>More targeted presets for noise, stress, and racing thoughts</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
