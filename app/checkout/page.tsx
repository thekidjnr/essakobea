"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBag } from "@/contexts/BagContext";
import Nav from "@/components/layout/Nav";

const DELIVERY_FEE = 50;

export default function CheckoutPage() {
  const { items, getProduct, subtotal, clearBag } = useBag();
  const router = useRouter();

  const [form, setForm] = useState({
    clientName: "", clientEmail: "", clientPhone: "",
    deliveryMethod: "pickup" as "pickup" | "delivery",
    deliveryAddress: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const set = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const total = subtotal + (form.deliveryMethod === "delivery" ? DELIVERY_FEE : 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !form.clientEmail || !form.clientPhone) {
      setError("Please fill in all required fields.");
      return;
    }
    if (form.deliveryMethod === "delivery" && !form.deliveryAddress) {
      setError("Please enter your delivery address.");
      return;
    }

    setLoading(true);
    setError("");

    const orderItems = items.map(item => {
      const product = getProduct(item.productId);
      return {
        productId: item.productId,
        name:      product?.name ?? item.productId,
        price:     (product?.priceRaw ?? 0) * 100, // to pesewas
        quantity:  item.quantity,
      };
    });

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientName:      form.clientName,
        clientEmail:     form.clientEmail,
        clientPhone:     form.clientPhone,
        items:           orderItems,
        deliveryMethod:  form.deliveryMethod,
        deliveryAddress: form.deliveryAddress || null,
        notes:           form.notes || null,
      }),
    });

    const data = await res.json();
    if (data.error) { setError(data.error); setLoading(false); return; }

    // Redirect to Paystack
    clearBag();
    window.location.href = data.paystackUrl;
  };

  if (items.length === 0) {
    return (
      <>
        <Nav />
        <div className="min-h-screen bg-paper flex items-center justify-center flex-col gap-6 pt-24">
          <p className="font-serif text-[2rem] font-light text-ink">Your bag is empty.</p>
          <a href="/shop" className="font-sans text-[11px] tracking-widest uppercase text-ink border-b border-ink pb-px hover:opacity-60 transition-opacity">
            Browse Collection
          </a>
        </div>
      </>
    );
  }

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-paper pt-28 md:pt-36 pb-24">
        <div className="max-w-[1000px] mx-auto px-6 md:px-10">
          <div className="mb-10">
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-2">Checkout</p>
            <h1 className="font-serif text-[clamp(2.5rem,5vw,4rem)] font-light text-ink leading-none">
              Complete your <span className="italic">order.</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">
            {/* Form */}
            <form onSubmit={handleCheckout} className="flex flex-col gap-6">
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 border-b border-ink/10 pb-4">
                Your Details
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name *" value={form.clientName} onChange={v => set("clientName", v)} placeholder="Akua Mensah" />
                <Field label="Phone *" value={form.clientPhone} onChange={v => set("clientPhone", v)} placeholder="055 720 5803" type="tel" />
              </div>
              <Field label="Email *" value={form.clientEmail} onChange={v => set("clientEmail", v)} placeholder="akua@email.com" type="email" />

              <div>
                <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 border-b border-ink/10 pb-4 mb-5">
                  Delivery
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(["pickup", "delivery"] as const).map(m => (
                    <button
                      key={m} type="button"
                      onClick={() => set("deliveryMethod", m)}
                      className={`py-4 border font-sans text-[11px] tracking-widest uppercase transition-all ${
                        form.deliveryMethod === m ? "bg-ink text-paper border-ink" : "border-ink/20 text-ink/50 hover:border-ink/50"
                      }`}
                    >
                      {m === "pickup" ? "Pickup — Free" : `Delivery — ₵${DELIVERY_FEE}`}
                    </button>
                  ))}
                </div>

                {form.deliveryMethod === "delivery" && (
                  <div className="mt-4">
                    <Field
                      label="Delivery Address *"
                      value={form.deliveryAddress}
                      onChange={v => set("deliveryAddress", v)}
                      placeholder="House number, street, area, Accra"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">
                  Order Notes (optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => set("notes", e.target.value)}
                  placeholder="Any special instructions?"
                  rows={3}
                  className="w-full border border-ink/15 px-4 py-3 font-sans text-[13px] text-ink placeholder:text-ink/25 font-light focus:outline-none focus:border-ink transition-colors resize-none bg-transparent"
                />
              </div>

              {error && <p className="font-sans text-[12px] text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="bg-ink text-paper font-sans text-[11px] tracking-widest uppercase py-4 hover:bg-ink/80 transition-colors disabled:opacity-50 mt-2"
              >
                {loading ? "Redirecting to Paystack…" : `Pay ₵${total.toLocaleString()} via Paystack →`}
              </button>
              <p className="font-sans text-[11px] text-ink/30 -mt-2">
                Secure payment via Paystack — Card or Mobile Money accepted.
              </p>
            </form>

            {/* Order summary */}
            <div className="bg-mist p-6 lg:sticky lg:top-28">
              <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-6">Order Summary</p>
              <div className="flex flex-col gap-3 mb-5">
                {items.map(item => {
                  const product = getProduct(item.productId);
                  if (!product) return null;
                  return (
                    <div key={item.productId} className="flex items-start justify-between gap-3">
                      <span className="font-sans text-[12px] text-ink/70 leading-snug">
                        {product.name} <span className="text-ink/35">×{item.quantity}</span>
                      </span>
                      <span className="font-sans text-[12px] text-ink flex-shrink-0">
                        ₵{(product.priceRaw * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-ink/10 pt-4 flex flex-col gap-2">
                <div className="flex justify-between font-sans text-[12px] text-ink/50">
                  <span>Subtotal</span><span>₵{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-sans text-[12px] text-ink/50">
                  <span>Delivery</span>
                  <span>{form.deliveryMethod === "delivery" ? `₵${DELIVERY_FEE}` : "Free"}</span>
                </div>
                <div className="flex justify-between font-sans text-[14px] text-ink font-medium pt-2 border-t border-ink/10">
                  <span>Total</span><span>₵{total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-ink/15 px-4 py-3 font-sans text-[13px] text-ink placeholder:text-ink/25 font-light focus:outline-none focus:border-ink transition-colors bg-transparent"
      />
    </div>
  );
}
