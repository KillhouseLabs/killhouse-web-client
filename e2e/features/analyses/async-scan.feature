@analyses @async
Feature: 비동기 분석 파이프라인

  분석 시작 시 즉시 응답하고, SAST는 바로 실행하며,
  샌드박스 생성 및 DAST 스캔은 백그라운드에서 진행한다.

  Background:
    Given 나는 로그인된 사용자다
    And 나는 Pro 플랜 사용자다
    And "테스트 프로젝트" 프로젝트가 존재한다

  @smoke
  Scenario: 분석 시작 시 즉시 응답
    Given 나는 프로젝트 상세 페이지에 있다
    When 분석 시작 버튼을 클릭한다
    Then 5초 이내에 분석이 목록에 표시되어야 한다
    And 분석 상태가 "SCANNING" 이어야 한다

  Scenario: 동시 스캔 한도 초과 시 에러
    Given 나는 프로젝트 상세 페이지에 있다
    And 동시 스캔 한도에 도달한 상태다
    When 분석 시작 버튼을 클릭한다
    Then "동시 스캔 한도" 에러가 표시되어야 한다
