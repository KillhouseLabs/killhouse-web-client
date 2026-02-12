@auth
Feature: 사용자 로그인

  Background:
    Given 애플리케이션이 실행 중이다

  @smoke
  Scenario: 이메일/비밀번호로 로그인 성공
    Given 나는 로그인 페이지에 있다
    When 이메일 "e2e-test@test.example.com"을 입력한다
    And 비밀번호 "TestPassword123!"을 입력한다
    And 로그인 버튼을 클릭한다
    Then 대시보드로 이동해야 한다

  Scenario: 잘못된 비밀번호로 로그인 실패
    Given 나는 로그인 페이지에 있다
    When 이메일 "test@example.com"을 입력한다
    And 비밀번호 "wrongpassword"를 입력한다
    And 로그인 버튼을 클릭한다
    Then 로그인 에러 메시지가 표시되어야 한다

  Scenario: 존재하지 않는 이메일로 로그인 실패
    Given 나는 로그인 페이지에 있다
    When 이메일 "nonexistent@example.com"을 입력한다
    And 비밀번호 "Password123"을 입력한다
    And 로그인 버튼을 클릭한다
    Then 로그인 에러 메시지가 표시되어야 한다

  Scenario: 회원가입 페이지로 이동
    Given 나는 로그인 페이지에 있다
    When 회원가입 링크를 클릭한다
    Then 회원가입 페이지로 이동해야 한다
