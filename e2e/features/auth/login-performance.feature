@auth @performance
Feature: 로그인 성능 최적화

  Background:
    Given 애플리케이션이 실행 중이다

  @smoke
  Scenario: 자격 증명 로그인 시 비밀번호 검증이 비동기로 처리된다
    Given 유효한 이메일과 비밀번호를 가진 사용자가 존재한다
    When 사용자가 로그인 폼을 제출한다
    Then bcrypt 비밀번호 비교가 비동기적으로 수행된다
    And 이벤트 루프가 블로킹되지 않는다

  Scenario: 로그인 폼에 로딩 인디케이터가 즉시 표시된다
    Given 나는 로그인 페이지에 있다
    When 로그인 버튼을 클릭한다
    Then 즉시 로딩 스피너가 표시된다
    And 버튼이 비활성화된다
