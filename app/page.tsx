import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sparkles,
  CalendarDays,
  Brain,
  TrendingUp,
  Moon,
  Sun,
  Zap,
  Heart,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">FlowSync</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#phases" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Phases
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-sm">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm">
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-24 text-center">
        <Badge className="mb-6 bg-accent text-accent-foreground border-border">
          <Sparkles className="mr-1.5 h-3 w-3" />
          AI-powered cycle tracking
        </Badge>
        <h1 className="text-balance text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
          Plan with your{' '}
          <span className="text-primary">body&apos;s rhythm</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
          FlowSync understands your menstrual cycle and uses AI to schedule tasks that match your energy levels — so you work smarter, rest better, and feel more in control.
        </p>
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90 px-8">
            <Link href="/auth/sign-up">
              Start for free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/login">Sign in to your account</Link>
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          {['No credit card required', 'Free to use', 'Secure & private'].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {item}
            </span>
          ))}
        </div>
      </section>

      {/* Phase Cards */}
      <section id="phases" className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
              Your cycle, your superpower
            </h2>
            <p className="mt-3 text-muted-foreground">
              Each phase brings unique strengths. FlowSync helps you use them.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {phases.map((p) => (
              <Card key={p.phase} className="border-border overflow-hidden">
                <div className="h-1.5 w-full" style={{ backgroundColor: p.color }} />
                <CardContent className="p-5">
                  <div
                    className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: p.color + '22' }}
                  >
                    <p.icon className="h-4 w-4" style={{ color: p.color }} />
                  </div>
                  <h3 className="font-semibold text-foreground">{p.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{p.description}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ backgroundColor: p.color + '18', color: p.color }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
              Everything you need to flow
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built for women who want to work with their biology, not against it.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="border-border">
                <CardContent className="p-6">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-4xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
              Get started in minutes
            </h2>
          </div>
          <div className="relative space-y-8">
            {steps.map((step, i) => (
              <div key={step.title} className="flex gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="mt-2 h-full w-px bg-border" />
                  )}
                </div>
                <div className="pb-8">
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="text-balance text-3xl font-bold text-foreground md:text-4xl">
            Ready to sync with your flow?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Join women who have discovered the power of cycle-aware planning.
          </p>
          <Button size="lg" asChild className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90 px-10">
            <Link href="/auth/sign-up">
              Create your free account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
              <Heart className="h-3 w-3 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">FlowSync</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built to help you thrive every day of your cycle.
          </p>
        </div>
      </footer>
    </div>
  )
}

const phases = [
  {
    phase: 'menstrual',
    label: 'Menstrual',
    color: '#e11d48',
    icon: Moon,
    description: 'Days 1–5. Rest, reflect, and restore your energy.',
    tags: ['Rest', 'Introspection', 'Gentle movement'],
  },
  {
    phase: 'follicular',
    label: 'Follicular',
    color: '#d97706',
    icon: Sun,
    description: 'Days 6–13. Energy rises — perfect for new beginnings.',
    tags: ['Creative', 'Learning', 'Planning'],
  },
  {
    phase: 'ovulation',
    label: 'Ovulation',
    color: '#16a34a',
    icon: Zap,
    description: 'Days 14–16. Peak energy and communication.',
    tags: ['Peak energy', 'Social', 'Leadership'],
  },
  {
    phase: 'luteal',
    label: 'Luteal',
    color: '#7c3aed',
    icon: TrendingUp,
    description: 'Days 17–28. Focus and finish what you started.',
    tags: ['Detail work', 'Completion', 'Self-care'],
  },
]

const features = [
  {
    icon: CalendarDays,
    title: 'Cycle-aware scheduling',
    description: 'Tasks are automatically matched to your current phase, so high-energy work lands on peak days.',
  },
  {
    icon: Brain,
    title: 'AI task generation',
    description: 'Describe your goals and our AI builds a personalized task plan aligned to your cycle.',
  },
  {
    icon: Sparkles,
    title: 'Smart AI assistant',
    description: 'Chat with your AI coach for advice on tasks, workouts, and self-care based on your phase.',
  },
  {
    icon: TrendingUp,
    title: 'Progress tracking',
    description: 'See your completion rates and how your productivity shifts across cycle phases.',
  },
  {
    icon: Heart,
    title: 'Symptom logging',
    description: 'Track energy, flow, and symptoms daily to build a picture of your personal cycle patterns.',
  },
  {
    icon: Moon,
    title: 'Phase guidance',
    description: 'Detailed insights for each phase with tips on nutrition, exercise, and work style.',
  },
]

const steps = [
  {
    title: 'Create your account',
    description: 'Sign up in seconds — no credit card needed.',
  },
  {
    title: 'Set up your cycle',
    description: 'Tell us your last period date, cycle length, and lifestyle preferences.',
  },
  {
    title: 'Get your AI task plan',
    description: 'Our AI generates cycle-aware tasks tailored to your goals and energy levels.',
  },
  {
    title: 'Track and adjust',
    description: 'Log daily data, chat with your AI assistant, and refine your plan as you go.',
  },
]
