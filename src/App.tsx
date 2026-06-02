import { useEffect, useMemo, useRef, useState } from 'react'
import CatMark from './catMark'

type SoundId = 'rain' | 'ocean' | 'brown' | 'white'
type TimerOption = 10 | 20 | 30 | 45

type SleepCycle = {
  label: string
  bedtime: string
  sleepTime: string
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

const timerOptions: TimerOption[] = [10, 20, 30, 45]
const TIMER_SCALE_MS = 1000
const FALL_ASLEEP_BUFFER_MINUTES = 15
const SLEEP_CYCLE_MINUTES = 90
const toolLinks: ToolLink[] = [
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
    href: '/sleep-calculator',
    kicker: 'For bedtime timing',
    title: 'Sleep calculator',
    description: 'Pick a wake-up time and get realistic bedtime targets built around sleep cycles.',
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
  const isSleepCalculatorPage = normalizedPath === '/sleep-calculator'
  const isFallAsleepFastPage = normalizedPath === '/fall-asleep-fast'
  const isWakeUpAt3amPage = normalizedPath === '/wake-up-at-3am'
  const isMindRacingAtNightPage = normalizedPath === '/mind-racing-at-night'
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(false)
  const volume = 0.55
  const [timerMinutes, setTimerMinutes] = useState<TimerOption>(20)
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null)
  const [email, setEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)

  const audioContextRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const noiseSourceRef = useRef<AudioBufferSourceNode | OscillatorNode | null>(null)
  const modulatorRef = useRef<OscillatorNode | null>(null)
  const secondaryGainRef = useRef<GainNode | null>(null)
  const timerDeadlineRef = useRef<number | null>(null)

  const currentSound = useMemo(
    () => soundOptions.find((option) => option.id === selectedSound) ?? soundOptions[0],
    [selectedSound],
  )
  const heroScene = useMemo(() => getHeroScene(selectedSound), [selectedSound])
  const sleepCycles = useMemo(() => buildSleepCycles(timeInputToMinutes(wakeTime)), [wakeTime])
  const relatedToolLinks = useMemo(
    () => toolLinks.filter((tool) => tool.href !== normalizedPath).slice(0, 3),
    [normalizedPath],
  )

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
  }, [isBrownNoisePage, isMindRacingAtNightPage, isWakeUpAt3amPage, isWhiteNoisePage])

  useEffect(() => {
    const title = isWhiteNoisePage
        ? 'White Noise for Sleep — Play Instantly in Your Browser | Sleepfast'
      : isBrownNoisePage
        ? 'Brown Noise for Sleep — Play Instantly in Your Browser | Sleepfast'
        : isSleepCalculatorPage
          ? 'Sleep Calculator — Best Bedtime and Wake Time Tool | Sleepfast'
          : isFallAsleepFastPage
            ? 'Fall Asleep Fast — Sleep Sounds and Bedtime Reset | Sleepfast'
            : isWakeUpAt3amPage
              ? 'Wake Up at 3AM — Fall Back Asleep Faster | Sleepfast'
              : isMindRacingAtNightPage
                ? 'Mind Racing at Night — Calm Down and Fall Asleep Faster | Sleepfast'
            : 'Sleepfast — Fall asleep faster tonight'
    const description = isWhiteNoisePage
        ? 'Play white noise for sleep instantly in your browser with a simple timer, light-sleeper masking, and a calmer way to restart sleep after waking up at night.'
      : isBrownNoisePage
        ? 'Play brown noise for sleep instantly in your browser with a deeper low-end layer for racing thoughts, city noise, and harder-to-settle nights.'
        : isSleepCalculatorPage
          ? 'Use the Sleepfast sleep calculator to find better bedtimes based on 90-minute sleep cycles, then start sleep sounds right away in your browser.'
          : isFallAsleepFastPage
            ? 'Fall asleep fast with instant browser sleep sounds, a simple bedtime reset, and calmer steps for racing thoughts or noisy nights.'
            : isWakeUpAt3amPage
              ? 'Use Sleepfast to fall back asleep after waking up at 3AM with instant white noise, a short restart timer, and a calmer middle-of-the-night reset.'
              : isMindRacingAtNightPage
                ? 'Use Sleepfast when your mind is racing at night with instant brown noise, a simple timer, and a calmer reset built for overstimulated bedtimes.'
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
  }, [isBrownNoisePage, isFallAsleepFastPage, isMindRacingAtNightPage, isSleepCalculatorPage, isWakeUpAt3amPage, isWhiteNoisePage])

  const stopPlayback = () => {
    noiseSourceRef.current?.stop?.()
    noiseSourceRef.current?.disconnect()
    noiseSourceRef.current = null

    modulatorRef.current?.stop?.()
    modulatorRef.current?.disconnect()
    modulatorRef.current = null

    secondaryGainRef.current?.disconnect()
    secondaryGainRef.current = null

    setIsPlaying(false)
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

  const startSound = async (soundId: SoundId) => {
    const context = ensureAudioGraph()

    if (context.state === 'suspended') {
      await context.resume()
    }

    stopPlayback()

    const masterGain = masterGainRef.current
    if (!masterGain) return

    if (soundId === 'white' || soundId === 'brown') {
      const source = context.createBufferSource()
      source.buffer = createNoiseBuffer(context, soundId)
      source.loop = true

      const filter = context.createBiquadFilter()
      filter.type = soundId === 'brown' ? 'lowpass' : 'bandpass'
      filter.frequency.value = soundId === 'brown' ? 650 : 1800
      filter.Q.value = soundId === 'brown' ? 0.2 : 0.7

      source.connect(filter)
      filter.connect(masterGain)
      source.start()
      noiseSourceRef.current = source
      setIsPlaying(true)
      return
    }

    const noise = context.createBufferSource()
    noise.buffer = createNoiseBuffer(context, 'white')
    noise.loop = true

    const filter = context.createBiquadFilter()
    filter.type = soundId === 'rain' ? 'lowpass' : 'bandpass'
    filter.frequency.value = soundId === 'rain' ? 1100 : 750
    filter.Q.value = soundId === 'rain' ? 0.4 : 1.3

    const shapedGain = context.createGain()
    shapedGain.gain.value = soundId === 'rain' ? 0.32 : 0.22

    noise.connect(filter)
    filter.connect(shapedGain)
    shapedGain.connect(masterGain)

    const modulator = context.createOscillator()
    modulator.type = 'sine'
    modulator.frequency.value = soundId === 'rain' ? 0.11 : 0.07

    const modulationDepth = context.createGain()
    modulationDepth.gain.value = soundId === 'rain' ? 0.06 : 0.12

    modulator.connect(modulationDepth)
    modulationDepth.connect(shapedGain.gain)

    noise.start()
    modulator.start()

    noiseSourceRef.current = noise
    modulatorRef.current = modulator
    secondaryGainRef.current = shapedGain
    setIsPlaying(true)
  }

  const handleTogglePlayback = async () => {
    if (isPlaying) {
      stopPlayback()
      timerDeadlineRef.current = null
      setTimeLeftMs(null)
      return
    }

    await startSound(selectedSound)
    timerDeadlineRef.current = Date.now() + timerMinutes * TIMER_SCALE_MS
    setTimeLeftMs(timerMinutes * TIMER_SCALE_MS)
  }

  const applyScenario = async (scenario: Scenario) => {
    setSelectedScenario(scenario.id)
    setSelectedSound(scenario.soundId)
    setTimerMinutes(scenario.timer)

    if (isPlaying) {
      await startSound(scenario.soundId)
      timerDeadlineRef.current = Date.now() + scenario.timer * TIMER_SCALE_MS
      setTimeLeftMs(scenario.timer * TIMER_SCALE_MS)
    }
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
        stopPlayback()
        timerDeadlineRef.current = null
        setTimeLeftMs(null)
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
                            setTimerMinutes(option)
                            if (isPlaying) {
                              timerDeadlineRef.current = Date.now() + option * TIMER_SCALE_MS
                              setTimeLeftMs(option * TIMER_SCALE_MS)
                            }
                          }}
                        >
                          {option} min
                        </button>
                      ))}
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
                <span>Simple 10 to 45 minute timer</span>
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
                          await startSound(option.id)
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
                            setTimerMinutes(option)
                            if (isPlaying) {
                              timerDeadlineRef.current = Date.now() + option * TIMER_SCALE_MS
                              setTimeLeftMs(option * TIMER_SCALE_MS)
                            }
                          }}
                        >
                          {option} min
                        </button>
                      ))}
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
                      await startSound('rain')
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
                            setTimerMinutes(option)
                            if (isPlaying) {
                              timerDeadlineRef.current = Date.now() + option * TIMER_SCALE_MS
                              setTimeLeftMs(option * TIMER_SCALE_MS)
                            }
                          }}
                        >
                          {option} min
                        </button>
                      ))}
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
                <span>Simple 20 to 45 minute timer</span>
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
                      await startSound('brown')
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
                      await startSound('white')
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
                            setTimerMinutes(option)
                            if (isPlaying) {
                              timerDeadlineRef.current = Date.now() + option * TIMER_SCALE_MS
                              setTimeLeftMs(option * TIMER_SCALE_MS)
                            }
                          }}
                        >
                          {option} min
                        </button>
                      ))}
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
                <div className="sound-grid sound-grid-minimal">
                  {soundOptions.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`sound-button ${option.id === selectedSound ? 'active' : ''}`}
                      onClick={async () => {
                        setSelectedSound(option.id)
                        if (isPlaying) {
                          await startSound(option.id)
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
                            setTimerMinutes(option)
                            if (isPlaying) {
                              timerDeadlineRef.current = Date.now() + option * TIMER_SCALE_MS
                              setTimeLeftMs(option * TIMER_SCALE_MS)
                            }
                          }}
                        >
                          {option} min
                        </button>
                      ))}
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
                  <li>10 to 45 minute timer presets</li>
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
