import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppNav, AIChatButton } from '@/components/layout/app-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  // Check if onboarding is complete
  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_complete) {
    redirect('/onboarding')
  }

  return (
    <div className="min-h-screen bg-background">
      <AppNav />
      <main className="lg:pl-60">
        <div className="pb-20 lg:pb-6">{children}</div>
      </main>
      <AIChatButton />
    </div>
  )
}
