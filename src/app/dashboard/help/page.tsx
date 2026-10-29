import Link from 'next/link'
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageSquare, 
  FileText, 
  ShieldCheck, 
  RefreshCcw, 
  Truck, 
  ExternalLink, 
  HelpCircle,
  Building2,
  ChevronRight,
  Headphones,
  CheckCircle2
} from 'lucide-react'

export const metadata = {
  title: 'Help & Customer Support | CSCCopy',
  description: 'Official Help and Support Center for CSCCopy users, operated by Aryan Enterprises.',
}

export default function DashboardHelpPage() {
  const legalDocs = [
    {
      title: 'Privacy Policy',
      desc: 'How we collect, protect, and safely handle user information and uploaded documents.',
      href: '/privacy-policy',
      icon: ShieldCheck,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Terms & Conditions',
      desc: 'User agreement, prepaid wallet guidelines, and service usage terms.',
      href: '/terms-and-conditions',
      icon: FileText,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      title: 'Cancellation & Refund Policy',
      desc: 'Guidelines for failed wallet top-ups, reversals, and 5-7 business days bank refund timelines.',
      href: '/refund-policy',
      icon: RefreshCcw,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'Digital Delivery & Shipping Policy',
      desc: 'Electronic delivery terms and instant digital document download turnaround.',
      href: '/shipping-policy',
      icon: Truck,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
  ]

  const faqs = [
    {
      q: 'What should I do if wallet funds were deducted but the PDF form or service was not generated?',
      a: 'In case of an unexpected technical interruption, deducted service fees are automatically refunded to your internal wallet balance. You can also message our WhatsApp support desk at +91 8169431433 with your transaction ID for prompt assistance.',
    },
    {
      q: 'What if money was debited from my bank account/UPI but my wallet was not credited?',
      a: 'Due to occasional banking gateway delays, confirmation might take a little time. Most transactions reconcile automatically within 24 to 48 hours, either crediting your wallet or reversing back to your original source account within 5 to 7 business days. Please WhatsApp us your bank UTR / Reference ID for immediate manual verification.',
    },
    {
      q: 'How are service charges deducted for PAN Form Generator and PVC Print?',
      a: 'The configured nominal fee (e.g. ₹10) is deducted directly from your prepaid wallet balance only upon generating the final printable document or submitting your application. Free smart utility tools (Photo Crop, Compressor, Background Removal) are completely free with zero wallet deduction.',
    },
    {
      q: 'What are your registered office address and operating hours?',
      a: 'Our registered office is located at "Aryan Enterprises, Suresh Nagar, near Railway station middle bridge, Diva east, Thane, Maharashtra - 400612, India". Our official support hours are Monday to Saturday, 9:00 AM to 8:00 PM IST (WhatsApp queries monitored on Sundays).',
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Top Banner / Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-emerald-100 text-xs font-semibold mb-3 border border-white/20">
            <Headphones className="w-3.5 h-3.5" />
            <span>Dedicated VLE & Operator Support</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Help & Customer Support
          </h1>
          <p className="text-emerald-100 text-sm sm:text-base mt-2 leading-relaxed">
            We are here to assist you with wallet recharges, payment inquiries, and technical support. Connect with our dedicated support desk using the channels below.
          </p>
        </div>
      </div>

      {/* Primary Contact Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* WhatsApp Card */}
        <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg">WhatsApp Support</h3>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Fastest</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Direct chat assistance for instant wallet recharges and tool queries.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">WhatsApp Number</p>
              <p className="text-base font-extrabold text-slate-900">+91 8169431433</p>
            </div>
          </div>

          <a
            href="https://wa.me/918169431433?text=Hello%20CSCCopy%20Support,%20I%20need%20assistance"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Chat on WhatsApp
          </a>
        </div>

        {/* Email Support Card */}
        <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm mb-4">
              <Mail className="w-6 h-6" />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg">Email Desk</h3>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Official</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Official email support for billing, account disputes, and inquiries.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs text-slate-400 font-medium">Support Email</p>
              <p className="text-sm sm:text-base font-extrabold text-slate-900 break-all">ranjit@csccopy.online</p>
            </div>
          </div>

          <a
            href="mailto:ranjit@csccopy.online"
            className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-sm transition-colors"
          >
            <Mail className="w-4 h-4" />
            Send Email
          </a>
        </div>

        {/* Office & Operating Hours Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-sm mb-4">
              <MapPin className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Registered Office</h3>
            <p className="text-xs text-emerald-700 font-bold mt-0.5">Aryan Enterprises</p>
            
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              Suresh Nagar, near Railway station middle bridge, Diva east, Thane, Maharashtra - 400612, India.
            </p>

            <div className="mt-3 flex items-start gap-2 text-xs text-slate-500">
              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-700">Mon – Sat: 9:00 AM – 8:00 PM IST</p>
                <p className="text-[11px] text-slate-400">Sunday: WhatsApp Support Only</p>
              </div>
            </div>
          </div>

          <a
            href="https://maps.google.com/?q=Diva+Railway+Station+East+Thane"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors"
          >
            <MapPin className="w-4 h-4 text-slate-600" />
            View Location
          </a>
        </div>

      </div>

      {/* Payment Gateway & Legal Compliance Documents */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Legal Policies & Compliance
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Official legal policies and terms required under Indian payment gateway compliance regulations.
            </p>
          </div>
          <Link
            href="/contact"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 self-start sm:self-auto"
          >
            Public Contact Page <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {legalDocs.map((doc) => {
            const Icon = doc.icon
            return (
              <Link
                key={doc.title}
                href={doc.href}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-3 ${doc.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {doc.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                  <span>View Document</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
          <HelpCircle className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {faqs.map((faq, index) => (
            <div key={index} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <h4 className="font-bold text-slate-900 text-sm leading-snug">
                  {faq.q}
                </h4>
              </div>
              <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
