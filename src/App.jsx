import { useEffect, useRef, useState } from 'react'
import './App.css'
import { DroneScene, useDroneProgress } from './components/DroneScene'

/* â”€â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const SPECS = [
  { label: 'Flight Time', value: '30 min' },
  { label: 'Range', value: '25 km' },
  { label: 'Max Payload', value: '5 kg' },
  { label: 'Top Speed', value: '100 km/h' },
  { label: 'Ceiling', value: '4000 m' },
  { label: 'IP Rating', value: 'IP56' },
  { label: 'Deployment', value: '< 90 s' },
  { label: 'Sensors', value: 'RGB + Thermal' },
]

const COMPONENTS = [
  { label: 'Flight Controller', value: 'Pixhawk 6X' },
  { label: 'AI Computer', value: 'Jetson Orin Nano' },
  { label: 'RGB Camera', value: 'Arducam IMX519' },
  { label: 'Thermal Camera', value: 'FLIR Lepton 3.5' },
  { label: 'Gimbal', value: 'Tarot 2D' },
  { label: 'Batteries', value: '2× Tattu 30Ah 12S' },
  { label: 'BMS', value: 'Mauch PL-200' },
  { label: 'Telemetry', value: 'RFD900x' },
  { label: 'GPS / RTK', value: 'Holybro H-RTK F9P' },
  { label: 'Motors', value: '4× T-Motor U8 Pro' },
  { label: 'ESCs', value: '4× T-Motor Alpha 60A' },
  { label: 'Propellers', value: 'Carbon Props' },
  { label: 'Frame', value: 'Custom Composite' },
]

const STORY_STEPS = [
  {
    tag: '01 — Deploy',
    title: 'Assembled & ready.',
    body: 'FALCON launches in under 90 seconds. One tap from the rescue coordination center deploys the full unit — no technician on site required.',
  },
  {
    tag: '02 — Anatomy',
    title: 'Precision engineering, exposed.',
    body: 'The modular airframe separates into Corpus and Head — field-swappable in under three minutes. Every component is designed to survive Alpine conditions.',
  },
  {
    tag: '03 — Integrity',
    title: 'Back together. Mission ready.',
    body: 'Autonomous reassembly confirmation. FALCON verifies structural integrity before every flight. Zero single points of failure.',
  },
]

const TEAM = [
  { name: 'Lukas Mueller', role: 'Mechanical Engineering · TUM', img: '/lukas.jpg' },
  { name: 'Linus Richter', role: 'Computer Science · TUM', img: '/linus.jpg' },
  { name: 'Shawn Blender', role: 'Computer Science · LMU', img: '/shawn.jpg' },
]

/* â”€â”€â”€ Active story section tracker â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function useActiveSection(progressRef, count) {
  const [active, setActive] = useState(0)
  useEffect(() => {
    // Map full scroll progress to story steps linearly
    // Story section starts around 25% scroll, uses ~65% of total scroll space
    let raf
    const tick = () => {
      const p = progressRef.current // 0â€“1
      const storyStart = 0.15
      const storyEnd = 0.85
      const local = Math.max(0, Math.min(1, (p - storyStart) / (storyEnd - storyStart)))
      setActive(Math.min(count - 1, Math.floor(local * count)))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [progressRef, count])
  return active
}

/* â”€â”€â”€ Nav scroll-awareness â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function useScrolled(threshold = 60) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return scrolled
}

/* â”€â”€â”€ App â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function App() {
  const progressRef = useDroneProgress()
  const activeSection = useActiveSection(progressRef, STORY_STEPS.length)
  const navScrolled = useScrolled()
  const [componentsOpen, setComponentsOpen] = useState(false)

  return (
    <div className="app-shell">

      {/* â”€â”€ Fixed 3-D canvas â”€â”€ */}
      <div className="canvas-fixed" aria-hidden="true">
        <DroneScene progressRef={progressRef} />
      </div>

      {/* â”€â”€ Nav â”€â”€ */}
      <header className={`site-header${navScrolled ? ' scrolled' : ''}`}>
        <a className="brand" href="#hero">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          FALCON
        </a>
        <nav className="site-nav">
          <a href="#story">Story</a>
          <a href="#specs">Specs</a>
          <a href="#team">Team</a>
        </nav>
        <a className="nav-cta" href="#contact">Request demo</a>
      </header>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          HERO
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="hero-section" id="hero">
        <div className="hero-eyebrow">
          Autonomous Rescue Drone · Munich
        </div>
        <h1 className="hero-title">
          FALCON
        </h1>
        <p className="hero-sub">
          Built for mountain rescue.<br />Engineered at TUM.
        </p>
        <div className="hero-actions">
          <a className="btn-primary" href="#specs">Explore specs</a>
          <a className="btn-ghost" href="#team">Meet the team</a>
        </div>
        <div className="scroll-hint" aria-hidden="true">
          <div className="scroll-mouse">
            <div className="scroll-wheel" />
          </div>
          <span>Scroll</span>
        </div>
      </section>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          STORY â€” long scroll, 3D canvas stays fixed
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="story-section" id="story">
        {STORY_STEPS.map((step, i) => (
          <div
            key={i}
            className={`story-step${activeSection === i ? ' is-active' : ''}`}
          >
            <div className="story-step-inner">
              <p className="step-tag">{step.tag}</p>
              <h2 className="step-title">{step.title}</h2>
              <p className="step-body">{step.body}</p>
            </div>
          </div>
        ))}

        {/* Step indicator dots */}
        <div className="story-dots" aria-hidden="true">
          {STORY_STEPS.map((_, i) => (
            <div key={i} className={`story-dot${activeSection === i ? ' active' : ''}`} />
          ))}
        </div>
      </section>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          SPECS
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="specs-section" id="specs">
        <div className="section-inner">
          <div className="specs-header-row">
            <div>
              <div className="section-label">Technical data</div>
              <h2 className="section-title">
                Built to perform<br />where it matters.
              </h2>
            </div>
            <button
              className="components-toggle"
              onClick={() => setComponentsOpen(o => !o)}
              aria-expanded={componentsOpen}
            >
              <span>Component breakdown</span>
              <svg className={`toggle-chevron${componentsOpen ? ' open' : ''}`}
                width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8"
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div className="specs-stats">
            {SPECS.map((s) => (
              <div className="stat-item" key={s.label}>
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          <div className={`components-drawer${componentsOpen ? ' open' : ''}`}>
            <div className="components-list">
              {COMPONENTS.map((c) => (
                <div className="component-row" key={c.label}>
                  <span className="component-label">{c.label}</span>
                  <span className="component-value">{c.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          MISSION STATEMENT
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="mission-section">
        <div className="section-inner mission-inner">
          <p className="mission-text">
            "Every minute counts in a mountain rescue.<br />
            <strong>FALCON</strong> closes that gap — autonomously,
            reliably, and in any weather."
          </p>
          <div className="mission-line" />
          <p className="mission-caption">Core mission principle · TUM Startup 2026</p>
        </div>
      </section>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          TEAM
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="team-section" id="team">
        <div className="section-inner">
          <div className="section-label">Founding team</div>
          <h2 className="section-title">
            Three engineers.<br />One mission.
          </h2>
          <div className="team-grid">
            {TEAM.map((m, i) => (
              <article className="team-card" key={m.name}>
                <div className={`avatar avatar-photo`}>
                  <img src={m.img} alt={m.name} />
                </div>
                <div className="team-info">
                  <h3>{m.name}</h3>
                  <p>{m.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          CONTACT
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="contact-section" id="contact">
        <div className="section-inner contact-inner">
          <div className="section-label">Get involved</div>
          <h2 className="section-title">
            Help us build<br />the first FALCON.
          </h2>
          <p className="contact-sub">
            We're a TUM startup with a production-ready concept and a clear roadmap.
            We're looking for partners, investors and organisations
            who want to reshape alpine rescue.
          </p>
          <div className="contact-actions">
            <a className="btn-primary btn-large" href="mailto:falcon-rescue@gmail.com">
              Become a partner
            </a>
            <a className="btn-ghost btn-large" href="mailto:falcon-rescue@gmail.com">
              falcon-rescue@gmail.com
            </a>
          </div>
        </div>
      </section>

      {/* â”€â”€ Footer â”€â”€ */}
      <footer className="site-footer">
        <span className="footer-brand">FALCON</span>
        <span className="footer-copy">© 2026 · Lukas Mueller, Linus Richter, Shawn Blender · Munich</span>
        <span className="footer-tag">TUM Startup</span>
      </footer>

    </div>
  )
}

export default App
