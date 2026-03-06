export function cancellationHtml(opts: {
  clientName:  string
  serviceName: string
  treatment:   string
  bookingDate: string
  timeSlot:    string
  reason?:     string
  hoursNotice: number
}): string {
  const refundNote = opts.hoursNotice >= 24
    ? 'If you paid a deposit, we&rsquo;ll process your refund within 3–5 business days.'
    : 'As this cancellation is within 24 hours of your appointment, the booking deposit is non-refundable.'

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
  .note{font-size:12px;color:#9A9590;font-family:Inter,sans-serif;line-height:1.6;margin-top:32px}
  a{color:#1A212B}
</style></head>
<body>
<div class="card">
  <p class="brand">Essakobea</p>
  <h1>Appointment <em>cancelled,</em><br>${opts.clientName}.</h1>
  <p class="sub">Your booking has been cancelled as requested.</p>

  <div class="row"><span class="label">Service</span><span class="value">${opts.serviceName}</span></div>
  <div class="row"><span class="label">Treatment</span><span class="value">${opts.treatment}</span></div>
  <div class="row"><span class="label">Date</span><span class="value">${opts.bookingDate}</span></div>
  <div class="row"><span class="label">Time</span><span class="value">${opts.timeSlot}</span></div>
  ${opts.reason ? `<div class="row"><span class="label">Reason</span><span class="value">${opts.reason}</span></div>` : ''}

  <p class="note">
    ${refundNote}<br><br>
    We&rsquo;d love to have you back. <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ''}/book">Book a new appointment →</a>
  </p>
</div>
</body></html>`
}
