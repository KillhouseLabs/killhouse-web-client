@auth @oauth
Feature: OAuth 로그인

  Background:
    Given 애플리케이션이 실행 중이다

  @github @smoke
  Scenario: GitHub로 로그인 시작
    Given 나는 로그인 페이지에 있다
    When "GitHub"로 계속하기 버튼을 클릭한다
    Then GitHub 인증 페이지로 리다이렉트되어야 한다

  @google
  Scenario: Google로 로그인 시작
    Given 나는 로그인 페이지에 있다
    When "Google"로 계속하기 버튼을 클릭한다
    Then Google 인증 페이지로 리다이렉트되어야 한다
