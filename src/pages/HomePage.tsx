import { useEffect } from 'react'
import { Wallet, Plus, LogOut, Server, ShieldCheck, Code2 } from 'lucide-react'
import { ThemeToggle } from '../components/ThemeToggle'
import { getStoredTheme, applyTheme } from '../lib/theme'
import { useAuth } from '../hooks/useAuth'
import { buildSchluesselLoginUrl } from '../lib/authRedirect'
import heroIllustration from '../assets/hero.png'

interface Highlight {
  icon: React.ReactNode
  titel: string
  beschreibung: string
}

const HIGHLIGHTS: Highlight[] = [
  {
    icon: <Server size={20} strokeWidth={1.75} />,
    titel: 'Свой хостинг',
    beschreibung: 'Работает на твоём железе, не в чужом облаке',
  },
  {
    icon: <Code2 size={20} strokeWidth={1.75} />,
    titel: 'Открытый код',
    beschreibung: 'AGPL-3.0, весь исходный код на GitHub',
  },
  {
    icon: <ShieldCheck size={20} strokeWidth={1.75} />,
    titel: 'Твои данные — твои',
    beschreibung: 'Ничего не уходит на сторонние серверы',
  },
]

interface Dienst {
  id: string
  name: string
  beschreibung: string
  url: string
  icon: React.ReactNode
  farbe: string
  status: 'aktiv' | 'bald'
}

const DIENSTE: Dienst[] = [
  {
    id: 'kuvert',
    name: 'Kuvert',
    beschreibung: 'Бюджет по методу конвертов',
    url: (import.meta.env as Record<string, string>)['VITE_KUVERT_URL'] ?? 'http://localhost:5174',
    icon: <Wallet size={28} strokeWidth={1.5} />,
    farbe: '#3b82f6',
    status: 'aktiv',
  },
]

export default function HomePage() {
  const { user, loading, logout } = useAuth()

  useEffect(() => { applyTheme(getStoredTheme()) }, [])

  // The home page requires authentication: once the silent-refresh check
  // resolves with no user, bounce straight to schlussel's hosted login
  // instead of ever showing page content.
  useEffect(() => {
    if (!loading && !user) {
      window.location.href = buildSchluesselLoginUrl('/')
    }
  }, [loading, user])

  if (loading || !user) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-base)',
      }} />
    )
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
            onClick={() => { void logout() }}
          >
            <LogOut size={15} />
            Выйти
          </button>
          <ThemeToggle />
        </div>
      </header>

      <main style={{ flex: 1, padding: '2.5rem 1.5rem', maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '1.5rem', marginBottom: '2.5rem',
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              {`Добрый день, ${user.name}`}
            </h1>
            <p style={{ margin: '0.25rem 0 0', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
              Твои личные сервисы под рукой
            </p>
          </div>
          <img
            src={heroIllustration}
            alt=""
            className="hero-illustration"
            style={{ width: 120, height: 'auto', flexShrink: 0, opacity: 0.9 }}
          />
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem',
          marginBottom: '2rem',
        }}>
          {HIGHLIGHTS.map((h) => (
            <div key={h.titel} style={{
              display: 'flex', alignItems: 'flex-start', gap: '0.625rem',
              padding: '0.875rem 1rem', borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
            }}>
              <div style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }}>{h.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>{h.titel}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>{h.beschreibung}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {DIENSTE.map((d) => <DienstKarte key={d.id} dienst={d} />)}
          <PlatzhalterKarte />
        </div>
      </main>

      <footer style={{
        padding: '1rem 1.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
        borderTop: '1px solid var(--border)',
        color: 'var(--text-muted)',
        fontSize: '0.75rem',
      }}>
        <span>Schloss — открытый код, свой хостинг</span>
        <a
          href="https://github.com/zudaR107"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub"
          style={{ display: 'flex', color: 'var(--text-muted)' }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </footer>
    </div>
  )
}

function DienstKarte({ dienst }: { dienst: Dienst }) {
  const aktiv = dienst.status === 'aktiv'
  return (
    <a
      href={aktiv ? dienst.url : undefined}
      className="card"
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        minHeight: 160,
        cursor: aktiv ? 'pointer' : 'default',
        textDecoration: 'none',
        transition: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!aktiv) return
        e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = ''
        e.currentTarget.style.transform = ''
      }}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: dienst.farbe,
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      }} />
      <div style={{
        width: 48, height: 48,
        borderRadius: 'var(--radius-md)',
        background: `${dienst.farbe}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: dienst.farbe,
      }}>
        {dienst.icon}
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>{dienst.name}</span>
          {!aktiv && (
            <span style={{
              fontSize: '0.65rem', fontWeight: 600, padding: '0.1rem 0.375rem',
              borderRadius: 99, background: 'var(--warning-muted)', color: 'var(--warning)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>Скоро</span>
          )}
        </div>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {dienst.beschreibung}
        </p>
      </div>
    </a>
  )
}

function PlatzhalterKarte() {
  return (
    <div className="card" style={{
      padding: '1.5rem',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '0.5rem', minHeight: 160,
      borderStyle: 'dashed', opacity: 0.5, cursor: 'default',
    }}>
      <Plus size={24} color="var(--text-muted)" strokeWidth={1.5} />
      <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        Скоро появятся новые сервисы
      </span>
    </div>
  )
}
