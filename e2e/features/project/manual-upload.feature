Feature: 수동 파일 업로드
  사용자가 ZIP 파일을 직접 업로드하여 저장소를 추가할 수 있다

  Background:
    Given 로그인된 사용자가 프로젝트 상세 페이지에 있다

  Scenario: ZIP 파일 업로드 성공
    Given "수동 업로드" 프로바이더를 선택한다
    When 유효한 ZIP 파일을 드래그 앤 드롭한다
    And 저장소 이름을 입력한다
    And "추가" 버튼을 클릭한다
    Then 파일이 S3에 업로드된다
    And 저장소가 생성된다
    And 성공 메시지가 표시된다

  Scenario: ZIP 파일 형식 유효성 검사
    Given "수동 업로드" 프로바이더를 선택한다
    When .txt 파일을 업로드한다
    Then "ZIP 파일만 업로드할 수 있습니다" 에러가 표시된다

  Scenario: ZIP 매직 바이트 유효성 검사
    Given "수동 업로드" 프로바이더를 선택한다
    When 확장자는 .zip이지만 내용이 다른 파일을 업로드한다
    Then "유효한 ZIP 파일이 아닙니다" 에러가 표시된다

  Scenario: 프로젝트 삭제 시 S3 오브젝트 정리
    Given 수동 업로드된 저장소가 있는 프로젝트가 존재한다
    When 프로젝트를 삭제한다
    Then S3에서 관련 오브젝트가 삭제된다
    And 프로젝트 상태가 "DELETED"로 변경된다
