import Link from 'next/link'
import { signUp } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Heart, AlertCircle, CheckCircle2 } from 'lucide-react'

interface SignUpPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-primary p-12">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
            <Heart className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-primary-foreground">FlowSync</span>
        </div>
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-primary-foreground">
            Plan smarter with every phase of your cycle
          </h2>
          <ul className="space-y-3">
            {[
              'AI-generated tasks matched to your energy',
              'Cycle tracking with symptom logging',
              'Personalized phase-based guidance',
              'Chat with your AI wellness assistant',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-primary-foreground/80">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-foreground/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-primary-foreground/50">Free to use. Always secure. No credit card needed.</p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
              <Heart className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">FlowSync</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start syncing with your cycle today</p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form action={signUp} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a strong password"
                required
                autoComplete="new-password"
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
