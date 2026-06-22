"use client";

import { SessionProvider } from "next-auth/react";

/**
 * 전역 클라이언트 컨텍스트 프로바이더. layout 의 <body> 콘텐츠를 감싼다.
 * SessionProvider 가 useSession()·signIn()·signOut() 을 앱 전역에 제공한다.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
