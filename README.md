# DIMI CLUB

디미고 학생회 IT부 지원을 위해 제작한 모바일 우선 동아리 지원 서비스입니다.

TODOLIST.md 먼저 봐라




## 기술 스택

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- Supabase Auth, PostgreSQL, Storage, RLS
- React Router, React Markdown

## 주요 기능

- 동아리 검색, 카테고리 필터, 가나다순·최근 등록순 정렬
- 동아리 찜과 Markdown 상세 소개
- 동아리별 동적 지원 질문과 임시 저장
- 학생별 최대 3개 지원, 중복 지원 및 마감 후 제출 차단
- 제출 후 수정·취소 금지
- 동아리장용 소개·질문 편집 및 지원자 합격 처리
- 공통 발표 시각 이후 결과·알림 공개
- 관리자용 전체 통계, 모집 일정, 지원 현황
- 모바일 하단 내비게이션과 반응형 화면

## 실행

```powershell
npm install
npm run dev
```

프로덕션 빌드 확인:

```powershell
npm run build
```

Supabase를 처음 설정한다면 [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)를 순서대로 따라가세요.

## 환경변수

`.env.example`을 참고해 `.env.local`에 다음 값을 넣습니다.

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Database password나 Secret/service role key는 프런트엔드 환경변수에 넣지 않습니다.
