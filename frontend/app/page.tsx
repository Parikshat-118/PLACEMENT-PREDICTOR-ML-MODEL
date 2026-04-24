'use client'

import { useRef, useState, useCallback, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Stars, Trail, Torus } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'

/* ─────────────────────────────────────────
   3D SCENE COMPONENTS
───────────────────────────────────────── */

function CoreOrb({ placed, predicted }: { placed: boolean | null; predicted: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const color = !predicted
    ? '#c9a84c'
    : placed
    ? '#00ffaa'
    : '#ff4466'

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.2
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.8}>
      <Sphere ref={meshRef} args={[1.4, 128, 128]}>
        <MeshDistortMaterial
          color={color}
          distort={predicted ? (placed ? 0.55 : 0.3) : 0.4}
          speed={predicted ? (placed ? 4 : 1.5) : 2}
          roughness={0.1}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={predicted ? (placed ? 0.5 : 0.15) : 0.25}
        />
      </Sphere>
    </Float>
  )
}

function OrbitRing({ radius, speed, color, tilt }: { radius: number; speed: number; color: string; tilt: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  useFrame((s) => {
    ref.current.rotation.z = s.clock.elapsedTime * speed
  })
  return (
    <Torus ref={ref} args={[radius, 0.012, 16, 120]} rotation={[tilt, 0, 0]}>
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} transparent opacity={0.5} />
    </Torus>
  )
}

function Particle({ placed, predicted }: { placed: boolean | null; predicted: boolean }) {
  const ref = useRef<THREE.Points>(null!)
  const count = 300
  const positions = new Float32Array(
    Array.from({ length: count }, () => [(Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 14]).flat()
  )
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.04
  })
  const col = !predicted ? '#c9a84c' : placed ? '#00ffaa' : '#ff4466'
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={col} size={0.04} transparent opacity={0.6} />
    </points>
  )
}

function Scene({ placed, predicted }: { placed: boolean | null; predicted: boolean }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={2} color={!predicted ? '#c9a84c' : placed ? '#00ffaa' : '#ff4466'} />
      <pointLight position={[-5, -3, -5]} intensity={1} color="#3355ff" />
      <Stars radius={60} depth={40} count={2000} factor={3} fade />
      <CoreOrb placed={placed} predicted={predicted} />
      <OrbitRing radius={2.4} speed={0.5} color="#c9a84c" tilt={Math.PI / 3} />
      <OrbitRing radius={3.2} speed={-0.3} color="#4488ff" tilt={Math.PI / 5} />
      <OrbitRing radius={2.8} speed={0.7} color="#aa44ff" tilt={Math.PI / 7} />
      <Particle placed={placed} predicted={predicted} />
    </>
  )
}

