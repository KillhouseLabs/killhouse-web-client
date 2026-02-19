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
  common: {
    cancel: string;
    delete: string;
    save: string;
    close: string;
    loading: string;
    error: string;
    confirm: string;
    back: string;
    search: string;
    or: string;
    unlimited: string;
    contactUs: string;
    perMonth: string;
    user: string;
    logout: string;
  };
  auth: {
    login: {
      title: string;
      subtitle: string;
      email: string;
      password: string;
      forgotPassword: string;
      submit: string;
      submitting: string;
      noAccount: string;
      signup: string;
      continueWithGoogle: string;
      continueWithGithub: string;
      errors: {
        emptyFields: string;
        invalidEmail: string;
        loginFailed: string;
        invalidCredentials: string;
      };
    };
    signup: {
      title: string;
      subtitle: string;
      name: string;
      email: string;
      password: string;
      passwordPlaceholder: string;
      confirmPassword: string;
      confirmPasswordPlaceholder: string;
      agreeTerms: string;
      termsOfService: string;
      and: string;
      privacyPolicy: string;
      submit: string;
      submitting: string;
      hasAccount: string;
      login: string;
      continueWithGoogle: string;
      continueWithGithub: string;
      errors: {
        passwordMismatch: string;
        agreeRequired: string;
        signupFailed: string;
        signupError: string;
      };
    };
    forgotPassword: {
      title: string;
      subtitle: string;
      email: string;
      submit: string;
      submitting: string;
      remember: string;
      login: string;
      success: {
        title: string;
        description: string;
        login: string;
      };
      errors: {
        emptyEmail: string;
        invalidEmail: string;
        requestError: string;
      };
    };
    resetPassword: {
      title: string;
      subtitle: string;
      newPassword: string;
      confirmPassword: string;
      submit: string;
      submitting: string;
      hint: string;
      invalidToken: string;
      requestAgain: string;
      success: {
        title: string;
        description: string;
        login: string;
      };
      errors: {
        mismatch: string;
        tooShort: string;
        weak: string;
        resetFailed: string;
        resetError: string;
      };
    };
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
  common: {
    cancel: "Cancel",
    delete: "Delete",
    save: "Save",
    close: "Close",
    loading: "Loading...",
    error: "Error",
    confirm: "Confirm",
    back: "Back",
    search: "Search",
    or: "or",
    unlimited: "Unlimited",
    contactUs: "Contact Us",
    perMonth: "/mo",
    user: "user",
    logout: "Log out",
  },
  auth: {
    login: {
      title: "Log in",
      subtitle: "Log in to your account to access the dashboard",
      email: "Email",
      password: "Password",
      forgotPassword: "Forgot password?",
      submit: "Log in",
      submitting: "Logging in...",
      noAccount: "Don't have an account?",
      signup: "Sign up",
      continueWithGoogle: "Continue with Google",
      continueWithGithub: "Continue with GitHub",
      errors: {
        emptyFields: "Please enter your email and password",
        invalidEmail: "Please enter a valid email address",
        loginFailed: "An error occurred while logging in",
        invalidCredentials: "Invalid email or password",
      },
    },
    signup: {
      title: "Sign up",
      subtitle: "Create an account and start vulnerability analysis",
      name: "Name",
      email: "Email",
      password: "Password",
      passwordPlaceholder: "8+ chars, uppercase, lowercase, and number",
      confirmPassword: "Confirm password",
      confirmPasswordPlaceholder: "Re-enter your password",
      agreeTerms: "I agree to the",
      termsOfService: "Terms of Service",
      and: "and",
      privacyPolicy: "Privacy Policy",
      submit: "Sign up",
      submitting: "Signing up...",
      hasAccount: "Already have an account?",
      login: "Log in",
      continueWithGoogle: "Continue with Google",
      continueWithGithub: "Continue with GitHub",
      errors: {
        passwordMismatch: "Passwords do not match",
        agreeRequired: "Please agree to the terms of service",
        signupFailed: "Sign up failed",
        signupError: "An error occurred during sign up",
      },
    },
    forgotPassword: {
      title: "Forgot password",
      subtitle:
        "Enter the email you used to sign up. We'll send you a password reset link.",
      email: "Email",
      submit: "Request password reset",
      submitting: "Requesting...",
      remember: "Remember your password?",
      login: "Log in",
      success: {
        title: "Check your email",
        description:
          "A password reset link has been sent to your email. Please check your email and click the link.",
        login: "Back to login",
      },
      errors: {
        emptyEmail: "Please enter your email",
        invalidEmail: "Please enter a valid email address",
        requestError: "An error occurred while processing your request",
      },
    },
    resetPassword: {
      title: "Reset password",
      subtitle: "Enter your new password.",
      newPassword: "New password",
      confirmPassword: "Confirm password",
      submit: "Reset password",
      submitting: "Resetting...",
      hint: "Password must be at least 8 characters with uppercase, lowercase, and numbers.",
      invalidToken: "The token has expired or is invalid",
      requestAgain: "Request password reset again",
      success: {
        title: "Password has been changed",
        description: "You can log in with your new password.",
        login: "Log in",
      },
      errors: {
        mismatch: "Passwords do not match",
        tooShort: "Password must be at least 8 characters",
        weak: "Password must contain uppercase, lowercase, and numbers",
        resetFailed: "Password reset failed",
        resetError: "An error occurred during password reset",
      },
    },
  },
};

export default en;
export type Dictionary = typeof en;
