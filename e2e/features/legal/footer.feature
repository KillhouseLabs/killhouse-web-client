@legal
Feature: 공용 Footer 사업자정보 표시

  전자상거래법에 따라 통신판매업자는 모든 페이지에
  사업자정보를 표시해야 한다.

  @business-info
  Scenario: 홈페이지 Footer에 사업자정보가 표시된다
    Given 나는 홈페이지에 있다
    Then Footer에 상호가 표시되어야 한다
    And Footer에 대표자명이 표시되어야 한다
    And Footer에 사업자등록번호가 표시되어야 한다
    And Footer에 통신판매업 신고번호가 표시되어야 한다
    And Footer에 주소가 표시되어야 한다
    And Footer에 연락처가 표시되어야 한다
    And Footer에 이용약관 링크가 있어야 한다
    And Footer에 개인정보처리방침 링크가 있어야 한다

  @business-info
  Scenario: 가격 페이지 Footer에 사업자정보가 표시된다
    Given 나는 가격 페이지에 있다
    Then Footer에 상호가 표시되어야 한다
    And Footer에 사업자등록번호가 표시되어야 한다
    And Footer에 이용약관 링크가 있어야 한다
    And Footer에 개인정보처리방침 링크가 있어야 한다

  @business-info
  Scenario: 이용약관 페이지 Footer에 사업자정보가 표시된다
    Given 나는 이용약관 페이지에 있다
    Then Footer에 상호가 표시되어야 한다
    And Footer에 사업자등록번호가 표시되어야 한다

  @business-info
  Scenario: 개인정보처리방침 페이지 Footer에 사업자정보가 표시된다
    Given 나는 개인정보처리방침 페이지에 있다
    Then Footer에 상호가 표시되어야 한다
    And Footer에 사업자등록번호가 표시되어야 한다
