@auth
Feature: 비밀번호 찾기

  Background:
    Given 애플리케이션이 실행 중이다

  @smoke
  Scenario: 로그인 페이지에서 비밀번호 찾기 페이지로 이동
    Given 나는 로그인 페이지에 있다
    When 비밀번호 찾기 링크를 클릭한다
    Then 비밀번호 찾기 페이지로 이동해야 한다

  Scenario: 등록된 이메일로 비밀번호 재설정 요청
    Given 나는 비밀번호 찾기 페이지에 있다
    When 이메일 입력란에 "e2e-test@test.example.com"을 입력한다
    And 비밀번호 재설정 요청 버튼을 클릭한다
    Then "이메일을 확인해주세요" 메시지가 표시되어야 한다

  Scenario: 등록되지 않은 이메일로 요청해도 동일한 응답
    Given 나는 비밀번호 찾기 페이지에 있다
    When 이메일 입력란에 "nonexistent@example.com"을 입력한다
    And 비밀번호 재설정 요청 버튼을 클릭한다
    Then "이메일을 확인해주세요" 메시지가 표시되어야 한다

  Scenario: 잘못된 이메일 형식으로 요청 실패
    Given 나는 비밀번호 찾기 페이지에 있다
    When 이메일 입력란에 "invalid-email"을 입력한다
    And 비밀번호 재설정 요청 버튼을 클릭한다
    Then "올바른 이메일 주소를 입력하세요" 메시지가 표시되어야 한다

  Scenario: 로그인 페이지로 돌아가기
    Given 나는 비밀번호 찾기 페이지에 있다
    When 로그인 링크를 클릭한다
    Then 로그인 페이지로 이동해야 한다
