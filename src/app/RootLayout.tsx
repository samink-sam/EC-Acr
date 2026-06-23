import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { RotateCcw, ShieldCheck } from 'lucide-react'
import type { Role } from '@/data/types'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { NotificationBell } from '@/components/NotificationBell'
import { RoleSwitcher } from '@/components/RoleSwitcher'
import { Toasts } from '@/components/Toasts'
import { roleLabels } from '@/lib/formatters'
import { useDemoStore } from '@/store'
import ecLogo from '@/assets/ec-logo.webp'

const navItems: Array<{ to: string; label: string; roles: Role[] | 'all' }> = [
  { to: '/applicant', label: 'My Applications', roles: ['applicant'] },
  { to: '/applicant/apply', label: 'New Application', roles: ['applicant'] },
  { to: '/applicant/profile', label: 'Profile', roles: ['applicant'] },
  { to: '/superadmin/dashboard', label: 'Dashboard', roles: ['super_admin'] },
  { to: '/superadmin/users', label: 'Users & Roles', roles: ['super_admin'] },
  {
    to: '/superadmin/master-data',
    label: 'Master Data',
    roles: ['super_admin'],
  },
  { to: '/superadmin/settings', label: 'Settings', roles: ['super_admin'] },
  {
    to: '/superadmin/applications',
    label: 'Applications',
    roles: ['super_admin'],
  },
  { to: '/superadmin/cards', label: 'Cards', roles: ['super_admin'] },
  { to: '/superadmin/audit', label: 'Audit', roles: ['super_admin'] },
  {
    to: '/superadmin/notifications',
    label: 'Notifications',
    roles: ['super_admin'],
  },
  {
    to: '/admin/review',
    label: 'Review Queue',
    roles: ['central_admin', 'returning_officer'],
  },
  {
    to: '/reports',
    label: 'Reports',
    roles: ['central_admin', 'returning_officer'],
  },
  {
    to: '/notifications',
    label: 'Notifications',
    roles: ['central_admin', 'returning_officer'],
  },
  { to: '/verify', label: 'Verify Card', roles: ['verifier'] },
]

export function RootLayout() {
  const reset = useDemoStore((state) => state.resetDemoData)
  const role = useDemoStore((state) => state.activeRole)
  const isAuthenticated = useDemoStore((state) => state.isAuthenticated)
  const location = useLocation()
  const visibleNavItems = navItems.filter(
    (item) => item.roles === 'all' || item.roles.includes(role),
  )
  const isDashboardPath =
    location.pathname.startsWith('/applicant') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/reports') ||
    location.pathname.startsWith('/notifications') ||
    location.pathname.startsWith('/super-admin') ||
    location.pathname.startsWith('/superadmin') ||
    location.pathname.startsWith('/verify')
  const showPortalNav = isAuthenticated && isDashboardPath
  const showRoleSwitcher = !location.pathname.startsWith('/login')

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                aria-label="Bangladesh Election Commission home"
                className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-card p-1 no-underline shadow-soft"
                to="/"
              >
                <img
                  alt="Bangladesh Election Commission logo"
                  className="h-full w-full object-contain"
                  src={ecLogo}
                />
              </Link>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">
                  Bangladesh Election Commission
                </p>
                <p className="font-bangla text-sm text-muted-foreground">
                  নির্বাচন কমিশন · Accreditation Portal
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {showRoleSwitcher ? <RoleSwitcher /> : null}
              <NotificationBell />
              <Button onClick={reset} title="Reset demo data" variant="outline">
                <RotateCcw className="h-4 w-4" />
                Reset demo data
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1">
          {showPortalNav ? (
            <aside className="no-print hidden w-64 shrink-0 border-r bg-card md:block">
              <div className="sticky top-[89px] grid gap-5 p-4">
                <div className="rounded-lg border bg-accent p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    {roleLabels[role]} dashboard
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Role-specific sections available for the signed-in demo
                    user.
                  </p>
                </div>
                <nav className="grid gap-1" aria-label="Primary navigation">
                  {visibleNavItems.map((item) => (
                    <NavLink
                      className={({ isActive }) =>
                        `rounded-md px-3 py-2.5 text-sm font-medium no-underline transition ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`
                      }
                      key={item.to}
                      to={item.to}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </aside>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col">
            {showPortalNav ? (
              <nav
                className="no-print border-b bg-card px-4 py-2 md:hidden"
                aria-label="Primary navigation"
              >
                <div className="flex gap-1 overflow-x-auto">
                  {visibleNavItems.map((item) => (
                    <NavLink
                      className={({ isActive }) =>
                        `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium no-underline ${
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                        }`
                      }
                      key={item.to}
                      to={item.to}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </nav>
            ) : null}
            <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
              <Outlet />
            </main>
            <footer className="border-t bg-card">
              <div className="mx-auto max-w-7xl px-4 py-5 text-sm text-muted-foreground">
                Government of the People's Republic of Bangladesh · Bangladesh
                Election Commission · Supported by IFES
              </div>
            </footer>
          </div>
        </div>
      </div>
      <Toasts />
    </TooltipProvider>
  )
}
