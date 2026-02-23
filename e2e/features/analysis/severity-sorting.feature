Feature: 취약점 심각도 정렬
  보안 담당자로서
  심각도 순으로 취약점을 정렬하여 우선 대응하고 싶다

  Scenario: 기본 정렬이 심각도 내림차순이다
    Given 분석 결과에 CRITICAL, LOW, HIGH 취약점이 있다
    When 결과 페이지를 열면
    Then CRITICAL → HIGH → MEDIUM → LOW → INFO 순서로 표시된다

  Scenario: 테이블 헤더 클릭으로 정렬 토글
    Given 심각도 내림차순으로 정렬된 findings가 있다
    When 심각도 컬럼 헤더를 클릭하면
    Then 정렬 방향이 오름차순으로 변경된다

  Scenario: 심각도 필터링
    Given 여러 심각도의 findings가 표시되어 있다
    When "CRITICAL" 필터를 선택하면
    Then CRITICAL 등급의 findings만 표시된다
