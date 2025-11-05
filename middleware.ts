import { NextRequest, NextResponse } from 'next/server'

// 仅保护管理端页面路径；API 已在各自路由做鉴权
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (!pathname.startsWith('/admin')) return NextResponse.next()
  if (pathname === '/admin/login') return NextResponse.next()
  const token = req.cookies.get('admin_session')?.value
  if (!token) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }
  // 轻量校验签名格式（过期校验在服务端渲染）
  if (!token.includes('.')) {
    const url = req.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}

