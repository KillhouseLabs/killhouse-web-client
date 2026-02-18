@subscription @payment
Feature: 청약철회 및 환불 정책

  전자상거래법에 따라 결제일로부터 7일 이내 청약철회 시 전액환불,
  7일 초과 시 사용일수 기반 일할계산 환불을 제공한다.

  Background:
    Given 나는 로그인된 사용자다

  @refund
  Scenario: 결제 당일 청약철회 시 전액환불
    Given 나는 Pro 플랜 사용자다
    And 결제일로부터 0일이 경과했다
    When 환불을 요청한다
    Then 전액환불이 적용되어야 한다

  @refund
  Scenario: 결제 3일 후 청약철회 시 전액환불
    Given 나는 Pro 플랜 사용자다
    And 결제일로부터 3일이 경과했다
    When 환불을 요청한다
    Then 전액환불이 적용되어야 한다

  @refund
  Scenario: 결제 7일째 청약철회 시 전액환불 (경계값)
    Given 나는 Pro 플랜 사용자다
    And 결제일로부터 7일이 경과했다
    When 환불을 요청한다
    Then 전액환불이 적용되어야 한다

  @refund
  Scenario: 결제 8일째 환불 시 일할계산 (경계값)
    Given 나는 Pro 플랜 사용자다
    And 결제일로부터 8일이 경과했다
    When 환불을 요청한다
    Then 일할계산 환불이 적용되어야 한다

  @refund
  Scenario: 결제 15일 후 환불 시 일할계산
    Given 나는 Pro 플랜 사용자다
    And 결제일로부터 15일이 경과했다
    When 환불을 요청한다
    Then 일할계산 환불이 적용되어야 한다

  @refund
  Scenario: 구독 종료 직전 환불 시 최소 금액
    Given 나는 Pro 플랜 사용자다
    And 결제일로부터 29일이 경과했다
    When 환불을 요청한다
    Then 일할계산 환불이 적용되어야 한다
