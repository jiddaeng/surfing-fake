export const CLUB_CATEGORIES = ['창업', '수학', '경제', 'ai', '농업', '게임', '피지컬 컴퓨팅', '강의'] as const

export interface ClubCatalogEntry {
  name: string
  category: (typeof CLUB_CATEGORIES)[number]
  leaderName?: string
  color: string
}

export const CLUB_CATALOG: readonly ClubCatalogEntry[] = [
  { name: '저스트', category: '창업', leaderName: '박초연', color: '#155eef' },
  { name: '루나', category: '창업', color: '#7c3aed' },
  { name: '임플루드', category: '창업', color: '#0e9384' },
  { name: '모나드', category: '창업', color: '#dc6803' },
  { name: '게임즈', category: '게임', color: '#d92d20' },
  { name: '블루프린트', category: '게임', color: '#2563eb' },
  { name: '무럭무럭', category: '농업', color: '#039855' },
  { name: '커맨드', category: '강의', color: '#475467' },
  { name: '토포스', category: '창업', color: '#c11574' },
  { name: '프레직', category: 'ai', color: '#9333ea' },
  { name: '코드베이커리', category: '피지컬 컴퓨팅', color: '#ea580c' },
  { name: '크레비스', category: '창업', color: '#0891b2' },
  { name: '온', category: '수학', color: '#4f46e5' },
]

export const LEGACY_DEMO_CLUB_NAMES = ['플레이스테이션', '아라', '인피니티', 'DIMI SOUND', 'MIRROR', '그린웨이브', 'STARTUP D', '제로백'] as const

export const catalogClubId = (index: number) => `50000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`
export const catalogQuestionId = (index: number) => `51000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`

export const catalogSummary = (category: string) => `${category} 분야 동아리입니다.`

export const catalogDescription = (name: string, category: string) => `# ${name}

## 카테고리

${category}

상세 활동과 모집 안내는 동아리에서 제공하는 내용을 기준으로 업데이트할 예정입니다.`
