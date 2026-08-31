import { Navbar } from '@/app/dashboard/Navbar'

export default function FreeToolsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      <Navbar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
