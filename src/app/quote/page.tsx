"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { products } from "@/data/products";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { useQuote } from "@/context/QuoteContext";
import { sanitizeInput, sanitizeEmail, sanitizePhone, validateEmail } from "@/lib/utils";

interface QuoteItem {
  productId: string;
  productName: string;
  quantity: number;
  notes: string;
}

function QuoteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useCustomerAuth();
  const { items: contextItems, clearItems } = useQuote();
  const preselectedProduct = searchParams.get("product");
  const preselectedProductData = preselectedProduct
    ? products.find((p) => p.slug === preselectedProduct)
    : undefined;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    projectType: "" as "residential" | "commercial" | "industrial" | "infrastructure" | "",
    projectDetails: "",
    deliveryCity: "",
    timeline: "",
  });

  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>(() =>
    preselectedProductData
      ? [{ productId: preselectedProductData.id, productName: preselectedProductData.name, quantity: 100, notes: "" }]
      : [{ productId: "", productName: "", quantity: 100, notes: "" }]
  );

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentParams = new URLSearchParams(window.location.search).toString();
      router.push(`/login?redirect=/quote${currentParams ? `?${currentParams}` : ""}`);
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (contextItems.length > 0) {
      setQuoteItems(contextItems.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        notes: item.notes || "",
      })));
    }
  }, [contextItems]);

  const updateField = (field: string, value: string) => {
    const sanitized = field === "email" ? sanitizeEmail(value) : field === "phone" ? sanitizePhone(value) : sanitizeInput(value);
    setFormData((prev) => ({ ...prev, [field]: sanitized }));
  };

  const addItem = () => {
    setQuoteItems((prev) => [...prev, { productId: "", productName: "", quantity: 100, notes: "" }]);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    setQuoteItems((prev) => {
      const updated = [...prev];
      const sanitized = field === "notes" && typeof value === "string" ? sanitizeInput(value) : value;
      updated[index] = { ...updated[index], [field]: sanitized };
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setQuoteItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail(formData.email)) {
      setSubmitError("Please enter a valid email address.");
      return;
    }
    const selectedItems = quoteItems.filter((item) => item.productId && item.quantity > 0);
    if (selectedItems.length === 0) {
      setSubmitError("Please select at least one product.");
      return;
    }
    setSubmitError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItems,
          notes: formData.projectDetails,
          projectDetails: {
            projectType: formData.projectType,
            description: formData.projectDetails,
          },
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          deliveryCity: formData.deliveryCity,
          timeline: formData.timeline,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit quote");
      setQuoteNumber(data.quoteNumber);
      clearItems();
      setSubmitting(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-accent-100 rounded-full flex items-center justify-center">
          <span className="text-4xl">📋</span>
        </div>
        <h1 className="text-3xl font-bold text-primary-900 mb-2">Quote Request Submitted!</h1>
        <p className="text-primary-500 mb-6 max-w-md mx-auto">
          Thank you for your inquiry. Our sales team will review your requirements and get back to you within 24 hours with a competitive quotation.
        </p>
        <div className="bg-primary-50 rounded-xl p-6 mb-4 inline-block">
          <p className="text-sm text-primary-500">Quote Reference</p>
          <p className="text-xl font-bold text-primary-900">{quoteNumber}</p>
        </div>
        <div className="bg-accent-50 border border-accent-200 rounded-xl p-4 mb-8 inline-block text-left">
          <p className="text-sm text-accent-800 font-medium">What happens next?</p>
          <ol className="text-sm text-accent-700 mt-2 space-y-1 list-decimal list-inside">
            <li>Our team reviews your requirements</li>
            <li>We prepare a customized quotation</li>
            <li>Quote is sent to your email within 24 hours</li>
            <li>Our sales representative may contact you for clarification</li>
          </ol>
        </div>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => window.location.href = "/account/quotes"} variant="outline">View My Quotes</Button>
          <Button onClick={() => window.location.href = "/"}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-primary-900">Request a Quotation</h1>
        <p className="text-primary-500 mt-3 max-w-2xl mx-auto">
          Get competitive pricing for bulk orders. Fill out the form below and our team will provide a customized quotation within 24 hours.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contact Information */}
        <div className="bg-white border border-primary-100 rounded-xl p-6">
          <h2 className="text-lg font-bold text-primary-900 mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="First Name" id="qfname" value={formData.firstName} onChange={(e) => updateField("firstName", e.target.value)} required />
            <Input label="Last Name" id="qlname" value={formData.lastName} onChange={(e) => updateField("lastName", e.target.value)} required />
            <Input label="Email" id="qemail" type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} required />
            <Input label="Phone" id="qphone" type="tel" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} required />
            <Input label="Company (Optional)" id="qcompany" value={formData.company} onChange={(e) => updateField("company", e.target.value)} />
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-white border border-primary-100 rounded-xl p-6">
          <h2 className="text-lg font-bold text-primary-900 mb-4">Project Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">Project Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { value: "residential", label: "Residential" },
                  { value: "commercial", label: "Commercial" },
                  { value: "industrial", label: "Industrial" },
                  { value: "infrastructure", label: "Infrastructure" },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateField("projectType", type.value)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium text-center transition-all ${
                      formData.projectType === type.value ? "border-accent-500 bg-accent-50 text-accent-700" : "border-primary-200 text-primary-600 hover:border-primary-300"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="details" className="block text-sm font-medium text-primary-700 mb-1">Project Details</label>
              <textarea
                id="details"
                value={formData.projectDetails}
                onChange={(e) => updateField("projectDetails", e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-primary-300 px-4 py-2.5 text-sm focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                placeholder="Describe your project, requirements, and any special instructions..."
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Delivery City" id="qcity" value={formData.deliveryCity} onChange={(e) => updateField("deliveryCity", e.target.value)} placeholder="City for delivery" />
              <Input label="Target Timeline" id="qtimeline" value={formData.timeline} onChange={(e) => updateField("timeline", e.target.value)} placeholder="e.g., Within 2 weeks" />
            </div>
          </div>
        </div>

        {/* Products / Items */}
        <div className="bg-white border border-primary-100 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-primary-900">Products Required</h2>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>+ Add Item</Button>
          </div>
          <div className="space-y-4">
            {quoteItems.map((item, index) => (
              <div key={index} className="p-4 bg-primary-50 rounded-xl">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-primary-900">Item #{index + 1}</h3>
                  {quoteItems.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-primary-600 mb-1">Product Name</label>
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const prod = products.find((p) => p.id === e.target.value);
                        updateItem(index, "productId", e.target.value);
                        updateItem(index, "productName", prod?.name || "");
                      }}
                      className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm bg-white focus:outline-none focus:border-accent-500"
                    >
                      <option value="">Select a product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-primary-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                      className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-primary-600 mb-1">Notes (Optional)</label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => updateItem(index, "notes", e.target.value)}
                      placeholder="Size, variant, etc."
                      className="w-full rounded-lg border border-primary-300 px-3 py-2 text-sm focus:outline-none focus:border-accent-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* File Upload */}
        <div className="bg-white border border-primary-100 rounded-xl p-6">
          <h2 className="text-lg font-bold text-primary-900 mb-2">Upload Project Files (Optional)</h2>
          <p className="text-sm text-primary-500 mb-4">Upload blueprints, specifications, or any reference documents (PDF, DWG, Images). Max 10MB per file.</p>
          <div className="border-2 border-dashed border-primary-300 rounded-xl p-8 text-center hover:border-accent-400 transition-colors cursor-pointer">
            <p className="text-primary-500 text-sm">Drag & drop files here or click to browse</p>
            <p className="text-primary-400 text-xs mt-1">Supported: PDF, DWG, JPG, PNG, DOC</p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" size="lg" onClick={() => window.location.href = "/"}>Cancel</Button>
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{submitError}</p>
          )}
          <Button type="submit" size="lg" isLoading={submitting}>Submit Quote Request</Button>
        </div>
      </form>
    </div>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto px-4 py-8 text-center"><p className="text-gray-500">Loading...</p></div>}>
      <QuoteForm />
    </Suspense>
  );
}
