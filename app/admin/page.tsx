"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Printer, 
  Lock, 
  KeyRound, 
  RefreshCw, 
  Check, 
  Loader2, 
  DollarSign, 
  Clock, 
  FileText, 
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  Filter
} from "lucide-react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

interface Order {
  id: string;
  order_seq: number;
  order_number?: string;
  file_url?: string;
  file_name: string;
  pages: number;
  copies: number;
  color_mode: string;
  print_style?: string;
  scaling?: string;
  orientation?: string;
  status: string;
  total_amount: number;
  payment_id: string;
  created_at: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1396") {
      setIsAuthenticated(true);
      setPinError("");
    } else {
      setPinError("Invalid PIN. Please enter the 4-digit manager PIN.");
      setPin("");
    }
  };

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
      } else if (data) {
        setOrders(data as Order[]);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      // Optional polling every 12 seconds for fresh order arrival
      const interval = setInterval(fetchOrders, 12000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchOrders]);

  const handleApprove = async (orderId: string) => {
    setApprovingId(orderId);
    try {
      const res = await fetch("/api/admin/approve-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        console.error("Supabase update error:", result.error);
        alert("Failed to approve order: " + (result.error || "Unknown server error"));
      } else {
        await fetchOrders();
      }
    } catch (err: any) {
      console.error("Error approving order:", err);
      alert("Network error while approving order.");
    } finally {
      setApprovingId(null);
    }
  };

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    const formattedOrderId = `CPT${String(order.order_seq || 0).padStart(5, "0")}`.toLowerCase();
    const matchesSearch = 
      formattedOrderId.includes(searchQuery.toLowerCase()) ||
      (order.file_name && order.file_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.payment_id && order.payment_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Summary counts
  const awaitingCashCount = orders.filter((o) => o.status === "awaiting_cash").length;
  const queuedCount = orders.filter((o) => o.status === "queued" || o.status === "pending").length;
  const totalRevenue = orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

  // If not authenticated, show PIN Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-2xl p-8 border border-noir/10 my-auto text-noir animate-fade-in-up">
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-cherry/10 text-cherry flex items-center justify-center shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-noir">ThePrintr Admin</h1>
            <p className="text-xs text-noir/60 font-medium mt-1">Enter your 4-digit PIN to access terminal</p>
          </div>
        </div>

        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-noir/70 mb-2 text-center">
              Manager PIN Code
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError("");
                }}
                placeholder="&bull; &bull; &bull; &bull;"
                className="w-full text-center text-2xl tracking-[0.5em] py-3.5 px-4 bg-cotton/50 rounded-xl border border-noir/20 focus:outline-none focus:ring-2 focus:ring-cherry/40 font-bold text-noir transition-all"
              />
            </div>
            {pinError && (
              <p className="text-xs text-red-600 font-semibold text-center mt-2 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {pinError}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-cherry hover:bg-maroon active:scale-[0.98] text-cotton font-extrabold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            Unlock Dashboard
          </button>

          <div className="pt-2 text-center">
            <a
              href="https://print.theprintr.in"
              className="text-xs font-semibold text-noir/60 hover:text-cherry inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Kiosk
            </a>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-6 animate-fade-in-up">
      {/* Top Header */}
      <header className="bg-white rounded-2xl p-4 sm:p-5 border border-noir/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cherry text-cotton flex items-center justify-center shadow-md">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-noir tracking-tight">ThePrintr Admin Panel</h1>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-300">
                Live Terminal
              </span>
            </div>
            <p className="text-xs text-noir/60 font-medium">Manage kiosk queue and approve counter payments</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchOrders()}
            disabled={isLoading}
            className="px-3.5 py-2 bg-cotton hover:bg-noir/10 text-noir font-bold text-xs rounded-xl border border-noir/15 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cherry" : ""}`} />
            <span>Refresh</span>
          </button>

          <a
            href="https://print.theprintr.in"
            className="px-3.5 py-2 bg-cotton hover:bg-noir/10 text-noir font-bold text-xs rounded-xl border border-noir/15 transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>View Kiosk</span>
          </a>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-3.5 py-2 bg-cherry/10 hover:bg-cherry/20 text-cherry font-bold text-xs rounded-xl border border-cherry/20 transition-all flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-noir/10 shadow-sm">
          <div className="flex items-center justify-between text-noir/60 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <FileText className="w-4 h-4 text-noir/40" />
          </div>
          <p className="text-2xl font-black text-noir">{orders.length}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-amber-200 bg-amber-50/40 shadow-sm">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Awaiting Cash</span>
            <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
          </div>
          <p className="text-2xl font-black text-amber-700">{awaitingCashCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-200 bg-blue-50/40 shadow-sm">
          <div className="flex items-center justify-between text-blue-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">In Print Queue</span>
            <Printer className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-700">{queuedCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-emerald-200 bg-emerald-50/40 shadow-sm">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700">₹{totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="bg-white rounded-2xl p-4 border border-noir/10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-noir/40" />
          <input
            type="text"
            placeholder="Search by Order ID (CPT...) or file name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-cotton/50 rounded-xl text-xs font-semibold text-noir border border-noir/15 focus:outline-none focus:ring-2 focus:ring-cherry/30 placeholder:text-noir/40"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 custom-scroll">
          <span className="text-[11px] font-bold text-noir/60 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {[
            { key: "all", label: "All" },
            { key: "awaiting_cash", label: `Awaiting Cash (${awaitingCashCount})` },
            { key: "queued", label: "Queued" },
            { key: "pending", label: "Pending" },
            { key: "completed", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === tab.key
                  ? "bg-noir text-cotton shadow-sm"
                  : "bg-cotton/60 text-noir/70 hover:bg-cotton"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-noir/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-cotton/70 border-b border-noir/10 text-[11px] font-black uppercase tracking-wider text-noir/70">
                <th className="py-3 px-4">Order ID</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4">Print Settings</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-noir/5 text-xs text-noir">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-noir/50 font-medium">
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-cherry" />
                        <span>Loading orders...</span>
                      </div>
                    ) : (
                      "No orders found matching the filter."
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const formattedOrderId = `CPT${String(order.order_seq || 0).padStart(5, "0")}`;
                  const isAwaitingCash = order.status === "awaiting_cash";
                  const isCash = order.payment_id === "CASH_AT_COUNTER";
                  const createdAt = new Date(order.created_at);
                  const formattedTime = createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  const formattedDate = createdAt.toLocaleDateString([], { month: "short", day: "numeric" });

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-cotton/30 transition-colors ${
                        isAwaitingCash ? "bg-amber-50/50" : ""
                      }`}
                    >
                      {/* Order ID */}
                      <td className="py-3.5 px-4 font-mono font-black text-cherry">
                        <span className="inline-block px-2.5 py-1 bg-cherry/10 rounded-md border border-cherry/20 text-xs">
                          {formattedOrderId}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-noir">{formattedTime}</div>
                        <div className="text-[10px] text-noir/50 font-medium">{formattedDate}</div>
                      </td>

                      {/* File Name */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-noir/40 shrink-0" />
                          <span className="font-bold truncate" title={order.file_name}>
                            {order.file_name}
                          </span>
                          {order.file_url && (
                            <a
                              href={order.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-noir/40 hover:text-cherry shrink-0"
                              title="Open uploaded file"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Print Settings */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                              order.color_mode === "color"
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : "bg-zinc-200 text-zinc-800"
                            }`}
                          >
                            {order.color_mode === "color" ? "Color" : "B&W"}
                          </span>
                          <span className="text-[11px] font-semibold text-noir/80">
                            {order.pages || 1} {order.pages === 1 ? "pg" : "pgs"} &times; {order.copies || 1} {order.copies === 1 ? "copy" : "copies"}
                          </span>
                        </div>
                        {(order.orientation || order.scaling) && (
                          <div className="text-[10px] text-noir/50 font-medium mt-0.5 uppercase">
                            {order.orientation || "auto"} &bull; {order.scaling || "fit"}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 text-right font-black text-sm whitespace-nowrap text-noir">
                        ₹{Number(order.total_amount || 0).toFixed(2)}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isCash ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                            Cash Counter
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Online Pay
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isAwaitingCash ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-500 text-white shadow-sm animate-pulse">
                            <Clock className="w-3 h-3" />
                            Awaiting Cash
                          </span>
                        ) : order.status === "queued" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <Printer className="w-3 h-3" />
                            Queued
                          </span>
                        ) : order.status === "completed" || order.status === "printed" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Printed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-zinc-100 text-zinc-700 border border-zinc-200 capitalize">
                            {order.status}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isAwaitingCash ? (
                          <button
                            onClick={() => handleApprove(order.id)}
                            disabled={approvingId === order.id}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-black text-xs bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none"
                            title="Confirm cash received and trigger print"
                          >
                            {approvingId === order.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Approving...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Approve Print</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-noir/40 font-semibold italic">
                            {order.status === "queued" ? "Printing ready" : "Processed"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
