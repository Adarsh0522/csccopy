import LegalLayout from '@/components/legal/LegalLayout'

export const metadata = {
  title: 'Terms & Conditions | CSCCopy - Aryan Enterprises',
  description: 'Terms and Conditions governing the use of CSCCopy web platform provided by Aryan Enterprises.',
}

export default function TermsAndConditionsPage() {
  return (
    <LegalLayout
      title="Terms and Conditions"
      subtitle="Legal agreement outlining your rights, obligations, and terms of service when using CSCCopy."
      activeSlug="terms-and-conditions"
    >
      <div className="space-y-6 text-slate-700">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
          <p>
            These Terms and Conditions (&quot;Terms&quot;) constitute a legally binding agreement between you (&quot;User&quot;, &quot;you&quot;) and <strong>Aryan Enterprises</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;), governing your access to and use of the <strong>CSCCopy</strong> web application accessible at <span className="font-semibold text-slate-900">https://csccopy.online</span>.
          </p>
          <p>
            By accessing our platform, registering an account, topping up your wallet, or utilizing any of our automated tools, you acknowledge that you have read, understood, and agreed to be bound by these Terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">2. Description of Services</h2>
          <p>
            CSCCopy is a digital SaaS utility and productivity suite engineered primarily for CSC VLEs, Cyber Cafe operators, and individual users across India. Our services include:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>PAN Application Form 49A and CSF Correction PDF Form Generator.</li>
            <li>PVC Card layout formatting tool (Aadhaar, Voter, PAN, Ayushman layout styling).</li>
            <li>Free and smart utility tools (Passport Photo Cropper, Background Removal, Image Compressor, PDF to Image, and Image to PDF converter).</li>
            <li>Dynamic custom service submission and tracking.</li>
          </ul>
          <p className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs sm:text-sm">
            <strong>Important Disclaimer:</strong> CSCCopy is an independent software tool provider. We are NOT affiliated with, authorized by, or endorsed by the Income Tax Department of India, NSDL/Protean, UTIITSL, UIDAI, or any government ministry. Our tools format documents based on public standards to assist operators in paperwork preparation.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">3. User Account & Authentication</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>You must register using a valid Indian mobile number and undergo OTP verification.</li>
            <li>You are solely responsible for maintaining the confidentiality of your session and devices.</li>
            <li>You agree to provide true, accurate, and complete information during registration.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">4. Wallet Balance, Pricing & Payment Terms</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Prepaid Wallet:</strong> All interactive paid tools and service submissions on CSCCopy operate via an internal prepaid wallet system.</li>
            <li><strong>Recharges:</strong> Users may recharge their wallet using authorized payment gateways via UPI, Net Banking, Debit/Credit Cards.</li>
            <li><strong>Deduction:</strong> Service fees (e.g., ₹10 for PAN Form Generation, PVC print formats, or dynamic service submissions) are deducted directly from your verified wallet balance upon generating or submitting the service.</li>
            <li><strong>Taxes:</strong> All listed prices are inclusive of applicable goods and services taxes unless explicitly mentioned otherwise.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">5. Prohibited Activities</h2>
          <p>You agree not to use CSCCopy to:</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Generate forged, deceptive, fraudulent, or counterfeit government identity documents.</li>
            <li>Infringe upon the intellectual property or privacy rights of any third party.</li>
            <li>Attempt to reverse-engineer, decompile, scrape, or breach the security of the platform.</li>
            <li>Use automated bots or scripts that overburden our servers.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">6. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable Indian law, Aryan Enterprises and its representatives shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from errors in operator input, rejected government applications, or downtime caused by internet connectivity or third-party server outages.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">7. Governing Law and Jurisdiction</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any dispute or claim arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Thane / Mumbai, Maharashtra</strong>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">8. Contact Information</h2>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm space-y-1">
            <p><strong>Entity:</strong> Aryan Enterprises (Trade Name: CSCCopy)</p>
            <p><strong>Address:</strong> Suresh Nagar, near Railway station middle bridge, Diva east, Thane, Maharashtra - 400612, India</p>
            <p><strong>Support Email:</strong> <a href="mailto:ranjit@csccopy.online" className="text-emerald-600 font-semibold">ranjit@csccopy.online</a></p>
            <p><strong>Support WhatsApp / Phone:</strong> <a href="https://wa.me/918169431433" className="text-emerald-600 font-semibold">+91 8169431433</a></p>
          </div>
        </section>
      </div>
    </LegalLayout>
  )
}

