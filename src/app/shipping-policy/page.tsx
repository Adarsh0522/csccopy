import LegalLayout from '@/components/legal/LegalLayout'

export const metadata = {
  title: 'Shipping & Delivery Policy | CSCCopy - Aryan Enterprises',
  description: 'Digital service fulfillment and electronic delivery policy of CSCCopy.',
}

export default function ShippingPolicyPage() {
  return (
    <LegalLayout
      title="Shipping & Delivery Policy"
      subtitle="Information regarding electronic delivery, digital fulfillment timelines, and service access."
      activeSlug="shipping-policy"
    >
      <div className="space-y-6 text-slate-700">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">1. Nature of Services (Digital Delivery)</h2>
          <p>
            <strong>CSCCopy</strong>, operated by <strong>Aryan Enterprises</strong>, is a Software-as-a-Service (SaaS) and digital utility portal designed for document processing, photo cropping, PDF formatting, and form generation.
          </p>
          <p className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs sm:text-sm font-medium">
            <strong>Important:</strong> CSCCopy provides 100% digital goods and online software utilities. We do NOT ship physical goods, paper documents, or plastic cards via courier or postal services by default unless explicitly specified under a custom physical card order.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">2. Delivery Method & Timelines</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Wallet Recharges:</strong> Delivered digitally and credited to your registered account balance immediately upon successful payment confirmation from our banking partner / payment gateway.
            </li>
            <li>
              <strong>Form Generators & PDF Utilities (PAN Form, PVC Print Layout):</strong> Delivered instantly on your browser screen. Once you review and confirm the form, the PDF document is rendered and made available for instant download and printing.
            </li>
            <li>
              <strong>Custom Dynamic Service Applications:</strong> Dynamic applications submitted via the dashboard are processed by administrators within <strong>1 to 24 business hours</strong>. Status updates are reflected directly within your user dashboard under the Activity section.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">3. Shipping Fees & Delivery Charges</h2>
          <p>
            Since all standard services and utility tools on CSCCopy are delivered electronically via web interface and digital download, <strong>no shipping, courier, or delivery fees</strong> are levied on transactions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">4. Delivery Confirmation & Issues</h2>
          <p>
            Upon successful execution of a service or wallet top-up, you will receive an onscreen confirmation and ledger entry in your transaction history. If you experience any technical disruption during digital download:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Check your browser downloads folder or user activity log.</li>
            <li>Contact our customer support team immediately with your account details.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">5. Contact Support</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm space-y-1">
            <p><strong>Business Name:</strong> Aryan Enterprises</p>
            <p><strong>Registered Address:</strong> Suresh Nagar, near Railway station middle bridge, Diva east, Thane, Maharashtra - 400612, India</p>
            <p><strong>Support Email:</strong> <a href="mailto:ranjit@csccopy.online" className="text-emerald-600 font-semibold">ranjit@csccopy.online</a></p>
            <p><strong>WhatsApp Support:</strong> <a href="https://wa.me/918169431433" className="text-emerald-600 font-semibold">+91 8169431433</a></p>
          </div>
        </section>
      </div>
    </LegalLayout>
  )
}

