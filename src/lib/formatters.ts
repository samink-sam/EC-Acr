import type { Category, Role, Status } from '@/data/types'

export const roleLabels: Record<Role, string> = {
  applicant: 'Applicant',
  central_admin: 'Central Administrator',
  returning_officer: 'Returning Officer',
  super_admin: 'Super Administrator',
  verifier: 'Verifier',
}

export const categoryLabels: Record<Category, string> = {
  domestic_journalist: 'Domestic Journalist',
  intl_journalist: 'International Journalist',
  domestic_observer: 'Domestic Observer',
  intl_observer: 'International Observer',
  observer_org: 'Observer Organization',
  support_personnel: 'Support Personnel',
}

export const statusLabels: Record<Status, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  card_issued: 'Card Issued',
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(value))
}

export function toCsv(rows: Array<Record<string, string | number>>) {
  if (rows.length === 0) return ''
  const headers = Object.keys(rows[0])
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`
  return [headers.join(','), ...rows.map((row) => headers.map((header) => escape(row[header])).join(','))].join('\n')
}
