import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { seedData } from '@/data/seed'
import type {
  AccreditationCard,
  Application,
  AuditEntry,
  DemoData,
  MasterData,
  Notification,
  Role,
  SystemSettings,
  UserAccount,
} from '@/data/types'

export interface DemoState extends DemoData {
  activeRole: Role
  currentUserId: string
  isAuthenticated: boolean
  toastQueue: Notification[]
  resetDemoData: () => void
  setAuthenticated: (isAuthenticated: boolean) => void
  setRole: (role: Role) => void
  setCurrentUser: (userId: string) => void
  upsertUser: (user: UserAccount) => void
  setUsers: (users: UserAccount[]) => void
  upsertApplication: (application: Application) => void
  upsertCard: (card: AccreditationCard) => void
  setCards: (cards: AccreditationCard[]) => void
  addNotification: (notification: Notification) => void
  markNotificationRead: (id: string) => void
  addAudit: (entry: AuditEntry) => void
  updateMasterData: (masterData: MasterData) => void
  updateSystemSettings: (settings: SystemSettings) => void
  consumeToast: (id: string) => void
}

const initialState = () => ({
  ...structuredClone(seedData),
  activeRole: 'applicant' as Role,
  currentUserId: 'u-applicant',
  isAuthenticated: false,
  toastQueue: [] as Notification[],
})

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      ...initialState(),
      resetDemoData: () => set(initialState()),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setRole: (role) =>
        set((state) => {
          const userForRole =
            state.users.find((user) => user.role === role) ?? state.users[0]
          return { activeRole: role, currentUserId: userForRole.id }
        }),
      setCurrentUser: (userId) => set({ currentUserId: userId }),
      upsertUser: (user) =>
        set((state) => ({
          users: state.users.some((item) => item.id === user.id)
            ? state.users.map((item) => (item.id === user.id ? user : item))
            : [...state.users, user],
        })),
      setUsers: (users) => set({ users }),
      upsertApplication: (application) =>
        set((state) => ({
          applications: state.applications.some(
            (item) => item.id === application.id,
          )
            ? state.applications.map((item) =>
                item.id === application.id ? application : item,
              )
            : [application, ...state.applications],
        })),
      upsertCard: (card) =>
        set((state) => ({
          cards: state.cards.some((item) => item.id === card.id)
            ? state.cards.map((item) => (item.id === card.id ? card : item))
            : [card, ...state.cards],
        })),
      setCards: (cards) => set({ cards }),
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
          toastQueue: [notification, ...state.toastQueue],
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id ? { ...item, read: true } : item,
          ),
        })),
      addAudit: (entry) => set((state) => ({ audit: [entry, ...state.audit] })),
      updateMasterData: (masterData) => set({ masterData }),
      updateSystemSettings: (systemSettings) => set({ systemSettings }),
      consumeToast: (id) =>
        set((state) => ({
          toastQueue: state.toastQueue.filter((item) => item.id !== id),
        })),
    }),
    {
      name: 'bec-accreditation-demo',
      version: 1,
    },
  ),
)

export function getCurrentUser(state: DemoState) {
  return (
    state.users.find((user) => user.id === state.currentUserId) ??
    state.users[0]
  )
}
