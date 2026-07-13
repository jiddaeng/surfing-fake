# DIMI CLUB Supabase 설정 가이드

이 문서는 Supabase를 처음 사용하는 사람을 기준으로 작성했습니다. React 앱은 이미 `.env.local`의 Project URL과 Publishable key에 연결되어 있습니다.

## Supabase가 맡는 역할

| Supabase 기능 | 이 프로젝트에서 하는 일 |
| --- | --- |
| Auth | 학생·동아리장·관리자 로그인 |
| PostgreSQL Database | 동아리, 질문, 지원서, 결과, 찜, 알림 저장 |
| Row Level Security | 역할과 소유권에 따라 데이터 접근 차단 |
| Storage | 공개 동아리 로고 파일 저장 |

`Publishable key`는 브라우저에 들어가는 공개용 키입니다. 실제 데이터 보호는 SQL의 RLS 정책이 담당합니다. Database password, Secret key, `service_role` key는 이 프로젝트 파일에 넣으면 안 됩니다.

## 1. 데이터베이스 구조 만들기

1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속합니다.
2. `dimigo-club` 프로젝트를 엽니다.
3. 왼쪽 메뉴에서 `SQL Editor`를 선택합니다.
4. `New query`를 누릅니다.
5. 로컬 파일 `supabase/migrations/001_initial_schema.sql`을 열고 전체 내용을 복사합니다.
6. SQL Editor에 붙여 넣습니다.
7. 오른쪽 아래 또는 상단의 `Run`을 누릅니다.
8. 결과에 `DIMI CLUB 데이터베이스 초기 설정이 완료되었습니다.`가 나오면 성공입니다.

이 SQL은 다음 작업을 한 번에 처리합니다.

- 사용자 역할, 질문 유형, 지원 상태 타입 생성
- 9개 앱 테이블 및 외래키 생성
- 중복 지원 방지와 최대 3개 지원 제한
- 모집 기간 외 제출 차단
- 제출 후 수정·취소 차단
- 발표 전 합격 결과 API 조회 차단
- 학생·동아리장·관리자 RLS 생성
- Auth 사용자 프로필 자동 생성 트리거
- 합격 발표 인앱 알림 트리거
- `club-logos` 공개 Storage bucket 및 업로드 정책

오류가 발생하면 SQL Editor의 오류 문장과 줄 번호를 그대로 복사해서 알려주세요. 여러 번 실행해도 대부분의 객체는 안전하게 유지되도록 작성되어 있습니다.

## 2. 시연용 로그인 계정 만들기

1. 왼쪽 메뉴에서 `Authentication`을 엽니다.
2. `Users`를 선택합니다.
3. `Add user` 또는 `Create user`를 누릅니다.
4. 이메일과 비밀번호를 직접 지정하는 방식을 선택합니다.
5. `Auto confirm user` 또는 이메일 확인 완료 옵션이 있다면 켭니다.
6. 아래 계정 세 개를 만듭니다.

| 역할 | 이메일 |
| --- | --- |
| 학생 | `student@dimigo.hs.kr` |
| 동아리장 | `leader@dimigo.hs.kr` |
| 관리자 | `admin@dimigo.hs.kr` |

세 계정은 시연용으로 같은 비밀번호를 사용해도 됩니다. 단, Supabase 계정 비밀번호나 Database password를 재사용하지 마세요. 비밀번호는 저장소에 기록하지 않고 면접 전에 별도로 기억해두는 편이 안전합니다.

실제 이메일이 아닌 시연 주소이므로 초대 메일 발송 방식이 아니라 Dashboard에서 이메일과 비밀번호를 직접 지정하는 사용자 생성 방식을 사용해야 합니다.

## 3. 예시 동아리와 역할 넣기

계정 세 개를 만든 다음 실행합니다.

1. `SQL Editor → New query`를 누릅니다.
2. `supabase/migrations/002_demo_seed.sql` 전체를 복사합니다.
3. 붙여 넣고 `Run`을 누릅니다.
4. `시연용 계정 역할과 예시 데이터 입력이 완료되었습니다.`가 나오면 성공입니다.

이 SQL이 만드는 내용:

- 학생, 동아리장, 관리자 역할 설정
- 카테고리가 다른 예시 동아리 8개
- Markdown 상세 소개
- 동아리별 지원 질문
- 학생 계정의 찜 목록
- 동아리장 화면에서 볼 수 있는 예시 지원서 1개

