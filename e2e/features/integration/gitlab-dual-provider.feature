Feature: GitLab 듀얼 프로바이더 지원
  사용자가 GitLab.com과 셀프호스팅 GitLab을 별도로 연동할 수 있다

  Background:
    Given 사용자가 로그인되어 있다

  # ── UI: 프로바이더 선택 ──

  Scenario: 프로젝트 생성 시 GitLab 버튼 클릭 후 서브메뉴가 표시된다
    When 프로젝트 생성 페이지에 접근한다
    And "GitLab" 프로바이더 버튼을 클릭한다
    Then "GitLab.com" 옵션이 서브메뉴에 보인다
    And "셀프호스팅 GitLab" 옵션이 서브메뉴에 보인다

  Scenario: 저장소 추가 시 GitLab 버튼 클릭 후 서브메뉴가 표시된다
    Given 프로젝트가 존재한다
    When 저장소 추가 모달을 연다
    And "GitLab" 프로바이더 버튼을 클릭한다
    Then "GitLab.com" 옵션이 서브메뉴에 보인다
    And "셀프호스팅 GitLab" 옵션이 서브메뉴에 보인다

  Scenario: 서브메뉴에서 GitLab.com 선택
    When 프로젝트 생성 페이지에 접근한다
    And "GitLab" 프로바이더 버튼을 클릭한다
    And "GitLab.com" 옵션을 선택한다
    Then GitLab 버튼이 선택 상태이다
    And 서브메뉴가 닫힌다

  Scenario: 서브메뉴에서 셀프호스팅 GitLab 선택
    When 프로젝트 생성 페이지에 접근한다
    And "GitLab" 프로바이더 버튼을 클릭한다
    And "셀프호스팅 GitLab" 옵션을 선택한다
    Then GitLab 버튼 텍스트가 "GitLab (셀프호스팅)"으로 변경된다
    And 서브메뉴가 닫힌다

  # ── GitLab.com OAuth ──

  Scenario: GitLab.com OAuth 인증
    When "GitLab.com" 프로바이더로 연동을 시도한다
    Then OAuth 인증 URL이 "https://gitlab.com/oauth/authorize"이다
    And 토큰 엔드포인트가 "https://gitlab.com/oauth/token"이다
    And GITLAB_CLIENT_ID 환경변수가 사용된다

  Scenario: GitLab.com 저장소 목록 조회
    Given GitLab.com 계정이 연동되어 있다
    When GitLab.com 저장소 목록을 조회한다
    Then API 호출이 "https://gitlab.com/api/v4"로 전송된다
    And provider가 "gitlab"인 Account의 토큰이 사용된다

  # ── 셀프호스팅 GitLab OAuth ──

  Scenario: 셀프호스팅 GitLab OAuth 인증
    Given GITLAB_SELF_URL이 "https://gitlab.company.com"으로 설정되어 있다
    When "셀프호스팅 GitLab" 프로바이더로 연동을 시도한다
    Then OAuth 인증 URL이 "https://gitlab.company.com/oauth/authorize"이다
    And 토큰 엔드포인트가 "https://gitlab.company.com/oauth/token"이다
    And GITLAB_SELF_CLIENT_ID 환경변수가 사용된다

  Scenario: 셀프호스팅 GitLab 저장소 목록 조회
    Given GITLAB_SELF_URL이 "https://gitlab.company.com"으로 설정되어 있다
    And 셀프호스팅 GitLab 계정이 연동되어 있다
    When 셀프호스팅 GitLab 저장소 목록을 조회한다
    Then API 호출이 "https://gitlab.company.com/api/v4"로 전송된다
    And provider가 "gitlab-self"인 Account의 토큰이 사용된다

  # ── Repository Provider 구분 ──

  Scenario: GitLab.com 저장소는 GITLAB provider로 저장된다
    Given GitLab.com 계정이 연동되어 있다
    When GitLab.com 저장소를 프로젝트에 추가한다
    Then Repository의 provider가 "GITLAB"이다

  Scenario: 셀프호스팅 GitLab 저장소는 GITLAB_SELF provider로 저장된다
    Given 셀프호스팅 GitLab 계정이 연동되어 있다
    When 셀프호스팅 GitLab 저장소를 프로젝트에 추가한다
    Then Repository의 provider가 "GITLAB_SELF"이다

  # ── URL 파싱 ──

  Scenario: GitLab.com URL 파싱
    When "https://gitlab.com/group/project" URL을 파싱한다
    Then provider가 "GITLAB"이다
    And owner가 "group"이다
    And name이 "project"이다

  Scenario: 셀프호스팅 GitLab URL 파싱
    Given GITLAB_SELF_URL이 "https://gitlab.company.com"으로 설정되어 있다
    When "https://gitlab.company.com/group/project" URL을 파싱한다
    Then provider가 "GITLAB_SELF"이다
    And owner가 "group"이다
    And name이 "project"이다

  # ── 하위 호환성 ──

  Scenario: 기존 GITLAB provider 저장소가 정상 동작한다
    Given 기존 GITLAB provider 저장소가 존재한다
    When 프로젝트 상세 페이지에 접근한다
    Then 저장소가 정상적으로 표시된다
