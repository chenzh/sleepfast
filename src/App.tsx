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

const rainDrops = Array.from({ length: 58 }, (_, index) => ({
  id: index,
  left: `${(index * 1.77) % 100}%`,
  delay: `${(index % 17) * 0.19}s`,
  duration: `${1.7 + (index % 7) * 0.22}s`,
  opacity: 0.12 + (index % 5) * 0.06,
}))

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

const App = () => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const isWhiteNoisePage = normalizedPath === '/white-noise-for-sleep'
  const isBrownNoisePage = normalizedPath === '/brown-noise-for-sleep'
  const isSleepCalculatorPage = normalizedPath === '/sleep-calculator'
  const isFallAsleepFastPage = normalizedPath === '/fall-asleep-fast'
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
  const sleepCycles = useMemo(() => buildSleepCycles(timeInputToMinutes(wakeTime)), [wakeTime])

  useEffect(() => {
    if (isWhiteNoisePage) {
      setSelectedSound('white')
      setSelectedScenario('wake-up-3am')
      setTimerMinutes(30)
    }

    if (isBrownNoisePage) {
      setSelectedSound('brown')
      setSelectedScenario('cant-sleep')
      setTimerMinutes(45)
    }
  }, [isBrownNoisePage, isWhiteNoisePage])

  useEffect(() => {
    const title = isWhiteNoisePage
      ? 'White Noise for Sleep — Play Instantly in Your Browser | Sleepfast'
      : isBrownNoisePage
        ? 'Brown Noise for Sleep — Play Instantly in Your Browser | Sleepfast'
        : isSleepCalculatorPage
          ? 'Sleep Calculator — Best Bedtime and Wake Time Tool | Sleepfast'
          : isFallAsleepFastPage
            ? 'Fall Asleep Fast — Sleep Sounds and Bedtime Reset | Sleepfast'
            : 'Sleepfast — Fall asleep faster tonight'
    const description = isWhiteNoisePage
      ? 'Play white noise for sleep instantly in your browser with a simple timer, light-sleeper masking, and a calmer way to restart sleep after waking up at night.'
      : isBrownNoisePage
        ? 'Play brown noise for sleep instantly in your browser with a deeper low-end layer for racing thoughts, city noise, and harder-to-settle nights.'
        : isSleepCalculatorPage
          ? 'Use the Sleepfast sleep calculator to find better bedtimes based on 90-minute sleep cycles, then start sleep sounds right away in your browser.'
          : isFallAsleepFastPage
            ? 'Fall asleep fast with instant browser sleep sounds, a simple bedtime reset, and calmer steps for racing thoughts or noisy nights.'
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
  }, [isBrownNoisePage, isFallAsleepFastPage, isSleepCalculatorPage, isWhiteNoisePage])

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
        <div className="rain-backdrop" aria-hidden="true">
          <div className="night-vignette" />
          <div className="mist mist-left" />
          <div className="mist mist-right" />
          <div className="city-glow" />
          <div className="window-frame frame-left" />
          <div className="window-frame frame-right" />
          <div className="window-frame frame-top" />
          <div className="window-sheen" />
          <div className="rain-layer">
            {rainDrops.map((drop) => (
              <span
                key={drop.id}
                className="rain-drop"
                style={{
                  left: drop.left,
                  animationDelay: drop.delay,
                  animationDuration: drop.duration,
                  opacity: drop.opacity,
                }}
              />
            ))}
          </div>
        </div>

        <div className="hero-layout">
          <section className="story-panel">
            <div className="story-copy glass-panel">
              <div className="hero-badge-row">
                <span className="eyebrow">Rain at the window</span>
                <div className="hero-cat-badge" aria-label="Sleepfast cat mark">
                  <CatMark className="hero-cat" />
                </div>
              </div>
              <p className="micro-copy">Built to help you fall asleep faster tonight — and restart sleep faster after a rough 3 AM wake-up.</p>
              <h1>Come back to the softest part of the night.</h1>
              <p className="hero-text">
                Sleepfast gives you instant browser-based sleep sounds for racing thoughts, noisy rooms, and the fragile stretch between feeling tired and actually drifting off.
              </p>
              <p className="result-line">
                Not another sleep system to manage — just a calmer way to fall asleep faster, stay less reactive to noise, and gently settle back down when sleep breaks.
              </p>
              <div className="result-pills result-pills-minimal" aria-label="Sleepfast outcomes">
                <span>Fall asleep faster tonight</span>
                <span>Restart sleep after wake-ups</span>
              </div>

              <div className="cta-row cta-row-single">
                <button type="button" onClick={() => void handleTogglePlayback()}>
                  {isPlaying ? 'Stay here a little longer' : 'Let the rain stay with me'}
                </button>
              </div>

              <p className="quiet-line">No setup. No effort. Just one softer thing to reach for before sleep.</p>
            </div>

            <div className="scenario-row scenario-row-whisper">
              <span className="scenario-whisper">If tonight feels restless, you can still choose a gentler starting point.</span>
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
              <span className="player-kicker">Tonight's comfort</span>
              <h2>{currentSound.name}</h2>
              <p className="comfort-note">A small moonlit corner for the moment your shoulders are tired, but the rest of you has not landed yet.</p>
            </div>

            <div className="ambient-preview ambient-preview-healing" aria-hidden="true">
              <div className="moon-halo" />
              <div className="moon-core" />
              <div className="ambient-orb ambient-orb-one" />
              <div className="ambient-orb ambient-orb-two" />
              <div className="ambient-grid ambient-grid-soft" />
              <div className="floating-stars" />
            </div>

            <div className="ritual-copy">
              <span className="ritual-label">Bedtime ritual</span>
              <p>Choose one sound, dim the room, and stay with it without adjusting much. The calmer this feels, the better it works.</p>
            </div>

            <div className="player-footer player-footer-artful player-footer-healing player-footer-single">
              <button type="button" onClick={() => void handleTogglePlayback()}>
                {isPlaying ? 'Stay inside the quiet' : 'Keep this beside me'}
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
