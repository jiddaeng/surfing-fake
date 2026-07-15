import type { Club, DemoStore, Profile } from '../types'
import { CLUB_CATALOG, catalogDescription, catalogSummary } from './clubs'

export const DEMO_PASSWORD = 'local-demo-only'

export const DEMO_ACCOUNTS: Array<Profile & { password: string }> = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    email: 'student@dimigo.hs.kr',
    password: DEMO_PASSWORD,
    name: '시연 학생',
    studentNumber: '1301',
    role: 'student',
    isActive: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    email: 'leader@dimigo.hs.kr',
    password: DEMO_PASSWORD,
    name: '시연 동아리장',
    studentNumber: '2407',
    role: 'leader',
    isActive: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000003',
    email: 'admin@dimigo.hs.kr',
    password: DEMO_PASSWORD,
    name: '학생회 IT부',
    role: 'admin',
    isActive: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000006',
    email: 'newleader@dimigo.hs.kr',
    password: DEMO_PASSWORD,
    name: '신규 동아리장',
    studentNumber: '2501',
    role: 'leader',
    isActive: true,
  },
]

const demoAccountsKey = 'surfing-fake:demo-accounts'

export const readDemoAccounts = (): Array<Profile & { password: string }> => {
  try {
    const saved = JSON.parse(localStorage.getItem(demoAccountsKey) || '[]')
    const overrides = Array.isArray(saved) ? saved : []
    return [
      ...DEMO_ACCOUNTS.filter((account) => !overrides.some((override) => override?.id === account.id)),
      ...overrides,
    ]
  } catch {
    return DEMO_ACCOUNTS
  }
}

export const saveDemoAccount = (account: Profile & { password: string }) => {
  const customAccounts = readDemoAccounts()
    .filter((item) => !DEMO_ACCOUNTS.some((base) => base.id === item.id) && item.id !== account.id)
  localStorage.setItem(demoAccountsKey, JSON.stringify([...customAccounts, account]))
}

const day = (offset: number, hour = 18) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

const demoId = (prefix: '2' | '3', index: number) => `${prefix}0000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`

const clubs: Club[] = CLUB_CATALOG.map((entry, index) => ({
  id: demoId('2', index),
  name: entry.name,
  category: entry.category,
  summary: catalogSummary(entry.category),
  description: catalogDescription(entry.name, entry.category),
  color: entry.color,
  capacity: 10,
  leaderId: index === 0 ? '10000000-0000-0000-0000-000000000002' : '',
  leaderName: entry.leaderName ?? '담당 동아리장',
  isPublished: true,
  createdAt: day(-30 + index),
}))

export const createDemoStore = (): DemoStore => ({
  profiles: [
    ...DEMO_ACCOUNTS.map(({ password, ...profile }) => {
      void password
      return profile
    }),
    {
      id: '10000000-0000-0000-0000-000000000004',
      email: 'student2@dimigo.hs.kr',
      name: '지원자 A',
      studentNumber: '1512',
      role: 'student',
      isActive: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      email: 'student3@dimigo.hs.kr',
      name: '지원자 B',
      studentNumber: '2211',
      role: 'student',
      isActive: true,
    },
  ],
  settings: {
    id: 'global',
    recruitmentStartAt: day(-3, 9),
    recruitmentEndAt: day(7, 18),
    resultAnnouncementAt: day(12, 18),
    maxApplications: 3,
  },
  clubs,
  questions: CLUB_CATALOG.map((entry, index) => ({
    id: demoId('3', index),
    clubId: demoId('2', index),
    type: 'long',
    label: `${entry.name}에 지원한 이유를 알려주세요.`,
    required: true,
    order: 1,
  })),
  applications: [
    {
      id: '40000000-0000-0000-0000-000000000001',
      clubId: '20000000-0000-0000-0000-000000000001',
      userId: '10000000-0000-0000-0000-000000000004',
      status: 'reviewing',
      answers: {
        '30000000-0000-0000-0000-000000000001': '동아리 활동을 통해 프로젝트 경험을 쌓고 싶어 지원했습니다.',
      },
      submittedAt: day(-2),
      updatedAt: day(-2),
    },
  ],
  favorites: {
    '10000000-0000-0000-0000-000000000001': [
      '20000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000006',
      '20000000-0000-0000-0000-000000000009',
    ],
  },
  notifications: [],
})
