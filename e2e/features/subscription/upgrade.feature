@subscription @payment
Feature: 구독 업그레이드

  Background:
    Given 나는 로그인된 사용자다

  @smoke
  Scenario: 구독 페이지 접근 및 플랜 정보 확인
    Given 나는 구독 페이지에 있다
    Then 현재 플랜이 표시되어야 한다
    And 플랜 선택 섹션이 표시되어야 한다
    And Free 플랜 카드가 표시되어야 한다
    And Pro 플랜 카드가 표시되어야 한다
    And Enterprise 플랜 카드가 표시되어야 한다

  @smoke
  Scenario: 무료 플랜 사용자의 사용량 확인
    Given 나는 무료 플랜 사용자다
    And 나는 구독 페이지에 있다
    Then 프로젝트 사용량이 표시되어야 한다
    And 월간 분석 사용량이 표시되어야 한다
    And 스토리지 용량이 표시되어야 한다

  Scenario: Pro 플랜 업그레이드 버튼 확인
    Given 나는 무료 플랜 사용자다
    And 나는 구독 페이지에 있다
    Then Pro 플랜에 구독하기 버튼이 활성화되어야 한다
    And Free 플랜에 현재 플랜 버튼이 표시되어야 한다

  @payment @wip
  Scenario: Pro 플랜으로 업그레이드 (테스트 모드)
    Given 나는 무료 플랜 사용자다
    And 나는 구독 페이지에 있다
    When Pro 플랜 결제를 완료한다
    Then 현재 플랜이 "Pro"로 표시되어야 한다

  @payment @wip
  Scenario: 결제 미진행 시 플랜 유지
    Given 나는 무료 플랜 사용자다
    And 나는 구독 페이지에 있다
    Then 현재 플랜이 "Free"로 유지되어야 한다

  Scenario: Enterprise 플랜 문의하기
    Given 나는 구독 페이지에 있다
    Then Enterprise 플랜에 문의하기 링크가 표시되어야 한다
