@subscription
Feature: 구독 해지

  Background:
    Given 나는 로그인된 사용자다

  Scenario: 무료 플랜 사용자는 해지 버튼이 없음
    Given 나는 무료 플랜 사용자다
    And 나는 구독 페이지에 있다
    Then 구독 해지 버튼이 표시되지 않아야 한다

  @payment @wip
  Scenario: Pro 플랜 사용자 해지 버튼 확인
    Given 나는 Pro 플랜 사용자다
    And 나는 구독 페이지에 있다
    Then 구독 해지 버튼이 표시되어야 한다

  @payment @wip
  Scenario: 구독 해지 확인 다이얼로그
    Given 나는 Pro 플랜 사용자다
    And 나는 구독 페이지에 있다
    When 구독 해지 버튼을 클릭한다
    Then 해지 확인 다이얼로그가 표시되어야 한다
    And 다이얼로그에 경고 메시지가 표시되어야 한다

  @payment @wip
  Scenario: 구독 해지 취소
    Given 나는 Pro 플랜 사용자다
    And 나는 구독 페이지에 있다
    When 구독 해지 버튼을 클릭한다
    And 해지 확인을 취소한다
    Then 현재 플랜이 "Pro"로 유지되어야 한다

  @payment @wip
  Scenario: 구독 해지 후 무료 플랜으로 다운그레이드
    Given 나는 Pro 플랜 사용자다
    And 나는 구독 페이지에 있다
    When 구독 해지 버튼을 클릭한다
    And 해지 확인을 승인한다
    Then 구독 해지 완료 메시지가 표시되어야 한다
    And 현재 플랜이 "Free"로 표시되어야 한다
    And 구독 해지 버튼이 표시되지 않아야 한다
