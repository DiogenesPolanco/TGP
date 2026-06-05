import { useState, useEffect, useCallback } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db/database'
import { X, User, Zap, Target, Award, FileText, Umbrella } from 'lucide-react'
import { SkillsSection } from '@/features/performance/components/SkillsSection'
import { SprintsSection } from '@/features/performance/components/SprintsSection'
import { OneOnOneSection } from '@/features/performance/components/OneOnOneSection'
import { AchievementsSection } from '@/features/performance/components/AchievementsSection'
import { ProfileSection } from '@/features/performance/components/ProfileSection'
import { VacationsSection } from '@/features/performance/components/VacationsSection'

interface Props {
  memberId: string
  memberName: string
  teamId?: string
  open: boolean
  onClose: () => void
}

type Tab = 'profile' | 'vacations' | 'skills' | 'sprints' | 'oneonone' | 'achievements'

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'profile', label: 'Datos Personales', icon: <FileText size={16} /> },
  { key: 'vacations', label: 'Vacaciones', icon: <Umbrella size={16} /> },
  { key: 'skills', label: 'Habilidades', icon: <Zap size={16} /> },
  { key: 'sprints', label: 'Sprints', icon: <Target size={16} /> },
  { key: 'oneonone', label: 'Uno a Uno', icon: <User size={16} /> },
  { key: 'achievements', label: 'Logros', icon: <Award size={16} /> },
]

export function MemberEditModal({ memberId, memberName, teamId, open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [visible, setVisible] = useState(false)

  const profile = useLiveQuery(
    () => db.memberProfiles.get(memberId),
    [memberId]
  ) ?? null

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true))
      setActiveTab('profile')
    } else {
      setVisible(false)
    }
  }, [open])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 200)
  }, [onClose])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, handleClose])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-4xl bg-white dark:bg-neutral-80 shadow-2xl border-l border-neutral-20 dark:border-neutral-70 flex flex-col transition-all duration-200 ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-20 dark:border-neutral-70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
              {memberName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-90 dark:text-white">{memberName}</h2>
              <p className="text-xs text-neutral-50">Gestionar información del miembro</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-neutral-10 dark:hover:bg-neutral-70 transition-colors"
          >
            <X size={20} className="text-neutral-60" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-20 dark:border-neutral-70 px-4 gap-1 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-60 dark:text-neutral-40 hover:text-neutral-90 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'profile' && (
            <ProfileSection memberId={memberId} memberDisplayName={memberName} profile={profile} />
          )}
          {activeTab === 'vacations' && <VacationsSection memberId={memberId} />}
          {activeTab === 'skills' && <SkillsSection memberId={memberId} />}
          {activeTab === 'sprints' && <SprintsSection memberId={memberId} teamId={teamId || profile?.teamId || ''} />}
          {activeTab === 'oneonone' && <OneOnOneSection memberId={memberId} />}
          {activeTab === 'achievements' && <AchievementsSection memberId={memberId} />}
        </div>
      </div>
    </>
  )
}
