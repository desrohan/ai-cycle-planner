'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  CheckSquare,
  Activity,
  Layers,
  LogOut,
  Heart,
  MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/cycle', label: 'Cycle', icon: Activity },
  { href: '/phase', label: 'My Phase', icon: Layers },
]

export function AppNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Heart className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">FlowSync</span>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  pathname === href || pathname.startsWith(href + '/')
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background lg:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                pathname === href
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
          <form action={signOut}>
            <button
              type="submit"
              className="flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </form>
        </div>
      </nav>
    </>
  )
}

export function AIChatButton() {
  return (
    <Button
      asChild
      size="icon"
      className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 lg:bottom-6"
    >
      <Link href="/dashboard?chat=open">
        <MessageCircle className="h-5 w-5" />
        <span className="sr-only">Open AI assistant</span>
      </Link>
    </Button>
  )
}
