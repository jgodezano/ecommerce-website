"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { sanitizeInput, sanitizeEmail, sanitizePhone, validateEmail } from "@/lib/utils";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(formData.email)) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">✉️</span>
        </div>
        <h1 className="text-3xl font-bold text-primary-900 mb-2">Message Sent!</h1>
        <p className="text-primary-500">Thank you for reaching out. Our team will respond within 24 hours.</p>
        <Button className="mt-6" onClick={() => setSubmitted(false)}>Send Another Message</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary-900">Contact Us</h1>
        <p className="text-primary-500 mt-3 max-w-xl mx-auto">
          Have a question about our products or need assistance with your order? We&apos;re here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="First Name" id="cfname" value={formData.firstName} onChange={(e) => updateField("firstName", sanitizeInput(e.target.value))} required />
              <Input label="Last Name" id="clname" value={formData.lastName} onChange={(e) => updateField("lastName", sanitizeInput(e.target.value))} required />
            </div>
            <Input label="Email" id="cemail" type="email" value={formData.email} onChange={(e) => updateField("email", sanitizeEmail(e.target.value))} required />
            <Input label="Phone" id="cphone" type="tel" value={formData.phone} onChange={(e) => updateField("phone", sanitizePhone(e.target.value))} />
            <div>
              <label htmlFor="csubject" className="block text-sm font-medium text-primary-700 mb-1">Subject</label>
              <select id="csubject" value={formData.subject} onChange={(e) => updateField("subject", e.target.value)} className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20 bg-white">
                <option>General Inquiry</option>
                <option>Product Question</option>
                <option>Bulk Order / Quotation</option>
                <option>Delivery Concern</option>
                <option>Order Status</option>
                <option>Feedback / Suggestion</option>
              </select>
            </div>
            <div>
              <label htmlFor="cmessage" className="block text-sm font-medium text-primary-700 mb-1">Message</label>
              <textarea
                id="cmessage"
                rows={5}
                value={formData.message}
                onChange={(e) => updateField("message", sanitizeInput(e.target.value))}
                className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                placeholder="How can we help you?"
                required
              />
            </div>
            <Button type="submit" size="lg">Send Message</Button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-primary-50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-primary-900 mb-4">Get in Touch</h2>
            <div className="space-y-4">
              {[
                { icon: "📍", label: "Address", value: "National Highway, Banay-Banay, San Vicente, Lipa City, Batangas" },
                { icon: "📞", label: "Phone", value: "0920 923 4354 | 0922 811 0020 (Enrico)" },
                { icon: "✉️", label: "Email", value: "enricoamanalo@yahoo.com" },
                { icon: "🕐", label: "Business Hours", value: "Mon-Sat: 6:00 AM - 6:00 PM" },
              ].map((info) => (
                <div key={info.label} className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{info.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-primary-900">{info.label}</p>
                    <p className="text-sm text-primary-600">{info.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary-50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-primary-900 mb-3">Delivery Areas</h2>
            <p className="text-sm text-primary-600 mb-3">We deliver to areas across Batangas and nearby provinces:</p>
            <div className="flex flex-wrap gap-2">
              {["Lipa City", "Batangas City", "Tanauan", "Santo Tomas", "Malvar", "Rosario", "San Juan", "Padre Garcia", "Ibaan", "Cuenca", "Alaminos", "San Pablo City"].map((city) => (
                <span key={city} className="px-3 py-1 bg-white rounded-full text-xs font-medium text-primary-600 border border-primary-200">
                  {city}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
