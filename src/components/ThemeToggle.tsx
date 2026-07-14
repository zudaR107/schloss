import { useState, useEffect } from 'react'
import { Sun, Moon, Monitor, Coffee } from 'lucide-react'
import { Button } from '@zudar107/schloss-ui'
import { type Theme, THEMES, getStoredTheme, applyTheme } from '../lib/theme'

const ICONS: Record<Theme, React.ReactNode> = {
  light: <Sun size={16} />,
  dark:  <Moon size={16} />,
  oled:  <Monitor size={16} />,
  sepia: <Coffee size={16} />,
}

const LABELS: Record<Theme, string> = {
  light: 'Светлая',
  dark:  'Тёмная',
  oled:  'OLED',
  sepia: 'Сепия',
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme)
  const [open, setOpen] = useState(false)

  useEffect(() => { applyTheme(theme) }, [theme])

  function select(t: Theme) {
    setTheme(t)
    setOpen(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <Button
        variant="ghost"
        style={{ padding: '0.4rem', border: 'none' }}
        onClick={() => setOpen((o) => !o)}
        aria-label="Сменить тему"
      >
        {ICONS[theme]}
      </Button>

      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
            onClick={() => setOpen(false)}
          />
          <div
            className="card-elevated"
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              zIndex: 50,
              minWidth: 140,
              padding: '0.375rem',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {THEMES.map((t) => (
              <button
                key={t}
                onClick={() => select(t)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.4rem 0.625rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  background: t === theme ? 'var(--accent-muted)' : 'transparent',
                  color: t === theme ? 'var(--accent-text)' : 'var(--text-secondary)',
                  width: '100%',
                  textAlign: 'left',
                  transition: 'background 120ms',
                }}
              >
                {ICONS[t]}
                {LABELS[t]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
