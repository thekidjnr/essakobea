// Booking confirmation email HTML
export function bookingConfirmationHtml(opts: {
  clientName:   string
  serviceName:  string
  treatment:    string
  bookingDate:  string
  timeSlot:     string
  price:        string
  bookingId:    string
  cancelToken:  string
  appUrl:       string
  paidDeposit?: boolean
}): string {
  const cancelUrl = `${opts.appUrl}/cancel/${opts.cancelToken}`
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
  .badge{display:inline-block;background:#1A212B;color:#fff;font-size:10px;letter-spacing:2px;text-transform:uppercase;padding:6px 14px;margin:32px 0 8px}
  .note{font-size:12px;color:#9A9590;font-family:Inter,sans-serif;line-height:1.6;margin-top:32px}
  .cancel{font-size:11px;color:#9A9590;font-family:Inter,sans-serif;margin-top:40px}
  a{color:#1A212B}
</style></head>
<body>
<div class="card">
  <p class="brand">Essakobea</p>
  <h1>You&rsquo;re all set,<br><em>${opts.clientName}.</em></h1>
  <p class="sub">Your appointment has been received. We&rsquo;ll confirm via WhatsApp within a few hours.</p>

  <div class="row"><span class="label">Service</span><span class="value">${opts.serviceName}</span></div>
  <div class="row"><span class="label">Treatment</span><span class="value">${opts.treatment}</span></div>
  <div class="row"><span class="label">Price</span><span class="value">${opts.price}</span></div>
  <div class="row"><span class="label">Date</span><span class="value">${opts.bookingDate}</span></div>
  <div class="row"><span class="label">Time</span><span class="value">${opts.timeSlot}</span></div>
  <div class="row"><span class="label">Location</span><span class="value">East Legon, Accra</span></div>
  ${opts.paidDeposit ? '<div class="row"><span class="label">Deposit</span><span class="value">₵100 paid ✓</span></div>' : ''}

  <p class="note">
    Need to make changes? Reach us on WhatsApp at <strong>+233 55 720 5803</strong> or reply to this email.<br><br>
    You can cancel your appointment (free cancellation up to 24 hours before your slot) using the link below.
  </p>

  <p class="cancel">
    <a href="${cancelUrl}">Cancel this appointment →</a><br>
    Booking ref: ${opts.bookingId.slice(0, 8).toUpperCase()}
  </p>
</div>
</body></html>`
}