/* ─────────────────────────────────────────
   INPUT COMPONENT
───────────────────────────────────────── */
function GoldInput({
  label,
  sublabel,
  value,
  onChange,
  min,
  max,
  step,
  placeholder,
}: {
  label: string
  sublabel: string
  value: string
  onChange: (v: string) => void
  min: number
  max: number
  step: number
  placeholder: string
}) {
  const [focused, setFocused] = useState(false)
  const valid = value === '' || (parseFloat(value) >= min && parseFloat(value) <= max)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between mb-1">
        <span
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '1.35rem',
            letterSpacing: '0.12em',
            color: focused ? '#f0d080' : '#c9a84c',
            transition: 'color 0.2s',
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#555', letterSpacing: '0.06em' }}>{sublabel}</span>
      </div>

      <div style={{ position: 'relative' }}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${focused ? '#c9a84c' : 'rgba(201,168,76,0.2)'}`,
            borderRadius: '12px',
            padding: '18px 22px',
            fontSize: '2rem',
            fontFamily: "'Bebas Neue', sans-serif",
            letterSpacing: '0.08em',
            color: '#fff',
            outline: 'none',
            transition: 'all 0.25s',
            boxShadow: focused ? '0 0 28px rgba(201,168,76,0.15), inset 0 0 20px rgba(201,168,76,0.04)' : 'none',
          }}
        />
        {!valid && value !== '' && (
          <div style={{ fontSize: '0.7rem', color: '#ff4466', marginTop: '4px', paddingLeft: '4px' }}>
            Enter a value between {min} and {max}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────
   RESULT DISPLAY
───────────────────────────────────────── */
function ResultCard({ data }: { data: { placed: boolean; probability_placed: number; probability_not_placed: number } }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
      style={{
        marginTop: '2rem',
        borderRadius: '20px',
        padding: '2rem',
        background: data.placed
          ? 'linear-gradient(135deg, rgba(0,255,170,0.07), rgba(0,200,120,0.03))'
          : 'linear-gradient(135deg, rgba(255,68,102,0.08), rgba(200,30,60,0.03))',
        border: `1px solid ${data.placed ? 'rgba(0,255,170,0.3)' : 'rgba(255,68,102,0.3)'}`,
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glow blob */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '160px',
          height: '160px',
          borderRadius: '50%',
          background: data.placed ? 'rgba(0,255,170,0.12)' : 'rgba(255,68,102,0.12)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            background: data.placed ? '#00ffaa' : '#ff4466',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.6rem',
            flexShrink: 0,
            boxShadow: `0 0 30px ${data.placed ? 'rgba(0,255,170,0.6)' : 'rgba(255,68,102,0.6)'}`,
          }}
        >
          {data.placed ? '✓' : '✗'}
        </motion.div>
        <div>
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.9rem',
              letterSpacing: '0.1em',
              color: data.placed ? '#00ffaa' : '#ff4466',
              lineHeight: 1,
            }}
          >
            {data.placed ? 'PLACEMENT SECURED' : 'NOT PLACED'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
            {data.placed
              ? 'This student profile is predicted to get placed'
              : 'This profile needs improvement for placement'}
          </div>
        </div>
      </div>

      {/* Probability bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[
          { label: 'Placed', pct: data.probability_placed, color: '#00ffaa' },
          { label: 'Not Placed', pct: data.probability_not_placed, color: '#ff4466' },
        ].map(({ label, pct, color }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>{label.toUpperCase()}</span>
              <span style={{ fontSize: '0.85rem', fontFamily: "'Bebas Neue', sans-serif", color, letterSpacing: '0.06em' }}>{pct}%</span>
            </div>
            <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
                style={{ height: '100%', background: color, borderRadius: '3px', boxShadow: `0 0 8px ${color}` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────── */
export default function Home() {
  const [iq, setIq] = useState('')
  const [cgpa, setCgpa] = useState('')
  const [result, setResult] = useState<null | { placed: boolean; probability_placed: number; probability_not_placed: number }>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [predicted, setPredicted] = useState(false)

  const canPredict =
    iq !== '' &&
    cgpa !== '' &&
    parseFloat(iq) >= 70 &&
    parseFloat(iq) <= 160 &&
    parseFloat(cgpa) >= 4.0 &&
    parseFloat(cgpa) <= 10.0

  const handlePredict = useCallback(async () => {
    if (!canPredict) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ iq: parseFloat(iq), cgpa: parseFloat(cgpa) }),
      })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setResult(data)
      setPredicted(true)
    } catch {
      setError('Could not connect to the backend. Make sure the Python server is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }, [iq, cgpa, canPredict])

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── LEFT: 3D Canvas ── */}
      <div style={{ position: 'relative', height: '100vh', top: 0, left: 0 }}>
        <div style={{ position: 'sticky', top: 0, height: '100vh' }}>
          <Canvas camera={{ position: [0, 0, 6], fov: 55 }} style={{ background: 'transparent' }}>
            <Suspense fallback={null}>
              <Scene placed={result?.placed ?? null} predicted={predicted} />
            </Suspense>
          </Canvas>

          {/* Vignette overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background: 'radial-gradient(ellipse at center, transparent 40%, #080810 100%)',
            }}
          />

          {/* Title watermark on canvas */}
          <div
            style={{
              position: 'absolute',
              bottom: '2.5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '0.75rem',
                letterSpacing: '0.3em',
                color: 'rgba(201,168,76,0.35)',
              }}
            >
              AI · PLACEMENT · ORACLE
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Form Panel ── */}
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '3rem 3rem 3rem 2.5rem',
          background: 'linear-gradient(180deg, #080810 0%, #0e0e1a 50%, #080810 100%)',
          borderLeft: '1px solid rgba(201,168,76,0.08)',
          position: 'relative',
        }}
      >
        {/* Top decorative line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)',
          }}
        />

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{ marginBottom: '3rem' }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.25em',
              color: '#c9a84c',
              marginBottom: '0.75rem',
              fontWeight: 500,
            }}
          >
            CAMPUS RECRUITMENT · NEURAL ANALYSIS
          </div>
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 'clamp(3rem, 5vw, 5rem)',
              lineHeight: 0.95,
              letterSpacing: '0.04em',
            }}
          >
            WILL YOU
            <br />
            <span style={{ color: '#c9a84c' }}>GET</span>
            <br />
            PLACED?
          </h1>
          <div
            style={{
              width: '48px',
              height: '2px',
              background: 'linear-gradient(90deg, #c9a84c, transparent)',
              marginTop: '1rem',
            }}
          />
        </motion.div>

        {/* Inputs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}
        >
          <GoldInput
            label="IQ SCORE"
            sublabel="Range 70 – 160"
            value={iq}
            onChange={setIq}
            min={70}
            max={160}
            step={1}
            placeholder="120"
          />
          <GoldInput
            label="CGPA"
            sublabel="Range 4.0 – 10.0"
            value={cgpa}
            onChange={setCgpa}
            min={4.0}
            max={10.0}
            step={0.1}
            placeholder="8.5"
          />
        </motion.div>

        {/* Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.28 }}
        >
          <motion.button
            onClick={handlePredict}
            disabled={!canPredict || loading}
            whileHover={canPredict && !loading ? { scale: 1.02 } : {}}
            whileTap={canPredict && !loading ? { scale: 0.97 } : {}}
            style={{
              width: '100%',
              padding: '20px',
              background: canPredict && !loading
                ? 'linear-gradient(135deg, #c9a84c, #f0d080, #c9a84c)'
                : 'rgba(201,168,76,0.12)',
              border: `1px solid ${canPredict ? '#c9a84c' : 'rgba(201,168,76,0.2)'}`,
              borderRadius: '14px',
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.4rem',
              letterSpacing: '0.15em',
              color: canPredict && !loading ? '#080810' : 'rgba(201,168,76,0.35)',
              cursor: canPredict && !loading ? 'pointer' : 'not-allowed',
              transition: 'all 0.25s',
              boxShadow: canPredict && !loading ? '0 8px 40px rgba(201,168,76,0.25)' : 'none',
              backgroundSize: '200% 100%',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  style={{ display: 'inline-block', fontSize: '1rem' }}
                >
                  ◌
                </motion.span>
                ANALYZING...
              </span>
            ) : (
              'PREDICT MY PLACEMENT →'
            )}
          </motion.button>
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginTop: '1rem',
                padding: '12px 16px',
                background: 'rgba(255,68,102,0.08)',
                border: '1px solid rgba(255,68,102,0.25)',
                borderRadius: '10px',
                fontSize: '0.78rem',
                color: '#ff8899',
                lineHeight: 1.5,
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence mode="wait">
          {result && <ResultCard key={String(result.placed)} data={result} />}
        </AnimatePresence>

        {/* Bottom decorative line */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)',
          }}
        />
      </div>
    </main>
  )
}