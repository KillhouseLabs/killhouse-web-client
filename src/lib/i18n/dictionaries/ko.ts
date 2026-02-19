import type { Dictionary } from "./en";

const ko: Dictionary = {
  nav: {
    pricing: "가격",
    docs: "문서",
    login: "로그인",
    getStarted: "시작하기",
  },
  hero: {
    badge: "퍼블릭 베타 운영 중",
    headlinePre: "빠르게 배포하고,",
    headlineHighlight: "안전하게 지키세요.",
    subheadline:
      "배포 후 보안 취약점이 여전히 걱정되시나요? Killhouse는 SAST, DAST, AI 기반 모의 침투 테스트를 실행하고 수정 패치까지 자동으로 생성합니다.",
    ctaPrimary: "무료로 시작하기",
    ctaSecondary: "작동 방식 보기",
    socialProof: "무료 플랜 3개 프로젝트 포함 · 신용카드 불필요",
  },
  painPoints: {
    title: "보안 도구가 개발을 방해해서는 안 됩니다",
    subtitle:
      "복잡한 설정, 파편화된 결과, 해결 방법 없는 취약점 목록. 익숙하시죠? Killhouse는 코드와 안전한 배포 사이의 모든 마찰을 제거합니다.",
    cards: [
      {
        title: "복잡한 설정",
        description:
          "대부분의 스캐너는 YAML 파이프라인, 커스텀 Docker 이미지, 수시간의 튜닝이 필요합니다. 저희는 OAuth 클릭 한 번이면 됩니다.",
      },
      {
        title: "수정 없는 탐지 결과",
        description:
          "CVE 목록만으로는 부족합니다. 팀이 어떻게 수정해야 할지 모른다면 무의미합니다. 저희는 바로 적용 가능한 패치를 생성합니다.",
      },
      {
        title: "정적 분석만으로는 부족",
        description:
          "SAST는 패턴을 잡지만, 실제 익스플로잇은 런타임 컨텍스트가 필요합니다. SAST + DAST + 모의 침투를 결합합니다.",
      },
    ],
  },
  pipeline: {
    title: "코드에서 리포트까지 다섯 단계",
    subtitle:
      "한 번 연결하면 지속적으로 분석합니다. 모든 푸시가 전체 보안 파이프라인을 트리거합니다.",
    steps: [
      {
        label: "연결",
        description: "GitHub 또는 GitLab 저장소를 클릭 한 번으로 연결",
      },
      {
        label: "SAST",
        description: "정적 분석으로 소스 코드의 취약점 탐지",
      },
      {
        label: "DAST",
        description: "동적 테스트로 실행 중인 애플리케이션 점검",
      },
      {
        label: "AI 수정",
        description: "전체 diff 미리보기와 함께 자동 생성된 패치 제공",
      },
      {
        label: "리포트",
        description: "경영진 요약과 상세 발견 사항, 공유 준비 완료",
      },
    ],
  },
  features: {
    title: "코드 보안에 필요한 모든 것",
    subtitle: "하나의 플랫폼이 전체 보안 도구 체인을 대체합니다.",
    items: [
      {
        title: "SAST + DAST 통합 파이프라인",
        description:
          "별도 도구를 번갈아 쓸 필요 없습니다. 정적·동적 분석을 함께 실행하고 통합 취약점 리포트를 받으세요.",
      },
      {
        title: "AI 기반 수정 제안",
        description:
          "취약점을 찾는 것에 그치지 않고 수정합니다. AI가 전체 코드 diff와 함께 바로 적용 가능한 패치를 생성합니다.",
      },
      {
        title: "자동화된 모의 침투 테스트",
        description:
          "샌드박스 환경에서 실제 공격을 시뮬레이션합니다. 공격자보다 먼저 익스플로잇 가능성을 검증하세요.",
      },
      {
        title: "원클릭 설정",
        description:
          "저장소를 연결하고, 브랜치를 선택하고, 스캔을 시작하세요. 설정 불필요, 즉시 결과 확인.",
      },
      {
        title: "경영진 요약 리포트",
        description:
          "AI가 생성한 개요로 기술적 발견 사항을 이해관계자를 위한 비즈니스 영향으로 번역합니다.",
      },
      {
        title: "샌드박스 격리",
        description:
          "모든 분석은 격리된 컨테이너에서 실행됩니다. 코드는 안전한 임시 환경을 벗어나지 않습니다.",
      },
    ],
  },
  cta: {
    title: "다음 배포를 안전하게 하시겠습니까?",
    subtitle:
      "무료 플랜으로 시작하세요. 저장소를 연결하면 1분 안에 첫 취약점 리포트를 받을 수 있습니다.",
    ctaPrimary: "무료로 시작하기",
    ctaSecondary: "가격 보기",
  },
  pricing: {
    title: "심플한 가격, 강력한 보안",
    subtitle:
      "프로젝트에 맞는 플랜을 선택하세요. 모든 플랜에 핵심 보안 분석 기능이 포함됩니다.",
    free: {
      name: "Free",
      description: "개인 프로젝트에 적합",
      cta: "무료로 시작하기",
    },
    pro: {
      name: "Pro",
      description: "팀과 스타트업에 적합",
      badge: "인기",
      cta: "Pro 시작하기",
    },
    enterprise: {
      name: "Enterprise",
      description: "대규모 조직에 적합",
      cta: "문의하기",
    },
    perMonth: "/월",
    custom: "문의",
    features: {
      projects: "프로젝트",
      analysesPerMonth: "분석/월",
      githubGitlab: "GitHub/GitLab 연동",
      basicReports: "기본 취약점 리포트",
      detailedReports: "상세 취약점 리포트",
      pentest: "모의 침투 테스트",
      prioritySupport: "우선 지원",
      unlimited: "무제한",
      upTo: "최대",
      unlimitedEverything: "무제한 모든 것",
      ssoSaml: "SSO / SAML",
      onPremise: "온프레미스 배포",
      customPolicies: "커스텀 보안 정책",
      dedicatedSupport: "전담 지원",
      slaGuarantee: "SLA 보장",
    },
    faq: {
      title: "자주 묻는 질문",
      items: [
        {
          question: "무료 플랜에서 유료로 언제든 업그레이드할 수 있나요?",
          answer:
            "네, 언제든지 업그레이드할 수 있습니다. 업그레이드 시 기존 프로젝트와 분석 결과는 모두 유지됩니다.",
        },
        {
          question: "모의 침투 테스트는 어떻게 진행되나요?",
          answer:
            "정적 분석 후 샌드박스 환경에서 애플리케이션을 실행하고, 자동화된 모의 침투 테스트를 수행합니다. 실제 공격 시나리오를 시뮬레이션하여 취약점을 검증합니다.",
        },
        {
          question: "비공개 저장소도 분석할 수 있나요?",
          answer:
            "네, GitHub 또는 GitLab 계정을 연동하면 비공개 저장소도 분석할 수 있습니다. 저장소 접근 권한은 분석 시에만 사용됩니다.",
        },
      ],
    },
  },
  footer: {
    tagline: "AI 기반 보안 분석\n현대 개발팀을 위한 플랫폼.",
    product: "제품",
    documentation: "문서",
    dashboard: "대시보드",
    company: "회사",
    contact: "문의",
    legal: "법적 고지",
    privacy: "개인정보처리방침",
    terms: "이용약관",
    allRights: "All rights reserved.",
    systemStatus: "전체 시스템 정상 운영 중",
  },
};

export default ko;
