const en: {
  nav: {
    pricing: string;
    docs: string;
    login: string;
    getStarted: string;
  };
  hero: {
    badge: string;
    headlinePre: string;
    headlineHighlight: string;
    subheadline: string;
    ctaPrimary: string;
    ctaSecondary: string;
    socialProof: string;
  };
  painPoints: {
    title: string;
    subtitle: string;
    cards: Array<{
      title: string;
      description: string;
    }>;
  };
  pipeline: {
    title: string;
    subtitle: string;
    steps: Array<{
      label: string;
      description: string;
    }>;
  };
  features: {
    title: string;
    subtitle: string;
    items: Array<{
      title: string;
      description: string;
    }>;
  };
  cta: {
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
  };
  pricing: {
    title: string;
    subtitle: string;
    free: {
      name: string;
      description: string;
      cta: string;
    };
    pro: {
      name: string;
      description: string;
      badge: string;
      cta: string;
    };
    enterprise: {
      name: string;
      description: string;
      cta: string;
    };
    perMonth: string;
    custom: string;
    features: {
      projects: string;
      analysesPerMonth: string;
      githubGitlab: string;
      basicReports: string;
      detailedReports: string;
      pentest: string;
      prioritySupport: string;
      unlimited: string;
      upTo: string;
      unlimitedEverything: string;
      ssoSaml: string;
      onPremise: string;
      customPolicies: string;
      dedicatedSupport: string;
      slaGuarantee: string;
    };
    faq: {
      title: string;
      items: Array<{
        question: string;
        answer: string;
      }>;
    };
  };
  footer: {
    tagline: string;
    product: string;
    documentation: string;
    dashboard: string;
    company: string;
    contact: string;
    legal: string;
    privacy: string;
    terms: string;
    allRights: string;
    systemStatus: string;
  };
} = {
  nav: {
    pricing: "Pricing",
    docs: "Docs",
    login: "Log in",
    getStarted: "Get Started",
  },
  hero: {
    badge: "Now in Public Beta",
    headlinePre: "Ship fast.",
    headlineHighlight: "Stay secure.",
    subheadline:
      "Worried about vulnerabilities after every deploy? Killhouse runs SAST, DAST, and AI-powered penetration testing — then generates fix patches automatically.",
    ctaPrimary: "Start Free",
    ctaSecondary: "See How It Works",
    socialProof: "Free plan includes 3 projects · No credit card required",
  },
  painPoints: {
    title: "Security tools shouldn't slow you down",
    subtitle:
      "Complex setup. Fragmented results. No guidance on how to fix what's found. Sound familiar? We built Killhouse to eliminate every friction point between your code and a secure deployment.",
    cards: [
      {
        title: "Complex configuration",
        description:
          "Most scanners need YAML pipelines, custom Docker images, and hours of tuning. We need one OAuth click.",
      },
      {
        title: "Findings without fixes",
        description:
          "A list of CVEs is useless if your team doesn't know how to remediate them. We generate patches you can apply.",
      },
      {
        title: "Static-only coverage",
        description:
          "SAST catches patterns, but real exploits need runtime context. We combine SAST + DAST + pen-testing.",
      },
    ],
  },
  pipeline: {
    title: "From code to report in five steps",
    subtitle:
      "Connect once, analyze continuously. Every push triggers a full security pipeline.",
    steps: [
      {
        label: "Connect",
        description: "Link your GitHub or GitLab repo in one click",
      },
      {
        label: "SAST",
        description: "Static analysis catches vulnerabilities in source code",
      },
      {
        label: "DAST",
        description: "Dynamic testing probes your running application",
      },
      {
        label: "AI Fix",
        description: "Get auto-generated patches with full diff preview",
      },
      {
        label: "Report",
        description: "Executive summary and detailed findings, ready to share",
      },
    ],
  },
  features: {
    title: "Everything you need to secure your code",
    subtitle: "One platform replaces your entire security toolchain.",
    items: [
      {
        title: "SAST + DAST in One Pipeline",
        description:
          "No more juggling separate tools. Run static and dynamic analysis together and get a unified vulnerability report.",
      },
      {
        title: "AI-Powered Fix Suggestions",
        description:
          "Don't just find vulnerabilities — fix them. Our AI generates ready-to-apply patches with full code diffs.",
      },
      {
        title: "Automated Penetration Testing",
        description:
          "Simulate real-world attacks in a sandboxed environment. Validate exploitability before attackers do.",
      },
      {
        title: "One-Click Setup",
        description:
          "Connect your repository, pick a branch, and start scanning. Zero configuration, instant results.",
      },
      {
        title: "Executive Summaries",
        description:
          "AI-generated overviews that translate technical findings into business impact for stakeholders.",
      },
      {
        title: "Sandbox Isolation",
        description:
          "Every analysis runs in an isolated container. Your code never leaves a secure, ephemeral environment.",
      },
    ],
  },
  cta: {
    title: "Ready to secure your next deploy?",
    subtitle:
      "Start with the free plan. Connect a repo and get your first vulnerability report in under a minute.",
    ctaPrimary: "Get Started — It's Free",
    ctaSecondary: "View Pricing",
  },
  pricing: {
    title: "Simple pricing, powerful security",
    subtitle:
      "Choose the plan that fits your project. Every plan includes core security analysis features.",
    free: {
      name: "Free",
      description: "Perfect for personal projects",
      cta: "Start Free",
    },
    pro: {
      name: "Pro",
      description: "For teams and startups",
      badge: "Popular",
      cta: "Start Pro",
    },
    enterprise: {
      name: "Enterprise",
      description: "For large organizations",
      cta: "Contact Sales",
    },
    perMonth: "/mo",
    custom: "Custom",
    features: {
      projects: "projects",
      analysesPerMonth: "analyses/month",
      githubGitlab: "GitHub/GitLab integration",
      basicReports: "Basic vulnerability reports",
      detailedReports: "Detailed vulnerability reports",
      pentest: "Penetration testing",
      prioritySupport: "Priority support",
      unlimited: "Unlimited",
      upTo: "Up to",
      unlimitedEverything: "Unlimited everything",
      ssoSaml: "SSO / SAML",
      onPremise: "On-premise deployment",
      customPolicies: "Custom security policies",
      dedicatedSupport: "Dedicated support",
      slaGuarantee: "SLA guarantee",
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        {
          question: "Can I upgrade from Free to Pro at any time?",
          answer:
            "Yes, you can upgrade at any time. All your existing projects and analysis results will be preserved.",
        },
        {
          question: "How does penetration testing work?",
          answer:
            "After static analysis, your application runs in a sandboxed environment where automated penetration tests simulate real attack scenarios to verify vulnerabilities.",
        },
        {
          question: "Can I analyze private repositories?",
          answer:
            "Yes, connect your GitHub or GitLab account to analyze private repositories. Repository access is only used during analysis.",
        },
      ],
    },
  },
  footer: {
    tagline: "AI-powered security analysis\nfor modern development teams.",
    product: "Product",
    documentation: "Documentation",
    dashboard: "Dashboard",
    company: "Company",
    contact: "Contact",
    legal: "Legal",
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    allRights: "All rights reserved.",
    systemStatus: "All systems operational",
  },
};

export default en;
export type Dictionary = typeof en;
