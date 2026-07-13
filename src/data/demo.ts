import type { DemoStore, Profile } from '../types'

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
]

const day = (offset: number, hour = 18) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

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
  clubs: [
    {
      id: '20000000-0000-0000-0000-000000000001',
      name: '플레이스테이션',
      category: '전공',
      summary: '아이디어를 실제 서비스로 만드는 웹·앱 개발 동아리',
      description: `# 상상을 서비스로, 플레이스테이션

플레이스테이션은 **기획부터 디자인, 개발, 배포까지** 한 팀으로 경험하는 전공 동아리입니다.

## 이런 활동을 해요

- React와 TypeScript를 활용한 웹 서비스 개발
- Figma로 사용자 중심의 UI/UX 설계
- 팀 프로젝트와 코드 리뷰
- 교내 해커톤 및 전시 참여

> 지금 실력이 완벽하지 않아도 괜찮습니다. 끝까지 함께 만들 사람을 기다립니다.

## 모집 분야

| 분야 | 하는 일 |
| --- | --- |
| Frontend | 사용자가 만나는 화면 개발 |
| Backend | API와 데이터베이스 설계 |
| Design | 서비스 경험과 인터페이스 디자인 |
`,
      color: '#155eef',
      capacity: 12,
      leaderId: '10000000-0000-0000-0000-000000000002',
      leaderName: '김하늘',
      isPublished: true,
      createdAt: day(-30),
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      name: '아라',
      category: '전공',
      summary: '보안의 원리를 배우고 직접 문제를 해결하는 정보보안 동아리',
      description: `# ARA Security Lab

공격자의 시선으로 시스템을 이해하고, 더 안전한 세상을 만드는 방법을 공부합니다.

### 주요 활동

- 웹 해킹과 시스템 해킹 기초
- CTF 문제 제작 및 풀이
- 교내 보안 캠페인
- 보안 대회 팀 출전

윤리적인 보안 원칙을 가장 중요하게 생각합니다.`,
      color: '#6941c6',
      capacity: 10,
      leaderId: '10000000-0000-0000-0000-000000000010',
      leaderName: '최윤서',
      isPublished: true,
      createdAt: day(-28),
    },
    {
      id: '20000000-0000-0000-0000-000000000003',
      name: '인피니티',
      category: '전공',
      summary: '데이터에서 의미를 찾고 인공지능으로 가능성을 넓히는 동아리',
      description: `# INFINITY AI

수학과 코딩을 연결해 **인공지능 모델을 직접 만들고 실험**합니다.

1. Python 데이터 분석 스터디
2. 머신러닝·딥러닝 기초
3. 공공데이터 활용 프로젝트
4. 결과 발표와 기술 블로그 작성

Python을 처음 시작하는 학생도 기초 스터디부터 참여할 수 있습니다.`,
      color: '#0e9384',
      capacity: 14,
      leaderId: '10000000-0000-0000-0000-000000000011',
      leaderName: '정민준',
      isPublished: true,
      createdAt: day(-25),
    },
    {
      id: '20000000-0000-0000-0000-000000000004',
      name: 'DIMI SOUND',
      category: '문화예술',
      summary: '무대 위에서 하나의 소리를 완성하는 교내 밴드',
      description: `# DIMI SOUND 🎸

음악을 좋아하는 학생들이 모여 합주하고 공연하는 밴드 동아리입니다.

- 보컬, 기타, 베이스, 키보드, 드럼 모집
- 매주 파트 연습 및 정기 합주
- 학교 축제와 버스킹 공연

지원서에 연주 가능한 악기와 좋아하는 음악을 알려주세요!`,
      color: '#e04f16',
      capacity: 8,
      leaderId: '10000000-0000-0000-0000-000000000012',
      leaderName: '한지우',
      isPublished: true,
      createdAt: day(-20),
    },
    {
      id: '20000000-0000-0000-0000-000000000005',
      name: 'MIRROR',
      category: '문화예술',
      summary: '세상을 프레임 안에 기록하는 사진·영상 제작 동아리',
      description: `# MIRROR

우리의 학교생활과 이야기를 사진과 영상으로 기록합니다.

## 프로젝트

- 교내 행사 스케치 영상
- 인물 및 풍경 사진 출사
- 단편 영화 제작
- 프리미어 프로·다빈치 리졸브 편집 스터디

장비가 없어도 참여할 수 있습니다.`,
      color: '#475467',
      capacity: 10,
      leaderId: '10000000-0000-0000-0000-000000000013',
      leaderName: '서예준',
      isPublished: true,
      createdAt: day(-18),
    },
    {
      id: '20000000-0000-0000-0000-000000000006',
      name: '그린웨이브',
      category: '봉사',
      summary: '작은 실천을 모아 학교와 지역사회를 바꾸는 환경 봉사 동아리',
      description: `# GREEN WAVE 🌱

지속 가능한 학교를 만들기 위한 프로젝트를 직접 기획하고 실행합니다.

- 교내 분리배출 개선 캠페인
- 지역 환경 정화 봉사
- 업사이클링 워크숍
- 환경 데이터 조사 및 카드뉴스 제작`,
      color: '#039855',
      capacity: 16,
      leaderId: '10000000-0000-0000-0000-000000000014',
      leaderName: '윤채원',
      isPublished: true,
      createdAt: day(-16),
    },
    {
      id: '20000000-0000-0000-0000-000000000007',
      name: 'STARTUP D',
      category: '창업',
      summary: '문제를 발견하고 비즈니스로 해결하는 청소년 창업 동아리',
      description: `# STARTUP D

좋은 아이디어를 **고객이 원하는 제품**으로 발전시키는 과정을 배웁니다.

### 한 학기 로드맵

아이디어 발굴 → 사용자 인터뷰 → MVP 제작 → 피칭 데이

개발자뿐 아니라 기획, 디자인, 마케팅에 관심 있는 학생 모두 환영합니다.`,
      color: '#dc6803',
      capacity: 12,
      leaderId: '10000000-0000-0000-0000-000000000015',
      leaderName: '오현우',
      isPublished: true,
      createdAt: day(-14),
    },
    {
      id: '20000000-0000-0000-0000-000000000008',
      name: '제로백',
      category: '체육',
      summary: '기초 체력부터 팀워크까지 함께 성장하는 농구 동아리',
      description: `# ZERO100 Basketball 🏀

경기 실력보다 **성실함과 팀워크**를 중요하게 생각합니다.

- 주 1회 정기 훈련
- 포지션별 기본기 연습
- 교내 리그 및 타 학교 교류전

농구를 처음 시작하는 학생도 지원할 수 있습니다.`,
      color: '#d92d20',
      capacity: 15,
      leaderId: '10000000-0000-0000-0000-000000000016',
      leaderName: '임도현',
      isPublished: true,
      createdAt: day(-10),
    },
  ],
  questions: [
    {
      id: '30000000-0000-0000-0000-000000000001',
      clubId: '20000000-0000-0000-0000-000000000001',
      type: 'long',
      label: '플레이스테이션에 지원한 이유를 알려주세요.',
      description: '관심을 갖게 된 계기와 기대하는 활동을 함께 적어주세요.',
      required: true,
      order: 1,
    },
    {
      id: '30000000-0000-0000-0000-000000000002',
      clubId: '20000000-0000-0000-0000-000000000001',
      type: 'single',
      label: '가장 관심 있는 분야는 무엇인가요?',
      required: true,
      options: ['Frontend', 'Backend', 'Design', '아직 정하지 못함'],
      order: 2,
    },
    {
      id: '30000000-0000-0000-0000-000000000003',
      clubId: '20000000-0000-0000-0000-000000000001',
      type: 'long',
      label: '만들어 보고 싶은 서비스를 자유롭게 소개해주세요.',
      required: true,
      order: 3,
    },
    {
      id: '30000000-0000-0000-0000-000000000004',
      clubId: '20000000-0000-0000-0000-000000000001',
      type: 'link',
      label: '관련 프로젝트나 포트폴리오가 있다면 링크를 남겨주세요.',
      required: false,
      order: 4,
    },
    ...Array.from({ length: 7 }, (_, index) => {
      const clubIndex = index + 2
      return {
        id: `30000000-0000-0000-0000-0000000000${clubIndex + 3}`,
        clubId: `20000000-0000-0000-0000-00000000000${clubIndex}`,
        type: 'long' as const,
        label: '이 동아리에 지원한 이유와 하고 싶은 활동을 알려주세요.',
        required: true,
        order: 1,
      }
    }),
  ],
  applications: [
    {
      id: '40000000-0000-0000-0000-000000000001',
      clubId: '20000000-0000-0000-0000-000000000001',
      userId: '10000000-0000-0000-0000-000000000004',
      status: 'reviewing',
      answers: {
        '30000000-0000-0000-0000-000000000001': '친구들과 사용할 수 있는 서비스를 직접 완성해보고 싶어 지원했습니다.',
        '30000000-0000-0000-0000-000000000002': 'Frontend',
        '30000000-0000-0000-0000-000000000003': '기숙사 생활에 필요한 물품을 서로 빌릴 수 있는 서비스를 만들고 싶습니다.',
      },
      submittedAt: day(-2),
      updatedAt: day(-2),
    },
    {
      id: '40000000-0000-0000-0000-000000000002',
      clubId: '20000000-0000-0000-0000-000000000001',
      userId: '10000000-0000-0000-0000-000000000005',
      status: 'submitted',
      answers: {
        '30000000-0000-0000-0000-000000000001': '디자인과 개발을 함께 경험하고 싶습니다.',
        '30000000-0000-0000-0000-000000000002': 'Design',
        '30000000-0000-0000-0000-000000000003': '학생들이 급식 메뉴에 의견을 남기는 앱을 만들고 싶습니다.',
      },
      submittedAt: day(-1),
      updatedAt: day(-1),
    },
    {
      id: '40000000-0000-0000-0000-000000000003',
      clubId: '20000000-0000-0000-0000-000000000003',
      userId: '10000000-0000-0000-0000-000000000001',
      status: 'reviewing',
      answers: {
        '30000000-0000-0000-0000-000000000006': '인공지능을 활용해 학교생활의 불편함을 해결해보고 싶습니다.',
      },
      submittedAt: day(-1),
      updatedAt: day(-1),
    },
  ],
  favorites: {
    '10000000-0000-0000-0000-000000000001': [
      '20000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000003',
      '20000000-0000-0000-0000-000000000007',
    ],
  },
  notifications: [
    {
      id: '50000000-0000-0000-0000-000000000001',
      userId: '10000000-0000-0000-0000-000000000001',
      title: '지원서가 정상적으로 접수됐어요',
      message: '인피니티 지원서 제출이 완료되었습니다.',
      read: false,
      availableAt: day(-1),
      createdAt: day(-1),
    },
  ],
})
