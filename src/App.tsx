import { useEffect, useMemo, useRef, useState } from 'react'

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

  return (
    <main className="app-shell">
      <section className="rain-stage">
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
              <span className="eyebrow">Rain at the window</span>
              <p className="micro-copy">Quiet enough for the last few thoughts of the day to fade.</p>
              <h1>When the room softens, sleep feels closer.</h1>
              <p className="hero-text">
                Press play and let the rain stay with you until the night stops feeling so loud.
              </p>
              <p className="result-line">
                Built to help you fall asleep faster tonight — and restart sleep faster after night waking.
              </p>
              <div className="result-pills" aria-label="Sleepfast outcomes">
                <span>Browser-first sleep sounds</span>
                <span>For racing thoughts</span>
                <span>For 3 AM wakeups</span>
              </div>

              <div className="cta-row">
                <button type="button" onClick={() => void handleTogglePlayback()}>
                  {isPlaying ? 'Pause the night' : 'Start the rain'}
                </button>
              </div>

              <p className="quiet-line">No app. No tabs to figure out. Just a softer room for tonight.</p>
            </div>

            <div className="scenario-row">
              {scenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  className={`scenario-chip ${scenario.id === selectedScenario ? 'active' : ''}`}
                  onClick={() => void applyScenario(scenario)}
                >
                  <span>{scenario.name}</span>
                </button>
              ))}
            </div>
          </section>

          <aside className="player-card glass-panel">
            <div className="now-playing now-playing-minimal">
              <span className="player-kicker">Tonight's sound</span>
              <h2>{currentSound.name}</h2>
            </div>

            <div className="ambient-preview" aria-hidden="true">
              <div className="ambient-orb ambient-orb-one" />
              <div className="ambient-orb ambient-orb-two" />
              <div className="ambient-grid" />
            </div>

            <div className="player-footer player-footer-artful">
              <button type="button" onClick={() => void handleTogglePlayback()}>
                {isPlaying ? 'Pause the rain' : 'Play this sound'}
              </button>
              <button
                type="button"
                className="secondary-trigger"
                onClick={() => setShowControls((value) => !value)}
              >
                {showControls ? 'Hide the controls' : 'Shape the night'}
              </button>
            </div>

            {showControls ? (
              <div className="control-drawer glass-subpanel">
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
                      <strong>Timer</strong>
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
            <h2>Sleepfast should feel calm before it asks for anything.</h2>
            <p>
              Leave your email if you want quiet sleep notes, gentler night routines, and first
              access when deeper overnight scenes are ready.
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
            <span className="promise-line">Later, premium becomes a deeper overnight room — longer rain, softer transitions, less waking.</span>
            <button type="button" className="promise-button">See premium</button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
