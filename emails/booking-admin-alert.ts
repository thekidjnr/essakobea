export function bookingAdminAlertHtml(opts: {
  clientName:         string
  clientPhone:        string
  clientEmail:        string
  serviceName:        string
  treatment:          string
  bookingDate:        string
  timeSlot:           string
  depositGHS:         number
  isDeposit:          boolean   // true = deposit for range price; false = full payment
  stylistName?:       string | null
  bookingId:          string
  notes?:             string | null
  appUrl:             string
  customizationType?: string | null
  isEmergency?:       boolean
  customizationFee?:  number
  emergencyFee?:      number
  serviceCharge?:     number
}): string {
  const bookingsUrl = `${opts.appUrl}/admin/bookings`
  const ref         = opts.bookingId.slice(0, 8).toUpperCase()
  const amountLine  = opts.isDeposit
    ? `₵${opts.depositGHS} deposit paid`
    : `₵${opts.depositGHS} paid in full`

  const custLabel = opts.customizationType === 'standard' ? 'Standard (drop off 48–72 hrs before)'
                  : opts.customizationType === 'express'  ? 'Express (bring unit on the day)'
                  : null

  const rows = [
    ['Client',    opts.clientName],
    ['Phone',     opts.clientPhone],
    ['Email',     opts.clientEmail],
    ['Service',   opts.serviceName],
    ['Treatment', opts.treatment],
    opts.stylistName ? ['Stylist', opts.stylistName] : ['Stylist', 'Any Available'],
    ['Date',      opts.bookingDate],
    ['Time',      opts.timeSlot],
    opts.isEmergency ? ['Booking Type', '⚡ Emergency (Priority Handling)'] : null,
    custLabel ? ['Customization', custLabel] : null,
    ['Booking Ref', ref],
  ].filter(Boolean) as [string, string][]

  // Fee breakdown lines (only shown when there are add-ons)
  const hasAddOns = (opts.customizationFee ?? 0) > 0 || (opts.emergencyFee ?? 0) > 0 || (opts.serviceCharge ?? 0) > 0
  const baseAmount = opts.depositGHS - (opts.customizationFee ?? 0) - (opts.emergencyFee ?? 0) - (opts.serviceCharge ?? 0)

  const feeRows: [string, string][] = hasAddOns ? [
    ['Service / Deposit', `₵${baseAmount}`] as [string, string],
    ...(opts.customizationFee ? [[`Customization (${opts.customizationType})`, `+₵${opts.customizationFee}`] as [string, string]] : []),
    ...(opts.emergencyFee ? [['Emergency fee', `+₵${opts.emergencyFee}`] as [string, string]] : []),
    ...(opts.serviceCharge ? [['Service charge (5%)', `+₵${opts.serviceCharge}`] as [string, string]] : []),
    [opts.isDeposit ? 'Deposit Paid' : 'Total Paid', `₵${opts.depositGHS}`] as [string, string],
  ] : [
    [opts.isDeposit ? 'Deposit Paid' : 'Amount Paid', amountLine] as [string, string],
  ]

  const makeRow = ([label, value]: [string, string]) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #f0ede8;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9A9590;font-family:'Inter',Arial,sans-serif;white-space:nowrap;padding-right:24px">${label}</td>
        <td style="padding:14px 0;border-bottom:1px solid #f0ede8;font-size:13px;color:#1A212B;font-family:'Inter',Arial,sans-serif;text-align:right">${value}</td>
      </tr>`

  const rowHtml    = rows.map(makeRow).join('')
  const feeRowHtml = feeRows.map(makeRow).join('')

  const balanceNote = opts.isDeposit
    ? `<p style="font-size:12px;color:#6B6560;font-family:'Inter',Arial,sans-serif;line-height:1.6;margin:0 0 0">
        Remaining balance depends on styling, collected in person on the day.
       </p>`
    : ''

  const notesBlock = opts.notes
    ? `<tr><td style="padding:28px 48px 0">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9A9590;font-family:'Inter',Arial,sans-serif">Special Notes</p>
        <p style="margin:0;font-size:13px;color:#55504a;font-family:'Inter',Arial,sans-serif;line-height:1.6;font-style:italic">&ldquo;${opts.notes}&rdquo;</p>
      </td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>New Booking | Essakobea</title>
</head>
<body style="margin:0;padding:0;background:#f4f2ef;font-family:Georgia,serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ef;padding:48px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff">

        <!-- Top accent bar -->
        <tr><td style="background:#1A212B;height:3px;font-size:0">&nbsp;</td></tr>

        <!-- Header -->
        <tr>
          <td style="padding:48px 48px 0">
            <p style="margin:0 0 36px;font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#9A9590;font-family:'Inter',Arial,sans-serif">
              Essakobea Admin
            </p>
            <h1 style="margin:0 0 12px;font-size:36px;font-weight:300;color:#1A212B;line-height:1.15;letter-spacing:-0.5px">
              New booking,<br><em>${opts.clientName}.</em>
            </h1>
            <p style="margin:0 0 40px;font-size:14px;color:#6B6560;font-family:'Inter',Arial,sans-serif;line-height:1.6">
              A new appointment was just booked and paid for. Details below.
            </p>
          </td>
        </tr>

        <!-- Booking details table -->
        <tr>
          <td style="padding:0 48px">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${rowHtml}
            </table>
          </td>
        </tr>

        <!-- Fee breakdown -->
        <tr>
          <td style="padding:24px 48px 0">
            <p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9A9590;font-family:'Inter',Arial,sans-serif">Payment</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${feeRowHtml}
            </table>
          </td>
        </tr>

        <!-- Balance note (only for range-priced services) -->
        ${balanceNote ? `<tr><td style="padding:20px 48px 0">${balanceNote}</td></tr>` : ''}

        <!-- Special notes -->
        ${notesBlock}

        <!-- CTA -->
        <tr>
          <td style="padding:40px 48px 48px">
            <a href="${bookingsUrl}" style="display:inline-block;background:#1A212B;color:#ffffff;text-decoration:none;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:16px 32px">
              View in Admin Dashboard &rarr;
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#1A212B;padding:24px 48px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <p style="margin:0;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;font-family:'Inter',Arial,sans-serif">
                    Essakobea
                  </p>
                  <p style="margin:4px 0 0;font-size:10px;color:#9A9590;font-family:'Inter',Arial,sans-serif">
                    East Legon, Accra &nbsp;·&nbsp; essakobea.com
                  </p>
                </td>
                <td align="right">
                  <p style="margin:0;font-size:10px;color:#9A9590;font-family:'Inter',Arial,sans-serif">
                    Ref: ${ref}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}
