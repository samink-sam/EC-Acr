import { categoryConfig } from './categoryConfig'
import type {
  AccreditationCard,
  Application,
  DemoData,
  DocumentFile,
  MasterData,
  Status,
  SystemSettings,
  UserAccount,
} from './types'

const now = new Date('2026-06-22T09:00:00+06:00')
const iso = (daysOffset: number) =>
  new Date(now.getTime() + daysOffset * 86_400_000).toISOString()

const users: UserAccount[] = [
  {
    id: 'u-applicant',
    role: 'applicant',
    name: 'Nusrat Jahan',
    mobile: '01712345678',
    email: 'nusrat@example.com',
    jurisdiction: 'Dhaka',
  },
  {
    id: 'u-applicant-2',
    role: 'applicant',
    name: 'Rafiq Ahmed',
    mobile: '01811223344',
    email: 'rafiq@example.com',
    jurisdiction: 'Chattogram',
  },
  {
    id: 'u-central',
    role: 'central_admin',
    name: 'Central Admin',
    email: 'centraladmin@bec.gov.bd',
    status: 'active',
    lastLogin: iso(-1),
  },
  {
    id: 'u-ro-dhaka',
    role: 'returning_officer',
    name: 'Returning Officer Dhaka',
    email: 'ro.dhaka@bec.gov.bd',
    jurisdiction: 'Dhaka',
    status: 'active',
    lastLogin: iso(-2),
  },
  {
    id: 'u-super',
    role: 'super_admin',
    name: 'Super Administrator',
    email: 'superadmin@bec.gov.bd',
    status: 'active',
    lastLogin: iso(0),
  },
  {
    id: 'u-verifier',
    role: 'verifier',
    name: 'Verification Desk',
    email: 'verify@bec.gov.bd',
    status: 'active',
    lastLogin: iso(-3),
  },
]

function docs(
  category: keyof typeof categoryConfig,
  uploaded = true,
): DocumentFile[] {
  return categoryConfig[category].documents.map((document) => ({
    id: `${category}-${document.type}`,
    type: document.type,
    fileName: uploaded ? `${document.type}-${category}.pdf` : '',
    required: document.required,
    uploaded: uploaded || !document.required,
  }))
}

const names = [
  ['Ayesha Rahman', 'domestic_journalist', 'Dhaka', 'Prothom Alo', 'submitted'],
  [
    'Tanvir Hossain',
    'domestic_journalist',
    'Chattogram',
    'The Daily Star',
    'under_review',
  ],
  [
    'Mehedi Hasan',
    'support_personnel',
    'Dhaka',
    'BTV Election Desk',
    'approved',
  ],
  [
    'Farhana Akter',
    'domestic_observer',
    'Sylhet',
    'Democracy Watch Bangladesh',
    'rejected',
  ],
  [
    'Emily Carter',
    'intl_journalist',
    'Dhaka',
    'Global News Network',
    'approved',
  ],
  ['Kenji Sato', 'intl_observer', 'Dhaka', 'ANFREL', 'card_issued'],
  [
    'Transparency International Bangladesh',
    'observer_org',
    'Dhaka',
    'TIB',
    'under_review',
  ],
  ['Mahfuz Alam', 'support_personnel', 'Rajshahi', 'Channel i', 'submitted'],
  ['Sabina Yasmin', 'domestic_journalist', 'Khulna', 'BSS', 'card_issued'],
  [
    'Rafiq Ahmed',
    'domestic_observer',
    'Chattogram',
    'Election Working Group',
    'draft',
  ],
  ['Nusrat Jahan', 'domestic_journalist', 'Dhaka', 'Channel i', 'card_issued'],
  [
    'Nusrat Jahan',
    'domestic_observer',
    'Dhaka',
    'Democracy Watch Bangladesh',
    'under_review',
  ],
] as const

