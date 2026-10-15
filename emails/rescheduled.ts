const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function rescheduledHtml(opts: {
  clientName:   string
  serviceName:  string
  treatment:    string
  stylistName?: string | null
  bookingDate:  string   // formatted, e.g. "Friday, 23 October 2026"
  timeSlot:     string
  previousDate: string   // formatted
  previousTime: string
  movedBy:      'client' | 'salon'
  manageUrl:    string
}): string {
  const sub = opts.movedBy === 'salon'
    ? 'We&rsquo;ve had to move your appointment. Here are the new details.'
    : 'Your appointment has been moved as requested. Here are the new details.'

  const row = (label: string, value: string, muted = false) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #f0ede8;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9A9590;font-family:'Inter',Arial,sans-serif;white-space:nowrap;padding-right:24px">${label}</td>
        <td style="padding:14px 0;border-bottom:1px solid #f0ede8;font-size:13px;color:${muted ? '#9A9590' : '#1A212B'};font-family:'Inter',Arial,sans-serif;text-align:right${muted ? ';text-decoration:line-through' : ''}">${value}</td>
      </tr>`

  const rows = [
    row('Service', opts.serviceName),
    row('Treatment', opts.treatment),
    opts.stylistName ? row('Stylist', esc(opts.stylistName)) : '',
    row('New date', opts.bookingDate),
    row('New time', opts.timeSlot),
    row('Was', `${opts.previousDate}, ${opts.previousTime}`, true),
  ].join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Appointment Moved | Essakobea</title>
</head>
<body style="margin:0;padding:0;background:#f4f2ef;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ef;padding:48px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff">
        <tr><td style="background:#1A212B;height:3px;font-size:0">&nbsp;</td></tr>
        <tr>
          <td style="padding:48px 48px 0">
            <p style="margin:0 0 36px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#9A9590;font-family:'Inter',Arial,sans-serif">Essakobea</p>
            <h1 style="margin:0 0 12px;font-size:36px;font-weight:300;color:#1A212B;line-height:1.15;letter-spacing:-0.5px">
              Appointment <em>moved,</em><br>${esc(opts.clientName)}.
            </h1>
            <p style="margin:0 0 40px;font-size:14px;color:#6B6560;font-family:'Inter',Arial,sans-serif;line-height:1.6">${sub}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 48px">
            <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 48px 48px">
            <p style="margin:0 0 12px;font-size:13px;color:#55504a;font-family:'Inter',Arial,sans-serif;line-height:1.6">
              Your payment stays with this booking. Nothing else changes.
            </p>
            <p style="margin:0;font-size:11px;color:#B0ABA5;font-family:'Inter',Arial,sans-serif;line-height:1.8">
              <a href="${opts.manageUrl}" style="color:#1A212B;text-decoration:underline">Manage your booking →</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#1A212B;padding:24px 48px">
            <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;font-family:'Inter',Arial,sans-serif">Essakobea</p>
            <p style="margin:4px 0 0;font-size:10px;color:#9A9590;font-family:'Inter',Arial,sans-serif">East Legon, Accra &nbsp;·&nbsp; essakobea.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
