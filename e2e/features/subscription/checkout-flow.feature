@subscription @payment @checkout
Feature: 결제 플로우 개선 - 확인 팝업 없이 바로 결제

  결제 버튼 클릭 시 별도의 승인 팝업(window.confirm) 없이
  바로 결제가 진행되어야 한다.

  Background:
    Given 나는 로그인된 사용자다

  @smoke
  Scenario: Pro 플랜 구독 버튼 클릭 시 확인 팝업 없이 바로 결제 완료
    Given 나는 무료 플랜 사용자다
    And 나는 구독 페이지에 있다
    When Pro 플랜을 확인 팝업 없이 바로 결제한다
    Then 현재 플랜이 "Pro"로 표시되어야 한다

  @smoke
  Scenario: Pro 플랜 구독 완료 후 성공 알림 표시
    Given 나는 무료 플랜 사용자다
    And 나는 구독 페이지에 있다
    When Pro 플랜 결제를 완료한다
    Then 현재 플랜이 "Pro"로 표시되어야 한다

  Scenario: 결제 처리 중 로딩 상태 표시
    Given 나는 무료 플랜 사용자다
    And 나는 구독 페이지에 있다
    When Pro 플랜 구독하기 버튼을 클릭한다
    Then 버튼이 로딩 상태로 변경되어야 한다

  Scenario: 결제 실패 시 에러 메시지 표시
    Given 나는 무료 플랜 사용자다
    And 나는 구독 페이지에 있다
    And 결제 API가 실패하도록 설정되어 있다
    When Pro 플랜 구독하기 버튼을 클릭한다
    Then 결제 오류 메시지가 표시되어야 한다
