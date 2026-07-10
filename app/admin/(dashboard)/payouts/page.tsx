"use client";

import { useEffect, useState } from "react";
import type { Payout, PayoutAccount, PayoutBalance, PayoutDestination, PayoutMethod } from "@/lib/supabase/types";

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-100 text-amber-800",
  approved: "bg-sky-100 text-sky-800",
  paid:     "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

function Badge({ label }: { label: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-sm font-sans text-[10px] tracking-wide uppercase font-medium ${STATUS_COLORS[label] ?? "bg-ink/10 text-ink/60"}`}>
      {label}
    </span>
  );
}

function describeDestination(d: PayoutDestination) {
  return d.method === "momo"
    ? `${d.account_name} · ${(d.momo_network ?? "").toUpperCase()} ${d.momo_number ?? ""}`
    : `${d.account_name} · ${d.bank_name ?? ""} ${d.account_number ?? ""}`;
}

const EMPTY_ACCOUNT_FORM = {
  method: "momo" as PayoutMethod,
  accountName: "",
  momoNumber: "",
  momoNetwork: "",
  bankName: "",
  accountNumber: "",
};

export default function AdminPayoutsPage() {
  const [balance, setBalance]       = useState<PayoutBalance | null>(null);
  const [account, setAccount]       = useState<PayoutAccount | null>(null);
  const [payouts, setPayouts]       = useState<Payout[]>([]);
  const [isOperator, setIsOperator] = useState(false);
  const [loading, setLoading]       = useState(true);

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm]           = useState(EMPTY_ACCOUNT_FORM);
  const [savingAccount, setSavingAccount]       = useState(false);

  const [requestAmount, setRequestAmount] = useState("");
  const [requestNotes, setRequestNotes]   = useState("");
  const [requesting, setRequesting]       = useState(false);
  const [requestError, setRequestError]   = useState("");

  const [actingId, setActingId] = useState<string | null>(null);

  const load = () => {
    fetch("/api/admin/payouts")
      .then((r) => r.json())
      .then((data) => {
        setBalance(data.balance ?? null);
        setAccount(data.account ?? null);
        setPayouts(Array.isArray(data.payouts) ? data.payouts : []);
        setIsOperator(!!data.isOperator);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const openAccountEdit = () => {
    setAccountForm(account ? {
      method: account.method,
      accountName: account.account_name,
      momoNumber: account.momo_number ?? "",
      momoNetwork: account.momo_network ?? "",
      bankName: account.bank_name ?? "",
      accountNumber: account.account_number ?? "",
    } : EMPTY_ACCOUNT_FORM);
    setShowAccountModal(true);
  };

  const saveAccount = async () => {
    setSavingAccount(true);
    const res = await fetch("/api/admin/payout-account", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accountForm),
    });
    const data = await res.json();
    setSavingAccount(false);
    if (data.error) { alert(data.error); return; }
    setAccount(data);
    setShowAccountModal(false);
  };

  const submitRequest = async () => {
    setRequestError("");
    const amt = Number(requestAmount);
    if (!amt || amt <= 0) { setRequestError("Enter an amount greater than 0"); return; }

    setRequesting(true);
    const res = await fetch("/api/admin/payouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestedAmountGHS: amt, notes: requestNotes || undefined }),
    });
    const data = await res.json();
    setRequesting(false);
    if (data.error) { setRequestError(data.error); return; }
    setRequestAmount("");
    setRequestNotes("");
    load();
  };

  const act = async (id: string, action: "approve" | "reject" | "mark_paid") => {
    let rejectedReason: string | undefined;
    let payoutReference: string | undefined;

    if (action === "reject") {
      const reason = prompt("Reason for rejecting this request?");
      if (!reason) return;
      rejectedReason = reason;
    }
    if (action === "mark_paid") {
      const ref = prompt("Transfer reference (MoMo txn ID / bank receipt no.)?");
      if (!ref) return;
      payoutReference = ref;
    }
    if (action === "approve" && !confirm("Approve this withdrawal request?")) return;

    setActingId(id);
    const res = await fetch(`/api/admin/payouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, rejectedReason, payoutReference }),
    });
    const data = await res.json();
    setActingId(null);
    if (data.error) { alert(data.error); return; }
    load();
  };

  if (loading) return (
    <div className="p-10 font-sans text-[12px] text-ink/40">Loading…</div>
  );

  const STAT_CARDS = [
    { label: "Available to Withdraw", value: `₵${(balance?.availableGHS ?? 0).toLocaleString()}`, sub: "requestable now" },
    { label: "Total Earned",          value: `₵${(balance?.earnedGHS ?? 0).toLocaleString()}`,    sub: "completed bookings + orders" },
    { label: "Pending Requests",      value: `₵${(balance?.pendingGHS ?? 0).toLocaleString()}`,   sub: "awaiting payout" },
    { label: "Paid Out",              value: `₵${(balance?.paidOutGHS ?? 0).toLocaleString()}`,   sub: "all time" },
  ];

  return (
    <div className="p-8 md:p-10 max-w-[1000px]">
      {/* Header */}
      <div className="mb-8 fade-up">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-1">Admin</p>
        <h1 className="font-serif text-[2.5rem] font-light text-ink leading-none">
          Payouts<span className="italic">.</span>
        </h1>
        <p className="font-sans text-[13px] text-ink/55 mt-2">
          Withdraw your earned balance from completed bookings and orders
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 fade-up">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className="bg-paper p-6 border border-ink/[0.07]">
            <p className="font-sans text-[10px] tracking-widest uppercase text-ink/35 mb-3">{s.label}</p>
            <p className="font-serif text-[2rem] font-light text-ink leading-none mb-1">{s.value}</p>
            <p className="font-sans text-[11px] text-ink/50">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Withdrawal account */}
      <div className="bg-paper border border-ink/[0.07] mb-10 fade-up">
        <div className="px-6 py-5 border-b border-ink/[0.07] flex items-center justify-between">
          <p className="font-sans text-[11px] tracking-widest uppercase text-ink font-medium">Withdrawal Account</p>
          <button
            onClick={openAccountEdit}
            className="font-sans text-[10px] tracking-widest uppercase text-ink/40 hover:text-ink border border-ink/15 px-4 py-2 transition-colors"
          >
            {account ? "Edit" : "+ Add Account"}
          </button>
        </div>
        <div className="px-6 py-5">
          {account ? (
            <p className="font-sans text-[13px] text-ink/70">{describeDestination(account)}</p>
          ) : (
            <p className="font-sans text-[13px] text-ink/45">No withdrawal account on file yet — add one before requesting a payout.</p>
          )}
        </div>
      </div>

      {/* Request form */}
      <div className="bg-paper border border-ink/[0.07] mb-10 fade-up">
        <div className="px-6 py-5 border-b border-ink/[0.07]">
          <p className="font-sans text-[11px] tracking-widest uppercase text-ink font-medium">Request Withdrawal</p>
        </div>
        <div className="px-6 py-5 flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex-1">
            <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Amount (₵)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              placeholder="0.00"
              className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink bg-transparent"
            />
          </div>
          <div className="flex-1">
            <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Note (optional)</label>
            <input
              value={requestNotes}
              onChange={(e) => setRequestNotes(e.target.value)}
              className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink bg-transparent"
            />
          </div>
          <button
            onClick={submitRequest}
            disabled={!account || requesting}
            className="bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-6 py-3 hover:bg-ink/80 transition-colors disabled:opacity-40"
          >
            {requesting ? "Requesting…" : "Request"}
          </button>
        </div>
        {requestError && <p className="px-6 pb-5 font-sans text-[12px] text-red-500">{requestError}</p>}
      </div>

      {/* History */}
      <div className="bg-paper border border-ink/[0.07] fade-up">
        <div className="px-6 py-5 border-b border-ink/[0.07]">
          <p className="font-sans text-[11px] tracking-widest uppercase text-ink font-medium">History</p>
        </div>
        {payouts.length === 0 ? (
          <p className="px-6 py-8 font-sans text-[13px] text-ink/50">No withdrawal requests yet.</p>
        ) : (
          <div className="divide-y divide-ink/[0.05]">
            {payouts.map((p) => (
              <div key={p.id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-serif text-[1.25rem] font-light text-ink">₵{(p.requested_amount / 100).toLocaleString()}</p>
                    <Badge label={p.status} />
                  </div>
                  <p className="font-sans text-[12px] text-ink/50 mt-1">{describeDestination(p.destination)}</p>
                  {p.notes && <p className="font-sans text-[12px] text-ink/55 mt-1">&ldquo;{p.notes}&rdquo;</p>}
                  {p.rejected_reason && <p className="font-sans text-[12px] text-red-500 mt-1">Rejected: {p.rejected_reason}</p>}
                  {p.payout_reference && <p className="font-sans text-[12px] text-ink/45 mt-1">Ref: {p.payout_reference}</p>}
                  <p className="font-sans text-[11px] text-ink/40 mt-1">
                    Requested {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    {p.requested_by ? ` by ${p.requested_by}` : ""}
                  </p>
                </div>

                {isOperator && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {p.status === "pending" && (
                      <>
                        <button
                          onClick={() => act(p.id, "approve")}
                          disabled={actingId === p.id}
                          className="font-sans text-[10px] tracking-widest uppercase text-ink/40 hover:text-ink border border-ink/15 px-4 py-2 transition-colors disabled:opacity-40"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => act(p.id, "reject")}
                          disabled={actingId === p.id}
                          className="font-sans text-[10px] tracking-widest uppercase text-ink/25 hover:text-red-500 border border-ink/10 hover:border-red-200 px-4 py-2 transition-colors disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {p.status === "approved" && (
                      <>
                        <button
                          onClick={() => act(p.id, "mark_paid")}
                          disabled={actingId === p.id}
                          className="font-sans text-[10px] tracking-widest uppercase text-ink/40 hover:text-ink border border-ink/15 px-4 py-2 transition-colors disabled:opacity-40"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => act(p.id, "reject")}
                          disabled={actingId === p.id}
                          className="font-sans text-[10px] tracking-widest uppercase text-ink/25 hover:text-red-500 border border-ink/10 hover:border-red-200 px-4 py-2 transition-colors disabled:opacity-40"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account modal */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-start justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-paper w-full max-w-[480px] my-12 p-5 sm:p-8 relative">
            <button
              onClick={() => setShowAccountModal(false)}
              className="absolute top-5 right-5 font-sans text-[20px] text-ink/40 hover:text-ink leading-none"
            >
              ×
            </button>
            <h2 className="font-serif text-[1.5rem] font-light text-ink mb-6">Withdrawal Account</h2>

            <div className="flex flex-col gap-5">
              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Method</label>
                <div className="flex gap-3">
                  {(["momo", "bank"] as PayoutMethod[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setAccountForm((f) => ({ ...f, method: m }))}
                      className={`flex-1 border font-sans text-[11px] tracking-widest uppercase py-2.5 transition-colors ${
                        accountForm.method === m ? "border-ink bg-ink text-paper" : "border-ink/15 text-ink/50 hover:text-ink"
                      }`}
                    >
                      {m === "momo" ? "Mobile Money" : "Bank"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Account Name *</label>
                <input
                  value={accountForm.accountName}
                  onChange={(e) => setAccountForm((f) => ({ ...f, accountName: e.target.value }))}
                  className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink bg-transparent"
                />
              </div>

              {accountForm.method === "momo" ? (
                <>
                  <div>
                    <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">MoMo Number *</label>
                    <input
                      value={accountForm.momoNumber}
                      onChange={(e) => setAccountForm((f) => ({ ...f, momoNumber: e.target.value }))}
                      placeholder="024xxxxxxx"
                      className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Network *</label>
                    <select
                      value={accountForm.momoNetwork}
                      onChange={(e) => setAccountForm((f) => ({ ...f, momoNetwork: e.target.value }))}
                      className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink bg-transparent"
                    >
                      <option value="">Select…</option>
                      <option value="mtn">MTN</option>
                      <option value="vodafone">Vodafone (Telecel)</option>
                      <option value="airteltigo">AirtelTigo</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Bank Name *</label>
                    <input
                      value={accountForm.bankName}
                      onChange={(e) => setAccountForm((f) => ({ ...f, bankName: e.target.value }))}
                      className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink bg-transparent"
                    />
                  </div>
                  <div>
                    <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">Account Number *</label>
                    <input
                      value={accountForm.accountNumber}
                      onChange={(e) => setAccountForm((f) => ({ ...f, accountNumber: e.target.value }))}
                      className="w-full border border-ink/15 px-3 py-2.5 font-sans text-[13px] text-ink focus:outline-none focus:border-ink bg-transparent"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  onClick={saveAccount}
                  disabled={savingAccount || !accountForm.accountName.trim()}
                  className="flex-1 bg-ink text-paper font-sans text-[11px] tracking-widest uppercase py-4 hover:bg-ink/80 transition-colors disabled:opacity-40"
                >
                  {savingAccount ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => setShowAccountModal(false)}
                  className="border border-ink/20 text-ink font-sans text-[11px] tracking-widest uppercase px-8 hover:bg-ink/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
