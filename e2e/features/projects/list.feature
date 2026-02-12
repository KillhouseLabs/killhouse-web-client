@projects
Feature: 프로젝트 목록

  Background:
    Given 나는 로그인된 사용자다

  @smoke @wip
  Scenario: 프로젝트 목록 조회
    Given "테스트 프로젝트" 프로젝트가 존재한다
    When 나는 프로젝트 목록 페이지에 있다
    Then 프로젝트 목록에 "테스트 프로젝트"가 표시되어야 한다

  Scenario: 빈 프로젝트 목록
    Given 프로젝트가 없다
    Then 빈 프로젝트 상태가 표시되어야 한다
    And "새 프로젝트" 버튼이 표시되어야 한다

  Scenario: 프로젝트 상세 페이지로 이동
    Given "테스트 프로젝트" 프로젝트가 존재한다
    And 나는 프로젝트 목록 페이지에 있다
    When 프로젝트 "테스트 프로젝트"를 클릭한다
    Then 프로젝트 상세 페이지로 이동해야 한다
