import { useState, useEffect, useCallback } from 'react'
import { db } from '@/services/db/database'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, X } from 'lucide-react'
import { isOnboardingDone, completeOnboarding, SLIDES } from './OnboardingSteps'

export { isOnboardingDone, completeOnboarding }

export function useFirstTimeuser() {
  const [checking, setChecking] = useState(true)
  const [isFirstTime, setIsFirstTime] = useState(false)

  useEffect(() => {
    if (isOnboardingDone()) {
      setChecking(false)
      return
    }
    const check = async () => {
      const bus = await db.businessUnits.count()
      const apps = await db.applications.count()
      setIsFirstTime(bus === 0 && apps === 0)
      setChecking(false)
    }
    check()
  }, [])

  return { checking, isFirstTime }
}

/* ─── Slide animation variants ─── */

const slideVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 320 : -320,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -320 : 320,
    opacity: 0,
    scale: 0.96,
  }),
}

/* ─── Wizard shell ─── */

interface WizardProps {
  onClose: () => void
}

export function OnboardingWizard({ onClose }: WizardProps) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)

  const total = SLIDES.length
  const isFirst = step === 0
  const isLast = step === total - 1
  const current = SLIDES[step]

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= total) return
      setDirection(next > step ? 1 : -1)
      setStep(next)
    },
    [step, total],
  )

  const handleNext = useCallback(() => {
    if (isLast) {
      completeOnboarding()
      onClose()
      return
    }
    goTo(step + 1)
  }, [step, isLast, goTo, onClose])

  const handleSkip = useCallback(() => {
    if (isLast) {
      completeOnboarding()
      onClose()
      return
    }
    goTo(step + 1)
  }, [step, isLast, goTo, onClose])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        handleNext()
      }
      if (e.key === 'ArrowLeft' && !isFirst) {
        goTo(step - 1)
      }
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleNext, goTo, isFirst, step, onClose])

  const SlideComponent = current.component

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative w-full max-w-lg"
      >
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900 to-[#0a0a12] shadow-2xl shadow-black/50">
          {/* Subtle grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[3%]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />

          {/* Top bar: dots + close */}
          <div className="relative flex items-center justify-between px-6 pt-5 pb-2">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step
                      ? 'w-6 bg-gradient-to-r from-cyan-400 to-blue-500'
                      : i < step
                        ? 'w-1.5 bg-white/40'
                        : 'w-1.5 bg-white/15 hover:bg-white/25'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1">
              {!isFirst && (
                <button
                  onClick={() => goTo(step - 1)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Animated slide */}
          <div className="relative overflow-hidden" style={{ minHeight: 420 }}>
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current.key}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.8 }}
                className="px-6 py-2"
              >
                <SlideComponent
                  onNext={handleNext}
                  onSkip={handleSkip}
                  onClose={onClose}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom edge: step counter */}
          {!isLast && (
            <div className="relative flex items-center justify-between px-6 pb-5 pt-1">
              <span className="text-[11px] text-neutral-600 font-mono">
                {String(step + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </span>
              {step >= 1 && (
                <button
                  onClick={handleSkip}
                  className="text-[11px] text-neutral-600 hover:text-neutral-400 font-mono transition-colors"
                >
                  Saltar →
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
