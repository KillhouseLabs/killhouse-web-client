Feature: 분석 결과 마크다운 렌더링
  보안 분석 결과를 확인하는 사용자로서
  마크다운이 적용된 가독성 높은 결과를 보고 싶다

  Scenario: AI 요약에 마크다운이 렌더링된다
    Given 마크다운 형식의 executiveSummary가 포함된 분석 결과가 있다
    When 분석 상세 페이지를 열면
    Then 제목, 볼드, 리스트, 코드블록이 올바르게 렌더링된다

  Scenario: 취약점 설명에 코드 스니펫이 하이라이팅된다
    Given 코드 예시가 포함된 취약점 finding이 있다
    When finding 상세를 열면
    Then 코드블록에 구문 강조가 적용된다
