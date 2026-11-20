import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'
import { SearchProvider } from './SearchContext'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SearchProvider>
      <div 
        className="h-screen w-screen flex overflow-hidden text-white"
        style={{ background: 'linear-gradient(135deg, #0d0b21 0%, #161338 50%, #1e1b4b 100%)' }}
      >
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 relative overflow-hidden bg-transparent">
          <Navbar />
          <main className="flex-1 overflow-auto relative p-6 lg:p-8 bg-transparent">
            {children}
          </main>
        </div>
      </div>
    </SearchProvider>
  )
}
