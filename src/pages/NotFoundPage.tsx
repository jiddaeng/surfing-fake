import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export function NotFoundPage() {
  return <div className="mx-auto max-w-lg py-24 text-center"><p className="text-7xl font-black text-brand-100">404</p><h1 className="mt-4 text-2xl font-black">페이지를 찾을 수 없어요</h1><p className="mt-2 text-sm text-gray-500">주소가 바뀌었거나 존재하지 않는 페이지입니다.</p><Link to="/" className="mt-6 inline-flex"><Button>홈으로 돌아가기</Button></Link></div>
}
