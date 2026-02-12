@analyses
Feature: 분석 생성

  Background:
    Given 나는 로그인된 사용자다
    And 나는 Pro 플랜 사용자다
    And "테스트 프로젝트" 프로젝트가 존재한다

  @smoke @wip
  Scenario: 분석 시작
    Given 나는 프로젝트 상세 페이지에 있다
    When 분석 시작 버튼을 클릭한다
    And 브랜치 "main"을 선택한다
    And "시작" 버튼을 클릭한다
    Then 분석이 "PENDING" 상태로 생성되어야 한다
    And 분석 목록에 새 분석이 표시되어야 한다
