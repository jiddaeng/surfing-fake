export type Role = 'student' | 'leader' | 'admin'
export type QuestionType = 'short' | 'long' | 'single' | 'multiple' | 'link'
export type ApplicationStatus = 'draft' | 'submitted' | 'reviewing' | 'accepted' | 'rejected'

export interface Profile {
  id: string
  email: string
  name: string
  studentNumber?: string
  role: Role
  avatarUrl?: string
  isActive: boolean
}

export interface Club {
  id: string
  name: string
  category: string
  summary: string
  description: string
  logoUrl?: string
  color: string
  capacity: number
  leaderId: string
  leaderName: string
  isPublished: boolean
  createdAt: string
}

export interface ApplicationQuestion {
  id: string
  clubId: string
  type: QuestionType
  label: string
  description?: string
  required: boolean
  options?: string[]
  order: number
}

export type AnswerValue = string | string[]

export interface ClubApplication {
  id: string
  clubId: string
  userId: string
  status: ApplicationStatus
  answers: Record<string, AnswerValue>
  submittedAt?: string
  updatedAt: string
}

export interface AppNotification {
  id: string
  userId: string
  title: string
  message: string
  read: boolean
  availableAt: string
  createdAt: string
}

export interface RecruitmentSettings {
  id: string
  recruitmentStartAt: string
  recruitmentEndAt: string
  resultAnnouncementAt: string
  maxApplications: number
}

export interface DemoStore {
  profiles: Profile[]
  clubs: Club[]
  questions: ApplicationQuestion[]
  applications: ClubApplication[]
  favorites: Record<string, string[]>
  notifications: AppNotification[]
  settings: RecruitmentSettings
}

export const ROLE_LABEL: Record<Role, string> = {
  student: '학생',
  leader: '동아리장',
  admin: '관리자',
}

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  draft: '작성 중',
  submitted: '제출 완료',
  reviewing: '검토 중',
  accepted: '합격',
  rejected: '불합격',
}

export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  short: '짧은 답변',
  long: '긴 답변',
  single: '단일 선택',
  multiple: '복수 선택',
  link: '링크',
}
