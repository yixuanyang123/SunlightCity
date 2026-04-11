'use client'

import { User, ChevronDown } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import AccountModal from './AccountModal'
import ProfileModal from './ProfileModal'

export default function Header() {
  const [accountOpen, setAccountOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const accountBtnRef = useRef<HTMLButtonElement | null>(null)
  const accountMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('sc_token')
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'
    if (token) {
      fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((j) => setUserEmail(j.email))
        .catch(() => localStorage.removeItem('sc_token'))
    }
  }, [])

  useEffect(() => {
    if (!accountOpen) return
    const closeIfOutside = (e: PointerEvent) => {
      const root = accountMenuRef.current
      if (!root?.contains(e.target as Node)) {
        setAccountOpen(false)
      }
    }
    // capture: map libs often stopPropagation on bubble; still close when tapping the map
    document.addEventListener('pointerdown', closeIfOutside, true)
    return () => document.removeEventListener('pointerdown', closeIfOutside, true)
  }, [accountOpen])

  const onLogin = (token: string, email: string) => {
    localStorage.setItem('sc_token', token)
    setUserEmail(email)
  }

  const handleSignOut = () => {
    localStorage.removeItem('sc_token')
    setUserEmail(null)
    setAccountOpen(false)
  }

  return (
    <header className="relative z-50 bg-gradient-to-r from-dark via-secondary to-dark border-b border-yellow-500/20 px-4 py-2 md:px-6 shadow-2xl">
      <AccountModal open={modalOpen} onClose={() => setModalOpen(false)} onLogin={onLogin} />
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} email={userEmail ?? ''} onLogout={handleSignOut} />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex-shrink-0 p-0.5 md:p-1 rounded-lg overflow-hidden">
            <img src="/logo.png" alt="AEXUS" className="w-10 h-10 md:w-16 md:h-16 object-cover" />
          </div>
          <div className="flex min-w-0 flex-col gap-1 md:gap-1.5">
            <h1 className="text-lg md:text-[1.6rem] font-bold leading-tight bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent truncate">
              Sunlight City
            </h1>
            <p className="text-xs md:text-sm text-gray-300 font-medium leading-snug truncate hidden sm:block">
              Urban Comfort Analysis Platform · By AEXUS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
          {/* Account menu */}
          <div ref={accountMenuRef} className="relative">
            {/* anchor ref used by portal to position dropdown */}
            <button
              ref={accountBtnRef}
              onClick={() => setAccountOpen((v) => !v)}
              className="relative z-60 flex items-center gap-1.5 md:gap-2 bg-gray-800 px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg border border-gray-700"
            >
              <User className="w-4 h-4 text-gray-300 flex-shrink-0" />
              <span className="text-xs md:text-sm text-gray-200 truncate max-w-[80px] md:max-w-none">{userEmail ?? 'Account'}</span>
              <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
            </button>

            {/* Dropdown menu - render unconditionally but hide with fixed positioning + opacity */}
            <div
              className={`fixed z-[9999] bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-2 w-48 transition-opacity ${
                accountOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
              style={{
                top: accountBtnRef.current ? accountBtnRef.current.getBoundingClientRect().bottom + window.scrollY + 8 : 0,
                left: accountBtnRef.current ? accountBtnRef.current.getBoundingClientRect().right + window.scrollX - 200 : 0,
              }}
            >
              {!userEmail ? (
                <>
                  <button onClick={() => { setModalOpen(true); setAccountOpen(false) }} className="w-full text-left px-2 py-1 text-sm text-gray-200 hover:bg-gray-800 rounded">Login / Sign up</button>
                </>
              ) : (
                <>
                  <button onClick={() => setAccountOpen(false)} className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 rounded cursor-not-allowed">Profile</button>
                  <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-800 rounded">Logout</button>
                  {/* Add more account items here (e.g., Settings, Billing) */}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
