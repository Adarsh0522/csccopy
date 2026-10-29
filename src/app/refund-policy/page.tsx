import LegalLayout from '@/components/legal/LegalLayout'

export const metadata = {
  title: 'Refund & Cancellation Policy | CSCCopy - Aryan Enterprises',
  description: 'Refund, return, and cancellation terms for digital wallet recharge and services on CSCCopy.',
}

export default function RefundPolicyPage() {
  return (
    <LegalLayout
      title="Cancellation & Refund Policy"
      subtitle="Clear and transparent guidelines on wallet top-ups, transaction disputes, and refund processing."
      activeSlug="refund-policy"
    >
      <div className="space-y-6 text-slate-700">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">1. Overview</h2>
          <p>
            This Cancellation and Refund Policy applies to all payments made to <strong>Aryan Enterprises</strong> for services and digital wallet recharges on <strong>CSCCopy</strong> (<span className="font-semibold text-slate-900">https://csccopy.online</span>).
          </p>
          <p>
            We strive to provide seamless software tools and fast digital utility processing for all CSC operators and users. Please review our refund guidelines detailed below.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">2. Wallet Recharge & Payment Failures</h2>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs sm:text-sm">
            <p className="font-semibold text-slate-900">What happens if money is debited from your bank/UPI but wallet is not credited?</p>
            <p>
              In rare instances of banking server delays or network dropouts, your bank account or UPI application may be debited without an immediate wallet update:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Automatic Reconciliation:</strong> Most failed banking attempts are automatically resolved by the payment gateway within 24 to 48 hours, either crediting your wallet or reversing to your source account.</li>
              <li><strong>Manual Support:</strong> If your balance does not update within 2 hours, please message our support team on WhatsApp at <strong>+91 8169431433</strong> or email <strong>ranjit@csccopy.online</strong> along with your registered mobile number and Banking Reference Number (UTR / Transaction ID). Our team will verify and credit your wallet promptly.</li>
            </ul>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">3. Digital Services & Form Generation Cancellation</h2>
          <p>
            CSCCopy provides digital, instantly delivered software utilities:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Digital Fulfillment:</strong> Services such as PAN 49A/CSF PDF Generation and PVC card layout generation produce downloadable PDF files on your screen instantly.</li>
            <li><strong>Non-Cancellable Once Generated:</strong> Once a digital document has been generated and downloaded, the transaction is considered completed and cannot be cancelled or returned.</li>
            <li><strong>System Glitch Protection:</strong> If a technical bug or system error deducts money from your wallet without successfully delivering the requested document or service, the deducted fee will be immediately refunded back to your internal CSCCopy wallet upon notification to support.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">4. Refund Processing Timeframe</h2>
          <p>
            Where a direct bank refund is approved (e.g., duplicate payment charge, erroneous double billing):
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Processing Timeline:</strong> Approved refunds will be initiated within <strong>24 to 48 business hours</strong>.</li>
            <li><strong>Crediting Timeline:</strong> Depending on your issuing bank, UPI app, or card provider, the amount will be credited back to your original source payment method within <strong>5 to 7 working days</strong>.</li>
            <li><strong>Mode of Refund:</strong> All refunds are processed strictly back to the original payment source used during the transaction. No cash refunds are provided.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">5. How to Request a Refund or Support</h2>
          <p>
            To initiate an inquiry or refund request, please provide:
          </p>
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>Your Registered Mobile Number / Email.</li>
            <li>Payment Gateway Order ID / Banking UTR Number.</li>
            <li>Date and Amount of Transaction.</li>
            <li>Brief description or screenshot of the issue.</li>
          </ol>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs sm:text-sm space-y-1 mt-4">
            <p className="font-bold text-emerald-900">Official Help & Refund Desk:</p>
            <p><strong>Support Email:</strong> <a href="mailto:ranjit@csccopy.online" className="text-emerald-700 underline font-semibold">ranjit@csccopy.online</a></p>
            <p><strong>WhatsApp Support:</strong> <a href="https://wa.me/918169431433" className="text-emerald-700 underline font-semibold">+91 8169431433</a></p>
            <p><strong>Office Address:</strong> Aryan enterprises, Suresh Nagar, near Railway station middle bridge, Diva east, Thane, Maharashtra - 400612, India</p>
          </div>
        </section>
      </div>
    </LegalLayout>
  )
}

