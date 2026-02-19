/**
 * 브라우저 네비게이션 유틸리티
 * 테스트에서 mock 가능하도록 분리
 */
export function navigateTo(url: string): void {
  window.location.assign(url);
}
