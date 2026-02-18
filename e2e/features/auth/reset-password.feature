@auth
Feature: 비밀번호 재설정

  Background:
    Given 애플리케이션이 실행 중이다

  Scenario: 유효한 토큰으로 비밀번호 재설정 페이지 접근
    Given 유효한 비밀번호 재설정 토큰이 있다
    When 비밀번호 재설정 페이지에 접근한다
    Then 비밀번호 재설정 폼이 표시되어야 한다

  Scenario: 새 비밀번호로 재설정 성공
    Given 유효한 비밀번호 재설정 토큰이 있다
    And 비밀번호 재설정 페이지에 접근한다
    When 새 비밀번호에 "NewPassword123"을 입력한다
    And 비밀번호 확인에 "NewPassword123"을 입력한다
    And 비밀번호 재설정 버튼을 클릭한다
    Then "비밀번호가 변경되었습니다" 메시지가 표시되어야 한다

  Scenario: 비밀번호 불일치로 재설정 실패
    Given 유효한 비밀번호 재설정 토큰이 있다
    And 비밀번호 재설정 페이지에 접근한다
    When 새 비밀번호에 "NewPassword123"을 입력한다
    And 비밀번호 확인에 "DifferentPassword123"을 입력한다
    And 비밀번호 재설정 버튼을 클릭한다
    Then "비밀번호가 일치하지 않습니다" 메시지가 표시되어야 한다

  Scenario: 만료된 토큰으로 접근 실패
    Given 만료된 비밀번호 재설정 토큰이 있다
    When 비밀번호 재설정 페이지에 접근한다
    Then "토큰이 만료되었거나 유효하지 않습니다" 메시지가 표시되어야 한다

  Scenario: 토큰 없이 접근 시 에러
    When 토큰 없이 비밀번호 재설정 페이지에 접근한다
    Then "토큰이 만료되었거나 유효하지 않습니다" 메시지가 표시되어야 한다
