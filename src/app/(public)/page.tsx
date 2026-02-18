import Link from "next/link";

/* ─── Pipeline Step Data ─── */
const PIPELINE_STEPS = [
  {
    label: "Connect",
    icon: GitBranchIcon,
    description: "Link your GitHub or GitLab repo in one click",
  },
  {
    label: "SAST",
    icon: CodeIcon,
    description: "Static analysis catches vulnerabilities in source code",
  },
  {
    label: "DAST",
    icon: GlobeIcon,
    description: "Dynamic testing probes your running application",
  },
  {
    label: "AI Fix",
    icon: SparklesIcon,
    description: "Get auto-generated patches with full diff preview",
  },
  {
    label: "Report",
    icon: FileTextIcon,
    description: "Executive summary and detailed findings, ready to share",
  },
];

/* ─── Feature Data ─── */
const FEATURES = [
  {
    icon: ShieldCheckIcon,
    title: "SAST + DAST in One Pipeline",
    description:
      "No more juggling separate tools. Run static and dynamic analysis together and get a unified vulnerability report.",
  },
  {
    icon: SparklesIcon,
    title: "AI-Powered Fix Suggestions",
    description:
      "Don't just find vulnerabilities — fix them. Our AI generates ready-to-apply patches with full code diffs.",
  },
  {
    icon: TargetIcon,
    title: "Automated Penetration Testing",
    description:
      "Simulate real-world attacks in a sandboxed environment. Validate exploitability before attackers do.",
  },
  {
    icon: ZapIcon,
    title: "One-Click Setup",
    description:
      "Connect your repository, pick a branch, and start scanning. Zero configuration, instant results.",
  },
  {
    icon: BarChartIcon,
    title: "Executive Summaries",
    description:
      "AI-generated overviews that translate technical findings into business impact for stakeholders.",
  },
  {
    icon: LockIcon,
    title: "Sandbox Isolation",
    description:
      "Every analysis runs in an isolated container. Your code never leaves a secure, ephemeral environment.",
  },
];

/* ─── Page Component ─── */
export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="aurora-bg relative overflow-hidden py-32 md:py-44">
        <div className="container relative z-10 mx-auto px-4 text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Now in Public Beta
          </div>

          {/* Headline */}
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Ship fast. <span className="gradient-text">Stay secure.</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Worried about vulnerabilities after every deploy? Killhouse runs
            SAST, DAST, and AI-powered penetration testing — then generates fix
            patches automatically.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start Free
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex h-12 items-center rounded-lg border border-border px-8 text-base font-medium transition-colors hover:bg-accent"
            >
              See How It Works
            </Link>
          </div>

          {/* Social proof line */}
          <p className="mt-8 text-sm text-muted-foreground">
            Free plan includes 3 projects &middot; No credit card required
          </p>
        </div>
      </section>

      {/* Pain Point → Solution Bridge */}
      <section className="border-t border-border/40 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Security tools shouldn&apos;t slow you down
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Complex setup. Fragmented results. No guidance on how to fix
              what&apos;s found. Sound familiar? We built Killhouse to eliminate
              every friction point between your code and a secure deployment.
            </p>
          </div>

          {/* Three pain-point cards */}
          <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-3 text-2xl">&#x1F6AB;</div>
              <h3 className="font-semibold">Complex configuration</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Most scanners need YAML pipelines, custom Docker images, and
                hours of tuning. We need one OAuth click.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-3 text-2xl">&#x1F4A4;</div>
              <h3 className="font-semibold">Findings without fixes</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                A list of CVEs is useless if your team doesn&apos;t know how to
                remediate them. We generate patches you can apply.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="mb-3 text-2xl">&#x1F50D;</div>
              <h3 className="font-semibold">Static-only coverage</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                SAST catches patterns, but real exploits need runtime context.
                We combine SAST + DAST + pen-testing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — Pipeline Visualization */}
      <section
        id="how-it-works"
        className="border-t border-border/40 bg-muted/30 py-24"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              From code to report in five steps
            </h2>
            <p className="mt-4 text-muted-foreground">
              Connect once, analyze continuously. Every push triggers a full
              security pipeline.
            </p>
          </div>

          {/* Pipeline steps */}
          <div className="mx-auto mt-16 flex max-w-5xl flex-col items-center gap-4 md:flex-row md:justify-between">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-center gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card">
                    <step.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="mt-3 text-sm font-medium">{step.label}</span>
                  <span className="mt-1 max-w-[140px] text-xs text-muted-foreground">
                    {step.description}
                  </span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="hidden h-px w-12 bg-gradient-to-r from-primary/60 to-primary/10 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-border/40 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to secure your code
            </h2>
            <p className="mt-4 text-muted-foreground">
              One platform replaces your entire security toolchain.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="feature-card rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="aurora-bg relative border-t border-border/40 py-24">
        <div className="container relative z-10 mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Ready to secure your next deploy?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Start with the free plan. Connect a repo and get your first
            vulnerability report in under a minute.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center rounded-lg bg-primary px-8 text-base font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Get Started — It&apos;s Free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center rounded-lg border border-border px-8 text-base font-medium transition-colors hover:bg-accent"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/* ─── Icon Components ─── */

function GitBranchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="6" y1="3" x2="6" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}
