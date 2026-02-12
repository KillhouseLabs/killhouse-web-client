@analyses @subscription
Feature: 분석 제한

  Background:
    Given 나는 로그인된 사용자다

  @wip
  Scenario: 무료 플랜 사용자가 월간 분석 한도 초과
    Given 나는 무료 플랜 사용자다
    And 이번 달에 10회 분석을 완료했다
    When 새 분석을 시작하려고 한다
    Then 월간 분석 한도 초과 메시지가 표시되어야 한다
    And 업그레이드 모달이 표시되어야 한다
