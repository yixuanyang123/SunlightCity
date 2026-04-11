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
    <div
      className="fixed bottom-0 left-0 right-0 z-[2000] flex md:hidden flex-col border-t border-gray-700 bg-gray-900/95 backdrop-blur-sm"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      <nav className="flex items-center justify-around pt-1.5 pb-0.5">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 min-w-[52px] rounded-lg transition-all ${
              activeTab === id
                ? 'text-amber-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            <span className="text-[9px] font-medium leading-tight">{label}</span>
          </button>
        ))}
      </nav>
      <div className="px-2 pt-0.5 pb-1 border-t border-gray-800/80 flex items-center justify-center">
        <p className="text-gray-500 text-[10px] leading-tight">© Cornell University AEXUS</p>
      </div>
    </div>
  )
}
