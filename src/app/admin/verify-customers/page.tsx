"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface Customer {
  id: string;
  email: string;
  username: string;
  name: string;
  first_name: string;
  last_name: string;
  phone: string;
  company_name: string;
  account_status: string;
  identity_document: string;
  rejection_reason: string;
  created_at: string;
}

export default function VerifyCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);

  const fetchCustomers = () => {
    setLoading(true);
    fetch("/api/admin/verify-customer")
      .then((res) => res.json())
      .then((data) => setCustomers(data.customers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const updateStatus = async (userId: string, status: string, reason: string = "") => {
    setActionLoading(userId);
    try {
      await fetch("/api/admin/verify-customer", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status, reason }),
      });
      setShowRejectInput(null);
      fetchCustomers();
    } catch {}
    setActionLoading(null);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "text-yellow-600 bg-yellow-50",
      approved: "text-green-600 bg-green-50",
      rejected: "text-red-600 bg-red-50",
      suspended: "text-orange-600 bg-orange-50",
    };
    return (
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || "text-gray-600 bg-gray-50"}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const pendingCount = customers.filter((c) => c.account_status === "pending").length;

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Verification</h1>
          <p className="text-sm text-gray-500 mt-1">{pendingCount} pending approval</p>
        </div>
        <Button onClick={fetchCustomers} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewingDoc(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Identity Document</h3>
              <button onClick={() => setViewingDoc(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="p-4">
              {viewingDoc.endsWith(".pdf") ? (
                <iframe src={viewingDoc} className="w-full h-[70vh]" />
              ) : (
                <img src={viewingDoc} alt="Identity Document" className="w-full h-auto rounded-lg" />
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Customer</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Username</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Company</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Phone</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">ID Document</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Date</th>
                <th className="text-center px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td className="px-5 py-12 text-center text-gray-400" colSpan={8}>Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td className="px-5 py-12 text-center text-gray-400" colSpan={8}>No customers found</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{customer.name || `${customer.first_name} ${customer.last_name}`}</p>
                      <p className="text-xs text-gray-400">{customer.email}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{customer.username}</td>
                    <td className="px-5 py-4 text-gray-600">{customer.company_name || "—"}</td>
                    <td className="px-5 py-4 text-gray-600">{customer.phone || "—"}</td>
                    <td className="px-5 py-4">
                      {customer.identity_document ? (
                        <button
                          onClick={() => setViewingDoc(`/api/admin/documents?userId=${encodeURIComponent(customer.id)}`)}
                          className="text-accent-600 hover:text-accent-700 font-medium text-xs underline"
                        >
                          View Document
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs">No file</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">{statusBadge(customer.account_status)}</td>
                    <td className="px-5 py-4 text-gray-400 text-xs">{formatDate(customer.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {customer.account_status === "pending" || customer.account_status === "suspended" ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateStatus(customer.id, "approved")}
                              isLoading={actionLoading === customer.id}
                            >
                              Approve
                            </Button>
                            {showRejectInput === customer.id ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  placeholder="Reason..."
                                  className="w-28 px-2 py-1 text-xs border border-gray-300 rounded"
                                  value={rejectReason[customer.id] || ""}
                                  onChange={(e) => setRejectReason({ ...rejectReason, [customer.id]: e.target.value })}
                                />
                                <Button
                                  size="sm"
                                  variant="danger"
                                  onClick={() => updateStatus(customer.id, "rejected", rejectReason[customer.id] || "")}
                                  isLoading={actionLoading === customer.id}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowRejectInput(customer.id)}
                              >
                                Reject
                              </Button>
                            )}
                          </>
                        ) : customer.account_status === "approved" ? (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => updateStatus(customer.id, "suspended")}
                            isLoading={actionLoading === customer.id}
                          >
                            Suspend
                          </Button>
                        ) : customer.account_status === "rejected" ? (
                          <Button
                            size="sm"
                            onClick={() => updateStatus(customer.id, "pending")}
                            isLoading={actionLoading === customer.id}
                          >
                            Reset to Pending
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
