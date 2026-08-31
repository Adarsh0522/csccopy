import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { FileText, FileEdit } from 'lucide-react'

export const metadata = {
  title: "PAN Services | CSCCopy",
};

export default function PanServicesPage() {
  const tools = [
    {
      title: 'Generate New PAN Form',
      description: 'Fill details and securely generate a professional new PAN application PDF.',
      icon: <FileText className="w-8 h-8 text-white" />,
      href: '/dashboard/pan-services/new-pan',
      gradient: 'from-blue-500 to-cyan-400',
      shadow: 'hover:shadow-blue-500/20',
      hoverText: 'group-hover:text-blue-600'
    },
    {
      title: 'Generate PAN Correction Form',
      description: 'Generate PAN Correction/Update forms with proper annexures and mappings.',
      icon: <FileEdit className="w-8 h-8 text-white" />,
      href: '/dashboard/pan-services/pan-correction',
      gradient: 'from-emerald-500 to-teal-400',
      shadow: 'hover:shadow-emerald-500/20',
      hoverText: 'group-hover:text-emerald-600'
    }
  ]

  return (
    <div className="w-full flex-1 p-6 md:p-8 bg-slate-50 min-h-[calc(100vh-73px)]">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">PAN Services</h1>
          <p className="text-slate-500 mt-2">
            Select a service below to generate professional PAN application forms locally.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tools.map((tool, index) => (
            <Link key={tool.title} href={tool.href} className="group block">
              <Card className={`h-full border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${tool.shadow} rounded-2xl overflow-hidden relative`}>
                {/* Subtle top gradient line */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${tool.gradient} opacity-70 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <CardHeader className="pt-8 pb-4">
                  <div className="flex items-center space-x-5">
                    <div className={`p-4 rounded-2xl bg-gradient-to-br ${tool.gradient} shadow-md transform transition-all group-hover:scale-105 duration-300`}>
                      {tool.icon}
                    </div>
                    <div>
                      <CardTitle className={`text-xl font-bold tracking-tight text-slate-900 transition-colors duration-300 ${tool.hoverText}`}>
                        {tool.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-slate-600 leading-relaxed font-medium">
                    {tool.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
