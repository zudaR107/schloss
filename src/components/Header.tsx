import { LogOut } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  user: { name: string }
  onLogout: () => void
}

export function Header({ user, onLogout }: HeaderProps) {
  return (
    <header style={{
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 1.5rem',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: 'var(--shadow-sm)',
      position: 'sticky',
      top: 0,
      zIndex: 30,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--accent)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Schloss
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{user.name}</span>
        <button
          className="btn-ghost"
          style={{ padding: '0.4rem 0.625rem', gap: '0.375rem' }}
          onClick={onLogout}
        >
          <LogOut size={15} />
          Выйти
        </button>
        <ThemeToggle />
      </div>
    </header>
  )
}
