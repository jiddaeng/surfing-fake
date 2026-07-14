import type { Club, DemoStore, Profile } from '../types'

export const DEMO_PASSWORD = 'demo1234'

export const DEMO_ACCOUNTS: Array<Profile & { password: string }> = [
  {
    id: '10000000-0000-0000-0000-000000000001',
    email: 'student@dimigo.hs.kr',
    password: DEMO_PASSWORD,
    name: '안지호',
    studentNumber: '1301',
    role: 'student',
    isActive: true,
  },
  {
    id: '10000000-0000-0000-0000-000000000002',
    email: 'leader@dimigo.hs.kr',
    password: DEMO_PASSWORD,
    name: '김하늘',
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
    name: '이서윤',
    studentNumber: '2501',
    role: 'leader',
    isActive: true,
  },
]

const day = (offset: number, hour = 18) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

const clubNames = ['저스트', '루나', '임플루드', '모나드', '게임즈', '블루프린트', '무럭무럭', '커맨드', '토포스']
const colors = ['#155eef', '#7c3aed', '#0e9384', '#dc6803', '#d92d20', '#2563eb', '#039855', '#475467', '#c11574']

const clubs: Club[] = clubNames.map((name, index) => ({
  id: `20000000-0000-0000-0000-00000000000${index + 1}`,
  name,
  category: '전공',
  summary: '동아리 소개 준비 중입니다.',
  description: `# ${name}

동아리 소개 준비 중입니다.

동아리장이 활동 내용, 모집 분야, 지원 안내를 Markdown으로 자유롭게 작성할 수 있습니다.`,
  color: colors[index],
  capacity: 10,
  leaderId: index === 0 ? '10000000-0000-0000-0000-000000000002' : `10000000-0000-0000-0000-0000000000${index + 10}`,
  leaderName: index === 0 ? '김하늘' : '담당 동아리장',
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
      name: '박서연',
      studentNumber: '1512',
      role: 'student',
      isActive: true,
    },
    {
      id: '10000000-0000-0000-0000-000000000005',
      email: 'student3@dimigo.hs.kr',
      name: '이도윤',
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
  questions: clubNames.map((name, index) => ({
    id: `30000000-0000-0000-0000-00000000000${index + 1}`,
    clubId: `20000000-0000-0000-0000-00000000000${index + 1}`,
    type: 'long',
    label: `${name}에 지원한 이유를 알려주세요.`,
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
