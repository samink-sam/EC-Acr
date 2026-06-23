import { categoryConfig } from '@/data/categoryConfig'
import type {
  AccreditationCard,
  Application,
  Category,
  MasterData,
  Role,
  Status,
  SystemSettings,
  UserAccount,
} from '@/data/types'
import { uid } from '@/lib/utils'
import { useDemoStore } from '@/store'

const delay = async () =>
  new Promise((resolve) => window.setTimeout(resolve, 300))
const nowIso = () => new Date().toISOString()

function notify(message: string, type = 'workflow', userId?: string) {
  useDemoStore.getState().addNotification({
    id: uid('note'),
    userId,
    type,
    message,
    read: false,
    createdAt: nowIso(),
  })
}

function audit(actor: string, action: string, target?: string) {
  useDemoStore
    .getState()
    .addAudit({ id: uid('audit'), actor, action, target, at: nowIso() })
}

export const mockApi = {
  async login(role: Role, credential: string) {
    await delay()
    const state = useDemoStore.getState()
    const user = state.users.find((item) => item.role === role)
    if (!user) throw new Error('No demo account exists for this role.')
    if (role === 'applicant' && credential.length < 6)
      throw new Error('Enter the 6 digit demo OTP.')
    state.setRole(role)
    state.setCurrentUser(user.id)
    state.setAuthenticated(true)
    notify(`Signed in as ${user.name}.`, 'auth', user.id)
    audit(user.name, 'Signed in', role)
    return user
  },

  async registerApplicant(
    contact: string,
    name = 'New Applicant',
    email?: string,
    mobile?: string,
  ) {
    await delay()
    const state = useDemoStore.getState()
    const existing = state.users.find(
      (user) => user.mobile === contact || user.email === contact,
    )
    if (existing) {
      state.setRole('applicant')
      state.setCurrentUser(existing.id)
      notify(
        `Welcome back, ${existing.name}. Demo OTP accepted.`,
        'auth',
        existing.id,
      )
      return existing
    }
    const isEmail = contact.includes('@')
    const user: UserAccount = {
      id: uid('user'),
      role: 'applicant',
      name,
      email: email ?? (isEmail ? contact : undefined),
      mobile: mobile ?? (isEmail ? undefined : contact),
      jurisdiction: 'Dhaka',
    }
    state.upsertUser(user)
    state.setRole('applicant')
    state.setCurrentUser(user.id)
    notify(
      'Applicant profile created. Demo OTP accepted.',
      'registration',
      user.id,
    )
    audit(user.name, 'Registered applicant account', contact)
    return user
  },

  async saveProfile(profile: UserAccount) {
    await delay()
    useDemoStore.getState().upsertUser(profile)
    notify('Profile saved.', 'profile', profile.id)
    audit(profile.name, 'Updated applicant profile')
    return profile
  },

  async submitApplication(input: {
    applicantId: string
    category: Category
    fields: Record<string, string>
    jurisdiction: string
    draft?: boolean
  }) {
    await delay()
    const state = useDemoStore.getState()
    const sequence = 4217 + state.applications.length
    const application: Application = {
      id: uid('app'),
      refNo: `BEC-ACR-2026-${String(sequence).padStart(6, '0')}`,
      applicantId: input.applicantId,
      category: input.category,
      fields: input.fields,
      jurisdiction: input.jurisdiction,
      documents: categoryConfig[input.category].documents.map((document) => {
        const ruleDocument = state.masterData.categoryRules
          .find((rule) => rule.id === input.category)
          ?.documents.find((item) => item.type === document.type)
        return {
          id: uid(document.type),
          type: document.type,
          required: ruleDocument?.required ?? document.required,
          uploaded: true,
          fileName: `${document.type}-${sequence}.pdf`,
        }
      }),
      status: input.draft ? 'draft' : 'submitted',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      reviewerComments: [],
    }
    state.upsertApplication(application)
    notify(
      `${application.refNo} ${input.draft ? 'saved as draft' : 'submitted for review'}.`,
      'application',
      input.applicantId,
    )
    audit(
      'Applicant',
      input.draft ? 'Saved draft' : 'Submitted application',
      application.refNo,
    )
    return application
  },

  async transitionApplication(
    applicationId: string,
    status: Status,
    comment: string,
    actor: string,
  ) {
    await delay()
    const state = useDemoStore.getState()
    const application = state.applications.find(
      (item) => item.id === applicationId,
    )
    if (!application) throw new Error('Application not found.')
    let updated: Application = {
      ...application,
      status,
      updatedAt: nowIso(),
      reviewerComments: comment
        ? [
            ...(application.reviewerComments ?? []),
            { by: actor, at: nowIso(), text: comment },
          ]
        : application.reviewerComments,
    }
    if (status === 'card_issued' || status === 'approved') {
      const cardNumber = `BEC-CARD-2026-${String(state.cards.length + 1001).padStart(4, '0')}`
      const card: AccreditationCard = {
        id: uid('card'),
        cardNumber,
        applicationId: application.id,
        category: application.category,
        holderName:
          application.fields.fullName ||
          application.fields.organization ||
          'Accredited Holder',
        validFrom: nowIso(),
        validTo: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString(),
        state: 'valid',
        qrPayload: `/verify?card=${cardNumber}`,
      }
      state.upsertCard(card)
      updated = { ...updated, status: 'card_issued', cardId: card.id }
    }
    state.upsertApplication(updated)
    notify(
      `${updated.refNo} moved to ${updated.status.replace('_', ' ')}.`,
      'workflow',
      updated.applicantId,
    )
    audit(actor, `Set status to ${updated.status}`, updated.refNo)
    return updated
  },

  async verifyCard(cardNumber: string) {
    await delay()
    return (
      useDemoStore
        .getState()
        .cards.find(
          (card) => card.cardNumber.toLowerCase() === cardNumber.toLowerCase(),
        ) ?? null
    )
  },

  async updateMasterData(masterData: MasterData, actor: string) {
    await delay()
    useDemoStore.getState().updateMasterData(masterData)
    notify('Master data updated.', 'master-data')
    audit(actor, 'Updated master data')
    return masterData
  },

  async saveAdminUser(user: UserAccount, actor: string) {
    await delay()
    useDemoStore.getState().upsertUser(user)
    notify(`${user.name} account saved.`, 'user-management')
    audit(actor, 'Saved admin account', user.name)
    return user
  },

  async updateSystemSettings(settings: SystemSettings, actor: string) {
    await delay()
    useDemoStore.getState().updateSystemSettings(settings)
    notify('System settings updated.', 'settings')
    audit(actor, 'Updated system settings', settings.eventName)
    return settings
  },

  async overrideApplication(
    applicationId: string,
    status: Status,
    actor: string,
  ) {
    await delay()
    const state = useDemoStore.getState()
    const application = state.applications.find(
      (item) => item.id === applicationId,
    )
    if (!application) throw new Error('Application not found.')
    const updated: Application = {
      ...application,
      status,
      updatedAt: nowIso(),
      reviewerComments: [
        ...(application.reviewerComments ?? []),
        { by: actor, at: nowIso(), text: `Super admin override to ${status}.` },
      ],
    }
    state.upsertApplication(updated)
    notify(
      `${updated.refNo} overridden to ${status}.`,
      'governance',
      updated.applicantId,
    )
    audit(actor, `Overrode application to ${status}`, updated.refNo)
    return updated
  },

  async updateCardState(
    cardId: string,
    cardState: AccreditationCard['state'],
    actor: string,
  ) {
    await delay()
    const state = useDemoStore.getState()
    const card = state.cards.find((item) => item.id === cardId)
    if (!card) throw new Error('Card not found.')
    const updated = { ...card, state: cardState }
    state.upsertCard(updated)
    notify(`${card.cardNumber} set to ${cardState}.`, 'card-lifecycle')
    audit(
      actor,
      `${cardState === 'revoked' ? 'Revoked' : 'Updated'} card`,
      card.cardNumber,
    )
    return updated
  },

  async switchRole(role: Role) {
    await delay()
    useDemoStore.getState().setRole(role)
    const user = useDemoStore
      .getState()
      .users.find((item) => item.role === role)
    notify(`Now acting as ${user?.name ?? role}.`, 'role')
    return role
  },
}
