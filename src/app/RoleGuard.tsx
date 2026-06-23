import { Navigate, Outlet } from 'react-router-dom'
import type { Role } from '@/data/types'
import { useDemoStore } from '@/store'

const loginPathByRole: Record<Role, string> = {
  applicant: '/login/applicant',
  central_admin: '/login/central-admin',
  returning_officer: '/login/returning-officer',
  super_admin: '/login/super-admin',
  verifier: '/login/verifier',
}

export function RoleGuard({ allow }: { allow: Role[] }) {
  const role = useDemoStore((state) => state.activeRole)
  const isAuthenticated = useDemoStore((state) => state.isAuthenticated)
  if (!isAuthenticated) {
    return <Navigate replace to={loginPathByRole[allow[0]]} />
  }
  if (!allow.includes(role)) {
    return (
      <Navigate
        replace
        to={
          role === 'applicant'
            ? '/applicant'
            : role === 'verifier'
              ? '/verify'
              : role === 'super_admin'
                ? '/superadmin/dashboard'
                : '/admin/review'
        }
      />
    )
  }
  return <Outlet />
}
