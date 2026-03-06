import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Heart, Mail } from 'lucide-react'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 mb-6">
        <Mail className="h-7 w-7 text-primary" />
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
          <Heart className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-foreground">FlowSync</span>
      </div>
      <h1 className="text-2xl font-bold text-foreground">Check your inbox</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        We&apos;ve sent you a confirmation email. Click the link inside to activate your account and start syncing with your cycle.
      </p>
      <Button asChild className="mt-8 bg-primary text-primary-foreground hover:bg-primary/90">
        <Link href="/auth/login">Back to sign in</Link>
      </Button>
    </div>
  )
}
