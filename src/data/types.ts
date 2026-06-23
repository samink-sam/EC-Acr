export type Role =
  | 'applicant'
  | 'central_admin'
  | 'returning_officer'
  | 'super_admin'
  | 'verifier'
export type Category =
  | 'domestic_journalist'
  | 'intl_journalist'
  | 'domestic_observer'
  | 'intl_observer'
  | 'observer_org'
  | 'support_personnel'
export type Status =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'card_issued'
export type CardState = 'valid' | 'expired' | 'revoked'
export type DocumentType =
  | 'photo'
  | 'signature'
  | 'nid'
  | 'passport'
  | 'authorization'
  | 'cv'

export interface UserAccount {
  id: string
  role: Role
  name: string
  email?: string
  mobile?: string
  jurisdiction?: string
  status?: 'active' | 'inactive' | 'locked'
  lastLogin?: string
}

export interface DocumentFile {
  id: string
  type: DocumentType
  fileName: string
  required: boolean
  uploaded: boolean
}

export interface ReviewerComment {
  by: string
  at: string
  text: string
}

export interface Application {
  id: string
  refNo: string
  applicantId: string
  category: Category
  fields: Record<string, string>
  documents: DocumentFile[]
  status: Status
  jurisdiction: string
  reviewerComments?: ReviewerComment[]
  createdAt: string
  updatedAt: string
  cardId?: string
}

export interface AccreditationCard {
  id: string
  cardNumber: string
  applicationId: string
  category: Category
  holderName: string
  validFrom: string
  validTo: string
  state: CardState
  qrPayload: string
}

export interface Notification {
  id: string
  userId?: string
  type: string
  message: string
  read: boolean
  createdAt: string
}

export interface AuditEntry {
  id: string
  actor: string
  action: string
  target?: string
  at: string
}

export interface MediaOutlet {
  id: string
  name: string
  type: string
  contact: string
}

export interface ObserverOrganization {
  id: string
  name: string
  scope: string
  contact: string
}

export interface Jurisdiction {
  id: string
  name: string
  region: string
}

export interface CategoryRule {
  id: Category
  label: string
  authority: 'central' | 'local'
  accent: string
  documents: Array<{ type: DocumentType; required: boolean }>
}

export interface CardTemplate {
  id: string
  name: string
  category: Category
  accent: string
}

export interface MasterData {
  mediaOutlets: MediaOutlet[]
  observerOrganizations: ObserverOrganization[]
  jurisdictions: Jurisdiction[]
  categoryRules: CategoryRule[]
  cardTemplates: CardTemplate[]
}

export interface SystemSettings {
  eventName: string
  applicationOpenDate: string
  applicationCloseDate: string
  cardValidityDays: number
  referenceFormat: string
  cardNumberFormat: string
  portalLogo: string
  contactEmail: string
  verificationAccessMode: 'public' | 'gated'
  emailEnabled: boolean
  smsEnabled: boolean
}

export interface DemoData {
  users: UserAccount[]
  applications: Application[]
  cards: AccreditationCard[]
  notifications: Notification[]
  audit: AuditEntry[]
  masterData: MasterData
  systemSettings: SystemSettings
}
