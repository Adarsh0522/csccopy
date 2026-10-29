import LegalLayout from '@/components/legal/LegalLayout'
import { Phone, Mail, MapPin, Clock, MessageSquare, Building2, Send } from 'lucide-react'

export const metadata = {
  title: 'Contact Us | CSCCopy - Aryan Enterprises',
  description: 'Get in touch with Aryan Enterprises for CSCCopy customer support, billing inquiries, or technical assistance.',
}

export default function ContactPage() {
  return (
    <LegalLayout
      title="Contact Us"
      subtitle="We are here to help you. Reach out to Aryan Enterprises for any support, billing, or technical queries."
      activeSlug="contact"
    >
      <div className="space-y-8 text-slate-700">
        
        {/* Contact Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* WhatsApp / Phone Card */}
          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">WhatsApp & Phone Support</h3>
              <p className="text-xs text-slate-500 mt-0.5">Quick support for wallet top-up & service queries</p>
              <div className="mt-2.5 space-y-1">
                <a
                  href="https://wa.me/918169431433?text=Hello%20CSCCopy%20Support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800 underline"
                >
                  <MessageSquare className="w-4 h-4" />
                  +91 8169431433 (Chat on WhatsApp)
                </a>
              </div>
            </div>
          </div>

          {/* Email Support Card */}
          <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Mail className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Official Email Support</h3>
              <p className="text-xs text-slate-500 mt-0.5">Billing, grievance, or business inquiries</p>
              <div className="mt-2.5">
                <a
                  href="mailto:ranjit@csccopy.online"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-700 hover:text-blue-800 underline"
                >
                  <Mail className="w-4 h-4" />
                  ranjit@csccopy.online
                </a>
              </div>
            </div>
          </div>

          {/* Registered Office Address */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Registered Office Address</h3>
              <p className="text-xs text-slate-600 font-semibold mt-1">Aryan Enterprises</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Suresh Nagar, near Railway station middle bridge,<br />
                Diva east, Thane, Maharashtra - 400612, India.
              </p>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Working Hours</h3>
              <p className="text-xs text-slate-500 mt-0.5">Support availability</p>
              <div className="mt-1 text-xs text-slate-700 space-y-0.5">
                <p><strong>Monday – Saturday:</strong> 9:00 AM to 8:00 PM IST</p>
                <p><strong>Sunday:</strong> Urgent queries via WhatsApp</p>
              </div>
            </div>
          </div>

        </div>

        {/* Business Information Box */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-2">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>Merchant & Company Profile</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
            <p><strong>Legal Entity Name:</strong> Aryan Enterprises</p>
            <p><strong>Brand / Platform:</strong> CSCCopy</p>
            <p><strong>Official Website:</strong> https://csccopy.online</p>
            <p><strong>Authorized Contact:</strong> Ranjit</p>
          </div>
        </div>

      </div>
    </LegalLayout>
  )
}

