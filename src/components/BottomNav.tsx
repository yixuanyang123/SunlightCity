'use client'

import { Map, Sun, BarChart3, Box } from 'lucide-react'
import type { TabId } from './Sidebar'

const TABS: { id: TabId; icon: typeof Map; label: string }[] = [
  { id: 'map', icon: Map, label: 'Map' },
  { id: 'shade', icon: Sun, label: 'Shade' },
  { id: '3d', icon: Box, label: '3D' },
  { id: 'analysis', icon: BarChart3, label: 'Analysis' },
]

interface BottomNavProps {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-gray-700 bg-gray-900/95 backdrop-blur-sm pt-2"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
    >
      {TABS.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => setActiveTab(id)}
          className={`flex flex-col items-center gap-1 py-2 px-3 min-w-[64px] rounded-lg transition-all ${
            activeTab === id
              ? 'text-amber-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Icon className="h-6 w-6" />
          <span className="text-[10px] font-medium">{label}</span>
        </button>
      ))}
    </nav>
  )
}
