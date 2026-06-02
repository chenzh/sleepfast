import { useEffect, useMemo, useRef, useState } from 'react'
import CatMark from './catMark'

type SoundId = 'rain' | 'ocean' | 'brown' | 'white'
type TimerOption = 10 | 20 | 30 | 45

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

const App = () => {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/'
  const normalizedPath = pathname.replace(/\/+$/, '') || '/'
  const isWhiteNoisePage = normalizedPath === '/white-noise-for-sleep'
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

  useEffect(() => {
    if (isWhiteNoisePage) {
      setSelectedSound('white')
      setSelectedScenario('wake-up-3am')
      setTimerMinutes(30)
    }
  }, [isWhiteNoisePage])

  useEffect(() => {
    const title = isWhiteNoisePage
      ? 'White Noise for Sleep — Play Instantly in Your Browser | Sleepfast'
      : 'Sleepfast — Fall asleep faster tonight'
    const description = isWhiteNoisePage
      ? 'Play white noise for sleep instantly in your browser with a simple timer, light-sleeper masking, and a calmer way to restart sleep after waking up at night.'
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
  }, [isWhiteNoisePage])

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

  if (isWhiteNoisePage) {
    return (
      <main className="app-shell tool-shell">
        <section className="tool-hero rain-stage">
          <div className="top-brandbar">
            <a className="brand-lockup" aria-label="Sleepfast home" href="/">
              <CatMark className="brand-cat" />
              <div className="brand-copy">
                <span className="brand-name">Sleepfast</span>
                <span className="brand-tag">white noise for lighter sleepers</span>
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
              <span className="eyebrow">White noise for sleep</span>
              <h1>Block late-night sounds and drift back faster.</h1>
              <p className="hero-text tool-subtitle">
                Play steady white noise instantly in your browser for light sleep, noisy apartments,
                and those wakeups where every little sound suddenly feels too sharp.
              </p>
              <div className="result-pills" aria-label="White noise sleep benefits">
                <span>Instant browser playback</span>
                <span>Better for light sleepers</span>
                <span>Simple rest timer</span>
              </div>
              <div className="cta-row">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedSound('white')
                    await handleTogglePlayback()
                  }}
                >
                  {isPlaying && selectedSound === 'white' ? 'Pause white noise' : 'Play white noise now'}
                </button>
                <a className="text-link" href="/">
                  Try the full Sleepfast homepage
                </a>
              </div>
              <p className="quiet-line tool-quiet-line">
                Best for light sleepers, city apartments, shared walls, and 3 AM wakeups that need a softer reset.
              </p>
            </section>

            <aside className="player-card player-card-healing glass-panel tool-player-card">
              <div className="now-playing now-playing-minimal">
                <span className="player-kicker">Now playing</span>
                <h2>White Noise</h2>
                <p className="comfort-note">A steady broadband layer that helps mask sudden sound changes before they pull you fully awake.</p>
              </div>

              <div className="player-footer player-footer-artful player-footer-healing player-footer-single">
                <button
                  type="button"
                  onClick={async () => {
                    setSelectedSound('white')
                    await handleTogglePlayback()
                  }}
                >
                  {isPlaying && selectedSound === 'white' ? 'Pause the layer' : 'Keep this running'}
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
            <h2>Why white noise helps with sleep</h2>
            <p>
              White noise spreads evenly across frequencies, which makes it useful for masking sharp changes like traffic,
              hallway noise, or a partner moving around beside you.
            </p>
            <p>
              If your sleep gets interrupted by little sounds more than by racing thoughts, white noise is often the simplest
              place to start.
            </p>
          </section>

          <section className="tool-section glass-panel">
            <h2>When to use it</h2>
            <ul className="tool-list">
              <li>When you fall asleep lightly and wake easily to background noise.</li>
              <li>When city noise, shared walls, or hallway sounds keep breaking the room open.</li>
              <li>When you wake up at 3 AM and need one steady layer before trying to drift back.</li>
            </ul>
          </section>

          <section className="tool-section glass-panel">
            <h2>FAQ</h2>
            <div className="faq-list">
              <div>
                <h3>Is white noise better than rain sounds?</h3>
                <p>Usually for masking sudden background noise, yes. Rain can feel softer emotionally, but white noise is often stronger for consistent sound coverage.</p>
              </div>
              <div>
                <h3>Can I use this after waking up in the middle of the night?</h3>
                <p>Yes. This page is built for quick restarts too — press play, set a short timer, and avoid over-adjusting once it feels steady.</p>
              </div>
              <div>
                <h3>What if white noise feels too bright?</h3>
                <p>Try brown noise from Sleepfast next. It has more low-end weight and can feel gentler when your mind feels overstimulated instead of just noise-sensitive.</p>
              </div>
            </div>
          </section>

          <section className="conversion-story glass-panel tool-cta-panel">
            <div className="conversion-intro">
              <span className="eyebrow">Keep going with Sleepfast</span>
              <h2>Need something gentler than plain white noise?</h2>
              <p>
                Go back to the full Sleepfast experience for rain, ocean, brown noise, and softer bedtime framing built for tonight's specific kind of restless.
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
              <p className="micro-copy">For the few minutes when the house is quiet, but your mind still isn't.</p>
              <h1>Come back to the softest part of the night.</h1>
              <p className="hero-text">
                Let one gentle sound stay in the room long enough for your breathing to slow and your thoughts to stop asking so much of you.
              </p>
              <p className="result-line">
                Not a sleep system to manage — just one calm companion for the tender stretch between being tired and actually drifting off.
              </p>
              <div className="result-pills result-pills-minimal" aria-label="Sleepfast outcomes">
                <span>One-tap calm</span>
                <span>For hard-to-settle nights</span>
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

          <div className="promise-row" id="membership">
            <span className="promise-line">Later, premium becomes a deeper overnight room — longer rain, softer fades, gentler returns to sleep.</span>
            <button type="button" className="promise-button">See the quieter version</button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