const applications: Application[] = names.map(
  ([name, category, jurisdiction, organization, status], index) => {
    const id = `app-${index + 1}`
    const isNusrat = name === 'Nusrat Jahan'
    return {
      id,
      refNo: `BEC-ACR-2026-${String(4210 + index).padStart(6, '0')}`,
      applicantId: isNusrat
        ? 'u-applicant'
        : index % 2 === 0
          ? 'u-applicant-2'
          : `external-${index}`,
      category,
      fields: {
        fullName: name,
        mobile: isNusrat
          ? '01712345678'
          : `01711${String(100000 + index).slice(1)}`,
        email: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`,
        outlet: organization,
        organization,
        jurisdiction,
        assignment: organization,
        nationality: category.startsWith('intl')
          ? 'International'
          : 'Bangladesh',
        passport: category.startsWith('intl') ? `P${index}00881BD` : '',
      },
      documents: docs(category, status !== 'draft'),
      status: status as Status,
      jurisdiction,
      reviewerComments:
        status === 'rejected'
          ? [
              {
                by: 'Returning Officer Sylhet',
                at: iso(-4),
                text: 'Authorization letter requires a clearer scan.',
              },
            ]
          : [],
      createdAt: iso(-18 + index),
      updatedAt: iso(-8 + index),
      cardId: status === 'card_issued' ? `card-${index + 1}` : undefined,
    }
  },
)

const cards: AccreditationCard[] = [
  {
    id: 'card-6',
    cardNumber: 'BEC-CARD-2026-0006',
    applicationId: 'app-6',
    category: 'intl_observer',
    holderName: 'Kenji Sato',
    validFrom: iso(-10),
    validTo: iso(80),
    state: 'valid',
    qrPayload: '/verify?card=BEC-CARD-2026-0006',
  },
  {
    id: 'card-9',
    cardNumber: 'BEC-CARD-2026-0009',
    applicationId: 'app-9',
    category: 'domestic_journalist',
    holderName: 'Sabina Yasmin',
    validFrom: iso(-120),
    validTo: iso(-2),
    state: 'expired',
    qrPayload: '/verify?card=BEC-CARD-2026-0009',
  },
  {
    id: 'card-11',
    cardNumber: 'BEC-CARD-2026-0011',
    applicationId: 'app-11',
    category: 'domestic_journalist',
    holderName: 'Nusrat Jahan',
    validFrom: iso(-7),
    validTo: iso(95),
    state: 'valid',
    qrPayload: '/verify?card=BEC-CARD-2026-0011',
  },
  {
    id: 'card-revoked',
    cardNumber: 'BEC-CARD-2026-0999',
    applicationId: 'app-3',
    category: 'support_personnel',
    holderName: 'Mehedi Hasan',
    validFrom: iso(-20),
    validTo: iso(60),
    state: 'revoked',
    qrPayload: '/verify?card=BEC-CARD-2026-0999',
  },
]

const masterData: MasterData = {
  mediaOutlets: [
    {
      id: 'mo-1',
      name: 'Prothom Alo',
      type: 'Newspaper',
      contact: 'desk@prothomalo.com',
    },
    {
      id: 'mo-2',
      name: 'The Daily Star',
      type: 'Newspaper',
      contact: 'newsroom@thedailystar.net',
    },
    {
      id: 'mo-3',
      name: 'BTV',
      type: 'Television',
      contact: 'assignment@btv.gov.bd',
    },
    {
      id: 'mo-4',
      name: 'Channel i',
      type: 'Television',
      contact: 'election@channeli.com',
    },
    {
      id: 'mo-5',
      name: 'BSS',
      type: 'Wire service',
      contact: 'editor@bssnews.net',
    },
  ],
  observerOrganizations: [
    {
      id: 'oo-1',
      name: 'Democracy Watch Bangladesh',
      scope: 'Domestic',
      contact: 'info@democracywatch.org.bd',
    },
    {
      id: 'oo-2',
      name: 'Election Working Group',
      scope: 'Domestic',
      contact: 'secretariat@ewg.bd',
    },
    {
      id: 'oo-3',
      name: 'ANFREL',
      scope: 'International',
      contact: 'missions@anfrel.org',
    },
  ],
  jurisdictions: [
    { id: 'j-1', name: 'Dhaka', region: 'Central' },
    { id: 'j-2', name: 'Chattogram', region: 'South East' },
    { id: 'j-3', name: 'Sylhet', region: 'North East' },
    { id: 'j-4', name: 'Rajshahi', region: 'North West' },
    { id: 'j-5', name: 'Khulna', region: 'South West' },
  ],
  categoryRules: Object.entries(categoryConfig).map(([id, config]) => ({
    id: id as keyof typeof categoryConfig,
    label: config.label,
    authority: config.authority,
    accent: config.accent,
    documents: config.documents.map((document) => ({
      type: document.type,
      required: document.required,
    })),
  })),
  cardTemplates: Object.entries(categoryConfig).map(([id, config]) => ({
    id: `tpl-${id}`,
    name: `${config.label} Card`,
    category: id as keyof typeof categoryConfig,
    accent: config.accent,
  })),
}

const systemSettings: SystemSettings = {
  eventName: '2026 National Election Accreditation',
  applicationOpenDate: '2026-01-01',
  applicationCloseDate: '2026-03-15',
  cardValidityDays: 120,
  referenceFormat: 'BEC-ACR-YYYY-######',
  cardNumberFormat: 'BEC-CARD-YYYY-####',
  portalLogo: 'Bangladesh Election Commission',
  contactEmail: 'support@bec.gov.bd',
  verificationAccessMode: 'public',
  emailEnabled: true,
  smsEnabled: true,
}

export const seedData: DemoData = {
  users,
  applications,
  cards,
  masterData,
  systemSettings,
  notifications: [
    {
      id: 'n-1',
      userId: 'u-applicant',
      type: 'card',
      message: 'Your journalist accreditation card is ready.',
      read: false,
      createdAt: iso(-1),
    },
    {
      id: 'n-2',
      type: 'workflow',
      message:
        '9 applications are waiting for review across all jurisdictions.',
      read: false,
      createdAt: iso(-2),
    },
  ],
  audit: [
    {
      id: 'a-1',
      actor: 'Super Administrator',
      action: 'Seeded demo data',
      target: 'System',
      at: iso(-20),
    },
    {
      id: 'a-2',
      actor: 'Returning Officer Dhaka',
      action: 'Approved application',
      target: 'BEC-ACR-2026-004220',
      at: iso(-3),
    },
    {
      id: 'a-3',
      actor: 'Central Admin',
      action: 'Issued accreditation card',
      target: 'BEC-CARD-2026-0011',
      at: iso(-1),
    },
  ],
}
