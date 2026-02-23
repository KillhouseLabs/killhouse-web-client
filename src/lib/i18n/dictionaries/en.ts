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
  analysis: {
    statusLabels: {
      PENDING: string;
      CLONING: string;
      SCANNING: string;
      STATIC_ANALYSIS: string;
      BUILDING: string;
      PENETRATION_TEST: string;
      EXPLOIT_VERIFICATION: string;
      COMPLETED: string;
      COMPLETED_WITH_ERRORS: string;
      FAILED: string;
      CANCELLED: string;
    };
    resultsTitle: string;
    progressHeading: string;
    inProgressMessage: string;
    intermediateResultsHeading: string;
    summaryTitle: string;
    cancelModalTitle: string;
    cancelConfirmMessage: string;
    cancellingLabel: string;
    cancelAnalysisButton: string;
    rerunningLabel: string;
    rerunButton: string;
    noVulnerabilitiesHeading: string;
    noVulnerabilitiesMessage: string;
    scanNotRunHeading: string;
    scanNotRunMessage: string;
    failedHeading: string;
    failedMessage: string;
    stepStatusFailed: string;
    stepStatusSkipped: string;
    exploitTitle: string;
    exploitSessionLoadError: string;
    exploitStatusLabels: {
      pending: string;
      running: string;
      success: string;
      failed: string;
      stopped: string;
      error: string;
    };
    exploitProgressLabel: string;
    exploitResultLabels: {
      success: string;
      failed: string;
      waiting: string;
    };
    vulnerabilityDetailTitle: string;
    findingLabels: {
      rule: string;
      file: string;
      url: string;
      cwe: string;
      reference: string;
      description: string;
    };
    fixButtonCodeFix: string;
    fixButtonAISuggestion: string;
    fixLoadingCodeAnalysis: string;
    fixLoadingAISuggestion: string;
    fixSectionExplanation: string;
    fixSectionSuggestion: string;
    fixSectionExampleCode: string;
    fixCodeFixFailed: string;
    fixAISuggestionFailed: string;
    noFindingsInTable: string;
    severityFilterAll: string;
    severityColumnLabel: string;
    tableColumns: {
      file: string;
      line: string;
      rule: string;
      url: string;
      template: string;
      description: string;
    };
    countSuffix: string;
    askAIButton: string;
    aiChatHeading: string;
    chatLabels: {
      user: string;
      assistant: string;
    };
    aiChatGenerating: string;
    chatInputPlaceholder: string;
    sendButton: string;
    presetQuestions: {
      impactAnalysis: string;
      attackScenario: string;
      fixSuggestion: string;
    };
    errorGeneric: string;
    networkError: string;
    retry: string;
    sastResultsTitle: string;
    dastResultsTitle: string;
    sastStepLabel: string;
    dastStepLabel: string;
    sastSummaryTitle: string;
    dastSummaryTitle: string;
  };
  project: {
    startAnalysisButton: string;
    checkingLabel: string;
    startingLabel: string;
    subscriptionCheckError: string;
    startError: string;
    cannotStartError: string;
    form: {
      nameLabel: string;
      namePlaceholder: string;
      descriptionLabel: string;
      descriptionPlaceholder: string;
      repositoryLabel: string;
      manualUploadLabel: string;
      addedRepositoriesLabel: string;
      setPrimaryButton: string;
      addRepositoryButton: string;
      searchRepositoriesButton: string;
      sourceCodeLabel: string;
      dropZoneLabel: string;
      maxFileSize: string;
      repositoryNameLabel: string;
      repositoryNamePlaceholder: string;
      defaultBranchLabel: string;
      processTitle: string;
      processSteps: {
        clone: string;
        sast: string;
        sandbox: string;
        pentest: string;
        report: string;
      };
      submitCreating: string;
      submitCreate: string;
      validation: {
        nameRequired: string;
        repoNameRequired: string;
        zipRequired: string;
        repoRequired: string;
        zipOnly: string;
        fileTooLarge: string;
        fileEmpty: string;
      };
      repositoryAlreadyAdded: string;
      createFailed: string;
      uploadProgress: string;
      uploadFailed: string;
      createError: string;
    };
    list: {
      loadFailed: string;
      loadError: string;
      emptyHeading: string;
      emptyMessage: string;
      createFirstProjectButton: string;
      multipleReposBadge: string;
      manualUploadLabel: string;
      analysisCountLabel: string;
      paginationLabel: string;
      previousButton: string;
      nextButton: string;
    };
    detail: {
      statusLabels: {
        PENDING: string;
        CLONING: string;
        STATIC_ANALYSIS: string;
        BUILDING: string;
        PENETRATION_TEST: string;
        COMPLETED: string;
        COMPLETED_WITH_ERRORS: string;
        FAILED: string;
        CANCELLED: string;
      };
      deleteButton: string;
      deleteModalTitle: string;
      deleteConfirmMessage: string;
      deletingLabel: string;
      repositoryInfoTitle: string;
      manualUploadLabel: string;
      manualUploadMessage: string;
      openRepositoryButton: string;
      totalAnalyses: string;
      vulnerabilitiesFound: string;
      analysisSuffix: string;
      vulnerabilitySuffix: string;
      createdDateLabel: string;
      processPipelineTitle: string;
      recentAnalysesTitle: string;
      noAnalysesHeading: string;
      noAnalysesMessage: string;
      startFirstAnalysisButton: string;
      viewDetailsButton: string;
    };
    statusLabels: {
      active: string;
      archived: string;
    };
    resourceUsage: {
      title: string;
      limitReachedMessage: string;
    };
  };
  dashboard: {
    statsLabels: {
      totalProjects: string;
      completedAnalyses: string;
      vulnerabilitiesFound: string;
      criticalVulnerabilities: string;
    };
    quickStartTitle: string;
    quickActions: {
      createProject: string;
      createProjectDescription: string;
      viewProjects: string;
      viewProjectsDescription: string;
      upgradePlan: string;
      upgradePlanDescription: string;
    };
    recentActivityTitle: string;
    noActivityHeading: string;
    noActivityMessage: string;
    activity: {
      completed: string;
      failed: string;
      inProgress: string;
    };
  };
  subscription: {
    popularBadge: string;
    currentPlanBadge: string;
    freePlanButton: string;
    lowerThanCurrentButton: string;
    contactSalesButton: string;
    modal: {
      projectLimitTitle: string;
      analysisLimitTitle: string;
      projectLimitDescription: string;
      analysisLimitDescription: string;
      projectLimitText: string;
      analysisLimitText: string;
      usageLabel: string;
      upgradeFeatureTitle: string;
      features: {
        unlimitedProjects: string;
        monthlyAnalyses: string;
        storage: string;
        prioritySupport: string;
      };
      upgradeButton: string;
      laterButton: string;
    };
    checkout: {
      paymentFailed: string;
      upgradeSuccess: string;
      errorProcessing: string;
      verificationFailed: string;
      preparationFailed: string;
      cancelled: string;
      processingError: string;
      processingLabel: string;
      subscribeButton: string;
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
  analysis: {
    statusLabels: {
      PENDING: "Pending",
      CLONING: "Cloning Repository",
      SCANNING: "Scanning",
      STATIC_ANALYSIS: "Static Analysis",
      BUILDING: "Building",
      PENETRATION_TEST: "Penetration Testing",
      EXPLOIT_VERIFICATION: "Exploit Verification",
      COMPLETED: "Completed",
      COMPLETED_WITH_ERRORS: "Completed with Errors",
      FAILED: "Failed",
      CANCELLED: "Cancelled",
    },
    resultsTitle: "Analysis Results",
    progressHeading: "Analysis Progress",
    inProgressMessage:
      "Analysis is in progress. Results will update automatically when complete.",
    intermediateResultsHeading: "Intermediate Results",
    summaryTitle: "Summary",
    cancelModalTitle: "Cancel Analysis",
    cancelConfirmMessage:
      "Are you sure you want to cancel this analysis? This action cannot be undone.",
    cancellingLabel: "Cancelling...",
    cancelAnalysisButton: "Cancel Analysis",
    rerunningLabel: "Rerunning...",
    rerunButton: "Rerun",
    noVulnerabilitiesHeading: "No Vulnerabilities Found",
    noVulnerabilitiesMessage:
      "No vulnerabilities were found in the executed scans.",
    scanNotRunHeading: "Scans Were Not Executed",
    scanNotRunMessage:
      "All scan steps were skipped or failed. Check the status above.",
    failedHeading: "Analysis Failed",
    failedMessage: "Please try again later.",
    stepStatusFailed: "Failed",
    stepStatusSkipped: "Skipped",
    exploitTitle: "Penetration Test",
    exploitSessionLoadError: "Unable to load exploit session",
    exploitStatusLabels: {
      pending: "Pending",
      running: "Running",
      success: "Success",
      failed: "Failed",
      stopped: "Stopped",
      error: "Error",
    },
    exploitProgressLabel: "vulnerabilities verified",
    exploitResultLabels: {
      success: "Exploited",
      failed: "Failed",
      waiting: "Pending",
    },
    vulnerabilityDetailTitle: "Vulnerability Detail",
    findingLabels: {
      rule: "Rule: ",
      file: "File: ",
      url: "URL: ",
      cwe: "CWE: ",
      reference: "Reference: ",
      description: "Description",
    },
    fixButtonCodeFix: "View Code Fix Suggestion",
    fixButtonAISuggestion: "Get AI Fix Suggestion",
    fixLoadingCodeAnalysis: "Analyzing source code and generating fix...",
    fixLoadingAISuggestion: "Generating AI fix suggestion...",
    fixSectionExplanation: "Explanation",
    fixSectionSuggestion: "Suggestion",
    fixSectionExampleCode: "Example Code",
    fixCodeFixFailed: "Failed to get code fix suggestion",
    fixAISuggestionFailed: "Failed to get AI fix suggestion",
    noFindingsInTable: "No vulnerabilities found.",
    severityFilterAll: "All Severities",
    severityColumnLabel: "Severity",
    tableColumns: {
      file: "File",
      line: "Line",
      rule: "Rule",
      url: "URL",
      template: "Template",
      description: "Description",
    },
    countSuffix: "",
    askAIButton: "Ask AI",
    aiChatHeading: "AI Chat",
    chatLabels: {
      user: "Question",
      assistant: "AI Response",
    },
    aiChatGenerating: "Generating response...",
    chatInputPlaceholder: "Ask about this vulnerability...",
    sendButton: "Send",
    presetQuestions: {
      impactAnalysis: "Analyze the impact of this vulnerability",
      attackScenario: "Explain possible attack scenarios",
      fixSuggestion: "Suggest improvement code",
    },
    errorGeneric: "An error occurred",
    networkError: "A network error occurred.",
    retry: "Retry",
    sastResultsTitle: "SAST Results (Static Analysis)",
    dastResultsTitle: "DAST Results (Penetration Test)",
    sastStepLabel: "SAST Static Analysis",
    dastStepLabel: "DAST Penetration Test",
    sastSummaryTitle: "SAST Analysis Summary",
    dastSummaryTitle: "DAST Analysis Summary",
  },
  project: {
    startAnalysisButton: "Start Analysis",
    checkingLabel: "Checking...",
    startingLabel: "Starting...",
    subscriptionCheckError: "Unable to check subscription info",
    startError: "An error occurred while starting analysis",
    cannotStartError: "Unable to start analysis",
    form: {
      nameLabel: "Project Name",
      namePlaceholder: "Enter project name",
      descriptionLabel: "Description",
      descriptionPlaceholder: "Enter a brief description of the project",
      repositoryLabel: "Connect Repository",
      manualUploadLabel: "Manual Upload",
      addedRepositoriesLabel: "Added Repositories",
      setPrimaryButton: "Set as Primary",
      addRepositoryButton: "Add Repository",
      searchRepositoriesButton: "Search and Select Repositories",
      sourceCodeLabel: "Source Code (ZIP)",
      dropZoneLabel: "Drag and drop a ZIP file or click to upload",
      maxFileSize: "Max 100MB",
      repositoryNameLabel: "Repository Name",
      repositoryNamePlaceholder: "e.g., my-frontend-app",
      defaultBranchLabel: "Default Branch",
      processTitle: "Analysis Process",
      processSteps: {
        clone: "Clone repository and search code",
        sast: "Static code analysis (SAST)",
        sandbox: "Build and run sandbox container",
        pentest: "Run penetration test",
        report: "Generate vulnerability report",
      },
      submitCreating: "Creating...",
      submitCreate: "Create Project",
      validation: {
        nameRequired: "Please enter a project name",
        repoNameRequired: "Please enter a repository name",
        zipRequired: "Please upload a ZIP file",
        repoRequired: "Please select a repository",
        zipOnly: "Only ZIP files can be uploaded",
        fileTooLarge: "File size must be 100MB or less",
        fileEmpty: "Empty files cannot be uploaded",
      },
      repositoryAlreadyAdded: "This repository has already been added",
      createFailed: "Failed to create project",
      uploadProgress: "Uploading file...",
      uploadFailed: "File upload failed",
      createError: "An error occurred while creating the project",
    },
    list: {
      loadFailed: "Failed to load project list",
      loadError: "An error occurred while loading the project list",
      emptyHeading: "No Projects",
      emptyMessage:
        "Create your first project to analyze vulnerabilities in your GitHub/GitLab repositories",
      createFirstProjectButton: "Create First Project",
      multipleReposBadge: "repositories",
      manualUploadLabel: "Manual Upload",
      analysisCountLabel: "analyses",
      paginationLabel: "Page",
      previousButton: "Previous",
      nextButton: "Next",
    },
    detail: {
      statusLabels: {
        PENDING: "Pending",
        CLONING: "Cloning",
        STATIC_ANALYSIS: "Static Analysis",
        BUILDING: "Building",
        PENETRATION_TEST: "Pen Testing",
        COMPLETED: "Completed",
        COMPLETED_WITH_ERRORS: "Partial",
        FAILED: "Failed",
        CANCELLED: "Cancelled",
      },
      deleteButton: "Delete",
      deleteModalTitle: "Delete Project",
      deleteConfirmMessage:
        'Are you sure you want to delete the project "{name}"? All analysis results will also be deleted.',
      deletingLabel: "Deleting...",
      repositoryInfoTitle: "Repository Info",
      manualUploadLabel: "Manual Upload",
      manualUploadMessage: "Code files were uploaded directly for analysis",
      openRepositoryButton: "Open Repository",
      totalAnalyses: "Total Analyses",
      vulnerabilitiesFound: "Vulnerabilities Found",
      analysisSuffix: "",
      vulnerabilitySuffix: "",
      createdDateLabel: "Created",
      processPipelineTitle: "Analysis Process",
      recentAnalysesTitle: "Recent Analyses",
      noAnalysesHeading: "No Analysis History",
      noAnalysesMessage: "Start an analysis to find vulnerabilities",
      startFirstAnalysisButton: "Start First Analysis",
      viewDetailsButton: "View Details",
    },
    statusLabels: {
      active: "Active",
      archived: "Archived",
    },
    resourceUsage: {
      title: "Resource Usage",
      limitReachedMessage: "Limit reached. A plan upgrade is required.",
    },
  },
  dashboard: {
    statsLabels: {
      totalProjects: "Total Projects",
      completedAnalyses: "Completed Analyses",
      vulnerabilitiesFound: "Vulnerabilities Found",
      criticalVulnerabilities: "Critical Vulnerabilities",
    },
    quickStartTitle: "Quick Start",
    quickActions: {
      createProject: "Create New Project",
      createProjectDescription: "Analyze your code or containers",
      viewProjects: "View Projects",
      viewProjectsDescription: "Check all your projects",
      upgradePlan: "Upgrade Plan",
      upgradePlanDescription: "Access more features",
    },
    recentActivityTitle: "Recent Activity",
    noActivityHeading: "No activity yet",
    noActivityMessage:
      "Activity will appear here once you create projects and start analyses",
    activity: {
      completed: "Analysis completed",
      failed: "Analysis failed",
      inProgress: "Analysis in progress",
    },
  },
  subscription: {
    popularBadge: "Popular",
    currentPlanBadge: "Current Plan",
    freePlanButton: "Free Plan",
    lowerThanCurrentButton: "Lower than current plan",
    contactSalesButton: "Contact Sales",
    modal: {
      projectLimitTitle: "Project Limit Exceeded",
      analysisLimitTitle: "Analysis Limit Exceeded",
      projectLimitDescription:
        "You've reached the project creation limit on the Free plan.",
      analysisLimitDescription: "You've reached the monthly analysis limit.",
      projectLimitText: "Current {current} / Max {limit}",
      analysisLimitText: "This month {current} / Max {limit}",
      usageLabel: "Current Usage",
      upgradeFeatureTitle: "Upgrade to Pro plan for:",
      features: {
        unlimitedProjects: "Unlimited project creation",
        monthlyAnalyses: "100 analyses per month",
        storage: "10GB storage",
        prioritySupport: "Priority support and advanced reports",
      },
      upgradeButton: "Upgrade Plan",
      laterButton: "Later",
    },
    checkout: {
      paymentFailed: "Payment processing failed",
      upgradeSuccess: "Upgraded to {planName} plan!",
      errorProcessing: "Error processing payment: {error}",
      verificationFailed: "Payment verification failed",
      preparationFailed: "Payment preparation failed",
      cancelled: "Payment was cancelled",
      processingError: "An error occurred while processing payment",
      processingLabel: "Processing...",
      subscribeButton: "Subscribe to {planName}",
    },
  },
};

export default en;
export type Dictionary = typeof en;
