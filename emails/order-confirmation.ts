import type { OrderItem } from '@/lib/supabase/types'

export function orderConfirmationHtml(opts: {
  clientName:     string
  orderId:        string
  items:          OrderItem[]
  subtotal:       number
  total:          number
  deliveryMethod: string
  deliveryAddress?: string
  appUrl:         string
}): string {
  const itemsHtml = opts.items.map(item =>
    `<div class="row">
      <span class="label">${item.name} ×${item.quantity}</span>
      <span class="value">₵${(item.price / 100 * item.quantity).toLocaleString()}</span>
    </div>`
  ).join('')

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body{font-family:Georgia,serif;background:#f7f6f4;margin:0;padding:40px 20px;color:#1A212B}
  .card{background:#fff;max-width:560px;margin:0 auto;padding:48px}
  .brand{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#9A9590;margin-bottom:40px}
  h1{font-size:32px;font-weight:300;margin:0 0 8px}
  .sub{font-size:13px;color:#9A9590;margin:0 0 40px;font-family:Inter,sans-serif}
  .row{display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid #f0ede8;font-family:Inter,sans-serif}
  .label{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9A9590}
  .value{font-size:13px;color:#1A212B;text-align:right}
  .total-row{display:flex;justify-content:space-between;padding:16px 0;font-family:Inter,sans-serif}
  .total-label{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#9A9590}
  .total-value{font-size:20px;font-weight:300}
  .note{font-size:12px;color:#9A9590;font-family:Inter,sans-serif;line-height:1.6;margin-top:32px}
</style></head>
<body>
<div class="card">
  <p class="brand">Essakobea</p>
  <h1>Order <em>confirmed,</em><br>${opts.clientName}.</h1>
  <p class="sub">Payment received. We&rsquo;ll get your order ready right away.</p>

  ${itemsHtml}

  <div class="row">
    <span class="label">Delivery</span>
    <span class="value">${opts.deliveryMethod === 'pickup' ? 'Pickup — East Legon Studio' : `Delivery — ${opts.deliveryAddress}`}</span>
  </div>

  <div class="total-row">
    <span class="total-label">Total paid</span>
    <span class="total-value">₵${(opts.total / 100).toLocaleString()}</span>
  </div>

  <p class="note">
    Order ref: <strong>${opts.orderId.slice(0, 8).toUpperCase()}</strong><br><br>
    We&rsquo;ll reach out via WhatsApp to coordinate ${opts.deliveryMethod === 'pickup' ? 'your pickup' : 'delivery'}.<br>
    Questions? Reply to this email or WhatsApp us at +233 55 720 5803.
  </p>
</div>
</body></html>`
}
