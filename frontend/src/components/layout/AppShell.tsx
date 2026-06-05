import type { ReactNode } from 'react'

interface AppShellProps {
  children: ReactNode
  fullBleed?: boolean
}

export function AppShell({ children, fullBleed = false }: AppShellProps) {
  return (
    <div className={fullBleed ? 'app-shell app-shell--fixed' : 'app-shell'}>
      <header className="app-shell__header">
        <a href="/" className="app-shell__brand">
          <span className="app-shell__logo">P</span>
          <span className="app-shell__name">
            Pitch<span className="app-shell__name-accent">IA</span>
          </span>
        </a>
      </header>

      <main className={fullBleed ? 'app-shell__main app-shell__main--fixed' : 'app-shell__main'}>
        {children}
      </main>

      {!fullBleed && (
        <footer className="app-shell__footer">
          © {new Date().getFullYear()} Pitch-IA · Tous droits réservés
        </footer>
      )}
    </div>
  )
}
