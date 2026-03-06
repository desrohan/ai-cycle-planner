import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mb-6">
        <AlertCircle className="h-7 w-7 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground">Authentication error</h1>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        Something went wrong during authentication. Please try again or contact support if the issue persists.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link href="/auth/login">Try again</Link>
        </Button>
      </div>
    </div>
  )
}
