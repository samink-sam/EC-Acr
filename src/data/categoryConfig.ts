import type { Category, DocumentType } from './types'

export interface FieldConfig {
  name: string
  label: string
  placeholder: string
  required: boolean
}

export interface CategoryConfig {
  label: string
  description: string
  authority: 'central' | 'local'
  accent: string
  fields: FieldConfig[]
  documents: Array<{ type: DocumentType; label: string; required: boolean; rule: string }>
}

const sharedPersonFields: FieldConfig[] = [
  { name: 'fullName', label: 'Full name', placeholder: 'e.g. Nusrat Jahan', required: true },
  { name: 'mobile', label: 'Mobile', placeholder: '01712345678', required: true },
  { name: 'email', label: 'Email', placeholder: 'name@example.gov.bd', required: true },
]

export const categoryConfig: Record<Category, CategoryConfig> = {
  domestic_journalist: {
    label: 'Domestic Journalist',
    description: 'Bangladesh-based media professionals covering election activity.',
    authority: 'local',
    accent: '#006A4E',
    fields: [
      ...sharedPersonFields,
      { name: 'outlet', label: 'Media outlet', placeholder: 'Prothom Alo', required: true },
      { name: 'pressId', label: 'Press ID', placeholder: 'PA-2026-119', required: true },
    ],
    documents: [
      { type: 'photo', label: 'Photo', required: true, rule: 'JPG/PNG, max 2MB' },
      { type: 'signature', label: 'Signature', required: true, rule: 'JPG/PNG, max 1MB' },
      { type: 'nid', label: 'NID', required: true, rule: 'PDF/JPG, max 5MB' },
      { type: 'authorization', label: 'Editor authorization', required: true, rule: 'PDF/JPG, max 5MB' },
    ],
  },
  intl_journalist: {
    label: 'International Journalist',
    description: 'Foreign correspondents and accredited international press.',
    authority: 'central',
    accent: '#C9A227',
    fields: [
      ...sharedPersonFields,
      { name: 'nationality', label: 'Nationality', placeholder: 'United Kingdom', required: true },
      { name: 'passport', label: 'Passport number', placeholder: 'XK1234567', required: true },
      { name: 'outlet', label: 'Media outlet', placeholder: 'BBC', required: true },
    ],
    documents: [
      { type: 'photo', label: 'Photo', required: true, rule: 'JPG/PNG, max 2MB' },
      { type: 'passport', label: 'Passport', required: true, rule: 'PDF/JPG, max 5MB' },
      { type: 'authorization', label: 'Assignment letter', required: true, rule: 'PDF/JPG, max 5MB' },
      { type: 'cv', label: 'CV', required: false, rule: 'PDF, max 5MB' },
    ],
  },
  domestic_observer: {
    label: 'Domestic Observer',
    description: 'Individual observers attached to registered local organizations.',
    authority: 'local',
    accent: '#2563EB',
    fields: [
      ...sharedPersonFields,
      { name: 'organization', label: 'Observer organization', placeholder: 'Democracy Watch Bangladesh', required: true },
      { name: 'jurisdiction', label: 'Observed jurisdiction', placeholder: 'Dhaka', required: true },
    ],
    documents: [
      { type: 'photo', label: 'Photo', required: true, rule: 'JPG/PNG, max 2MB' },
      { type: 'nid', label: 'NID', required: true, rule: 'PDF/JPG, max 5MB' },
      { type: 'authorization', label: 'Organization letter', required: true, rule: 'PDF/JPG, max 5MB' },
    ],
  },
  intl_observer: {
    label: 'International Observer',
    description: 'International monitoring missions and individual observers.',
    authority: 'central',
    accent: '#004D38',
    fields: [
      ...sharedPersonFields,
      { name: 'nationality', label: 'Nationality', placeholder: 'Japan', required: true },
      { name: 'passport', label: 'Passport number', placeholder: 'JP902311', required: true },
      { name: 'mission', label: 'Mission / organization', placeholder: 'ANFREL', required: true },
    ],
    documents: [
      { type: 'photo', label: 'Photo', required: true, rule: 'JPG/PNG, max 2MB' },
      { type: 'passport', label: 'Passport', required: true, rule: 'PDF/JPG, max 5MB' },
      { type: 'authorization', label: 'Mission letter', required: true, rule: 'PDF/JPG, max 5MB' },
      { type: 'cv', label: 'CV', required: true, rule: 'PDF, max 5MB' },
    ],
  },
  observer_org: {
    label: 'Observer Organization',
    description: 'Organization-level accreditation for election observation bodies.',
    authority: 'central',
    accent: '#C9A227',
    fields: [
      { name: 'organization', label: 'Organization name', placeholder: 'Transparency International Bangladesh', required: true },
      { name: 'focalPerson', label: 'Focal person', placeholder: 'Ayesha Rahman', required: true },
      { name: 'mobile', label: 'Mobile', placeholder: '01712345678', required: true },
      { name: 'scope', label: 'Observation scope', placeholder: 'National', required: true },
    ],
    documents: [
      { type: 'authorization', label: 'Registration certificate', required: true, rule: 'PDF/JPG, max 5MB' },
      { type: 'cv', label: 'Organization profile', required: true, rule: 'PDF, max 5MB' },
    ],
  },
  support_personnel: {
    label: 'Support Personnel',
    description: 'Technical, logistics, and operational support staff.',
    authority: 'local',
    accent: '#D97706',
    fields: [
      ...sharedPersonFields,
      { name: 'assignment', label: 'Assignment', placeholder: 'Camera assistant', required: true },
      { name: 'sponsor', label: 'Sponsor / team', placeholder: 'BTV Election Desk', required: true },
    ],
    documents: [
      { type: 'photo', label: 'Photo', required: true, rule: 'JPG/PNG, max 2MB' },
      { type: 'nid', label: 'NID', required: true, rule: 'PDF/JPG, max 5MB' },
      { type: 'authorization', label: 'Assignment authorization', required: true, rule: 'PDF/JPG, max 5MB' },
    ],
  },
}

export const documentLabels: Record<DocumentType, string> = {
  photo: 'Photo',
  signature: 'Signature',
  nid: 'NID',
  passport: 'Passport',
  authorization: 'Authorization letter',
  cv: 'CV / profile',
}
