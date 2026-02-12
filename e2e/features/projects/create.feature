@projects
Feature: 프로젝트 생성

  Background:
    Given 나는 로그인된 사용자다

  @smoke @wip
  Scenario: 단일 저장소로 프로젝트 생성
    Given 나는 프로젝트 목록 페이지에 있다
    When 새 프로젝트 버튼을 클릭한다
    And 프로젝트 이름을 "테스트 프로젝트"로 입력한다
    And GitHub 저장소 "my-org/my-repo"를 선택한다
    And 생성 버튼을 클릭한다
    Then "프로젝트가 생성되었습니다" 메시지가 표시되어야 한다
    And 프로젝트 상세 페이지로 이동해야 한다
    And 저장소 "my-org/my-repo"가 primary로 표시되어야 한다

  @multi-repo @wip
  Scenario: 여러 저장소로 프로젝트 생성
    Given 나는 새 프로젝트 생성 페이지에 있다
    When 프로젝트 이름을 "마이크로서비스"로 입력한다
    And 다음 저장소들을 추가한다:
      | provider | repository        | role     |
      | GITHUB   | my-org/frontend   | frontend |
      | GITHUB   | my-org/backend    | backend  |
      | GITLAB   | company/shared    | shared   |
    And 생성 버튼을 클릭한다
    Then 프로젝트에 3개의 저장소가 연결되어야 한다
    And 첫 번째 저장소가 primary로 설정되어야 한다

  Scenario: 프로젝트 이름 없이 생성 시도
    Given 나는 새 프로젝트 생성 페이지에 있다
    When 생성 버튼을 클릭한다
    Then "프로젝트 이름" 에러가 표시되어야 한다
