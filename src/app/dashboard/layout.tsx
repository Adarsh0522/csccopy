import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="h-screen w-screen bg-gray-50 flex overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50 border-l border-gray-200 relative overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-auto relative p-6 lg:p-10">
            {children}
          </main>
        </div>
      </div>
    </>
  )
}
