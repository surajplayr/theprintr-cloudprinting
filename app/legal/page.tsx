import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function LegalPage() {
  return (
    <div className="w-full max-w-2xl mx-auto bg-[#FAFAFA] min-h-screen sm:min-h-0 sm:my-8 sm:rounded-3xl shadow-2xl p-6 sm:p-10 text-[#1B1716]">
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-sm font-bold text-[#8B0000] hover:underline mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Print
        </Link>
        <h1 className="text-3xl font-black tracking-tight mb-2">Legal Information</h1>
        <p className="text-sm opacity-70">Compliance and Policies for ThePrintr service.</p>
      </div>

      <div className="space-y-12">
        <section id="terms" className="scroll-mt-8">
          <h2 className="text-xl font-extrabold mb-4 border-b border-black/10 pb-2">1. Terms & Conditions</h2>
          <p className="text-sm mb-3"><strong>Effective Date:</strong> 22 September 2026</p>
          <p className="text-sm mb-3">Welcome to <strong>ThePrintr</strong>. By using our cloud printing service and physical kiosks, you agree to the following terms:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Service Usage:</strong> You agree to use the service only for lawful purposes. You are solely responsible for the content of the documents you upload for printing.</li>
            <li><strong>Prohibited Content:</strong> You must not upload or print any material that is illegal, copyrighted (without permission), offensive, or violates any third-party rights.</li>
            <li><strong>Service Availability:</strong> We strive to maintain 24/7 uptime for our kiosks, but we are not liable for temporary downtimes due to hardware maintenance, network issues, or power outages.</li>
            <li><strong>Limitation of Liability:</strong> ThePrintr is not responsible for any loss of data, formatting issues, or delays caused by incorrect file uploads or unsupported formats.</li>
          </ul>
        </section>

        <section id="privacy" className="scroll-mt-8">
          <h2 className="text-xl font-extrabold mb-4 border-b border-black/10 pb-2">2. Privacy Policy</h2>
          <p className="text-sm mb-3">At <strong>ThePrintr</strong>, your privacy is our priority.</p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Data Collection:</strong> We collect basic transaction details (like payment IDs) required to process your order. We do not require you to create an account to use the service.</li>
            <li><strong>File Handling & Security:</strong> Your uploaded files are processed securely. <strong>Your file is deleted immediately and permanently from our servers after the printing is complete.</strong> We do not store, read, or share your documents with any third parties.</li>
            <li><strong>Payment Information:</strong> All payments are processed via secure payment gateways (e.g., Razorpay). We do not store your credit/debit card details or UPI PINs.</li>
          </ul>
        </section>

        <section id="cancellation" className="scroll-mt-8">
          <h2 className="text-xl font-extrabold mb-4 border-b border-black/10 pb-2">3. Cancellation & Refund Policy</h2>
          <p className="text-sm mb-3">Due to the instant and automated nature of our kiosk printing service, the following refund rules apply:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>No Cancellations:</strong> Once a payment is successful and the print command is sent to the physical printer (spooled), the order cannot be canceled, and no refunds will be issued.</li>
            <li><strong>Eligible Refunds:</strong> If your payment is deducted but the printer fails to dispense your document due to a hardware failure, paper jam, or ink shortage, you are eligible for a full refund.</li>
            <li><strong>Refund Process:</strong> Please contact our support team with your Order ID within 24 hours of the failed transaction. Approved refunds will be credited back to your original payment method within 5-7 business days.</li>
          </ul>
        </section>

        <section id="shipping" className="scroll-mt-8">
          <h2 className="text-xl font-extrabold mb-4 border-b border-black/10 pb-2">4. Shipping & Delivery Policy</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Instant Delivery:</strong> ThePrintr provides an instant, self-service physical printing solution. We do not ship or mail printed documents to any address.</li>
            <li><strong>Pickup:</strong> Your printed documents are instantly dispensed and delivered at the physical kiosk location where you initiated the print job. Please collect your documents immediately from the printer output tray.</li>
          </ul>
        </section>

        <section id="contact" className="scroll-mt-8">
          <h2 className="text-xl font-extrabold mb-4 border-b border-black/10 pb-2">5. Contact Us</h2>
          <p className="text-sm mb-3">If you face any issues at the kiosk, payment failures, or have general queries, please reach out to us:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li><strong>Business Name:</strong> ThePrintr</li>
            <li><strong>Email Support:</strong> <a href="mailto:support@theprintr.in" className="text-[#8B0000] hover:underline">support@theprintr.in</a></li>
            <li><strong>Phone Number:</strong> <a href="tel:+919709304031" className="text-[#8B0000] hover:underline">+91-9709304031</a></li>
            <li><strong>Operating Address:</strong> Shop No 3, Hume Pipe, Indra Nagar, Jamshedpur 831001, Jharkhand, India.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