예시 동아리 중 `플레이스테이션`은 동아리장 계정과 연결됩니다. 다른 예시 동아리는 목록 시연용이며 담당자 이름만 들어 있습니다.

## 4. 정상 적용 확인

Dashboard에서 다음을 확인합니다.

### Table Editor

`Table Editor`를 열었을 때 다음 테이블이 보여야 합니다.

- `profiles`
- `recruitment_settings`
- `clubs`
- `application_questions`
- `applications`
- `application_decisions`
- `application_answers`
- `favorites`
- `notifications`

### Storage

`Storage`를 열었을 때 `club-logos` bucket이 보여야 합니다. Public 표시가 켜져 있는 것이 정상입니다. 공개는 이미지 조회에만 적용되고, 업로드·수정·삭제는 동아리장과 관리자 정책을 따릅니다.

### RLS

각 테이블의 RLS 표시가 활성화되어 있어야 합니다. 테스트를 위해 RLS를 끄면 안 됩니다.

## 5. React 앱 실행

PowerShell에서 프로젝트 폴더로 이동한 뒤 실행합니다.

```powershell
npm install
npm run dev
```

터미널에 표시된 `http://localhost:5173` 주소를 브라우저에서 엽니다.

Vite는 실행할 때 `.env.local`을 읽습니다. `.env.local`을 수정했다면 개발 서버를 `Ctrl+C`로 종료하고 다시 `npm run dev`를 실행해야 합니다.

## 6. 역할별 테스트 순서

### 학생 계정

1. 학생 계정으로 로그인합니다.
2. 동아리 검색과 카테고리 필터를 사용합니다.
3. 동아리를 찜합니다.
4. 지원서를 작성하고 임시 저장합니다.
5. 다시 들어가 답변이 복구되는지 확인합니다.
6. 최종 제출합니다.
7. 내 지원 현황에서 제출 상태를 확인합니다.

### 동아리장 계정

1. 로그아웃하고 동아리장 계정으로 로그인합니다.
2. 플레이스테이션 소개를 Markdown으로 수정합니다.
3. 실시간 미리보기를 확인합니다.
4. 지원 질문을 추가하거나 수정합니다.
5. 지원자 목록에서 학생의 답변을 엽니다.
6. 합격 또는 불합격으로 처리합니다.

### 관리자 계정

1. 관리자 계정으로 로그인합니다.
2. 전체 지원 통계를 확인합니다.
3. 모집 마감과 발표 시각을 수정합니다.
4. 누가 어느 동아리에 지원했는지 확인합니다.
5. 지원서 답변 내용은 관리자 화면에 보이지 않는지 확인합니다.

### 발표 기능 테스트

관리자 계정에서 합격 발표 시각을 현재보다 1~2분 뒤로 설정합니다. 동아리장 계정에서 합격 처리한 뒤 학생 계정으로 로그인합니다.

- 발표 전: 결과가 `검토 중`으로 표시됩니다.
- 발표 후: 합격 또는 불합격 결과와 알림이 표시됩니다.

합격 결과는 별도 `application_decisions` 테이블에 저장되며, 발표 전에는 학생의 직접 API 요청에도 RLS가 결과 행을 반환하지 않습니다.

## 자주 발생하는 문제

### `relation ... does not exist` 또는 화면 상단 404 안내

`001_initial_schema.sql`이 아직 실행되지 않았습니다.

### `Invalid login credentials`

Authentication의 Users에 계정이 만들어졌는지, 이메일이 정확한지, Auto confirm이 적용됐는지 확인합니다.

### `new row violates row-level security policy`

현재 계정 역할과 수행하려는 작업이 맞지 않거나 SQL 일부가 실행되지 않은 상태입니다. `profiles`에서 계정 역할을 확인하고 001 SQL 실행 오류가 없었는지 봅니다.

### 동아리장 화면에 동아리가 없음

`002_demo_seed.sql`을 계정 생성 전에 실행했을 수 있습니다. 계정 세 개를 만든 뒤 002 SQL을 한 번 더 실행하면 플레이스테이션과 동아리장 계정이 연결됩니다.

### 변경한 환경변수가 반영되지 않음

Vite 개발 서버를 완전히 종료하고 다시 실행합니다. 변수 이름이 `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`인지 확인합니다.
