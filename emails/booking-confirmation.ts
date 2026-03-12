export function bookingConfirmationHtml(opts: {
  clientName:         string
  serviceName:        string
  treatment:          string
  bookingDate:        string
  timeSlot:           string
  depositGHS:         number
  isDeposit:          boolean   // true = deposit for range price; false = full payment
  stylistName?:       string | null
  bookingId:          string
  cancelToken:        string
  appUrl:             string
  customizationType?: string | null
  isEmergency?:       boolean
  customizationFee?:  number
  emergencyFee?:      number
  serviceCharge?:     number
}): string {
  const cancelUrl  = `${opts.appUrl}/cancel/${opts.cancelToken}`
  const ref        = opts.bookingId.slice(0, 8).toUpperCase()
  const amountLine = opts.isDeposit
    ? `₵${opts.depositGHS} deposit paid`
    : `₵${opts.depositGHS} paid in full`

  const custLabel = opts.customizationType === 'standard' ? 'Standard (drop off 48–72 hrs before)'
                  : opts.customizationType === 'express'  ? 'Express (bring unit on the day)'
                  : null

  const rows = [
    ['Service',   opts.serviceName],
    ['Treatment', opts.treatment],
    opts.stylistName ? ['Stylist', opts.stylistName] : null,
    ['Date',      opts.bookingDate],
    ['Time',      opts.timeSlot],
    opts.isEmergency ? ['Booking Type', '⚡ Emergency — Priority Handling'] : null,
    custLabel ? ['Customization', custLabel] : null,
    ['Location',  'East Legon, Accra'],
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

  const depositNote = opts.isDeposit
    ? `<p style="font-size:11px;color:#9A9590;font-family:'Inter',Arial,sans-serif;line-height:1.6;margin:0 0 0">
        The remaining balance is due on the day of your appointment.
       </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Booking Confirmed — Essakobea</title>
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
              Essakobea
            </p>
            <h1 style="margin:0 0 12px;font-size:36px;font-weight:300;color:#1A212B;line-height:1.15;letter-spacing:-0.5px">
              You&rsquo;re all set,<br><em>${opts.clientName}.</em>
            </h1>
            <p style="margin:0 0 40px;font-size:13px;color:#9A9590;font-family:'Inter',Arial,sans-serif;line-height:1.6">
              Your appointment is confirmed. We&rsquo;ll reach out on WhatsApp ahead of your visit.
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

        <!-- Deposit note (only for range-priced services) -->
        ${depositNote ? `<tr><td style="padding:20px 48px 0">${depositNote}</td></tr>` : ''}

        <!-- Divider -->
        <tr><td style="padding:40px 48px 0"><hr style="border:none;border-top:1px solid #f0ede8;margin:0"></td></tr>

        <!-- Policies -->
        <tr>
          <td style="padding:32px 48px">
            <p style="margin:0 0 14px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9A9590;font-family:'Inter',Arial,sans-serif">
              Good to Know
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f8f6f3;vertical-align:top;width:20px">
                  <span style="font-size:14px;color:#1A212B">·</span>
                </td>
                <td style="padding:10px 0 10px 10px;border-bottom:1px solid #f8f6f3;font-size:12px;color:#6B6560;font-family:'Inter',Arial,sans-serif;line-height:1.6">
                  <strong style="color:#1A212B;font-weight:500">Free cancellation</strong> up to 24 hours before your appointment. After that, the deposit is non-refundable.
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f8f6f3;vertical-align:top;width:20px">
                  <span style="font-size:14px;color:#1A212B">·</span>
                </td>
                <td style="padding:10px 0 10px 10px;border-bottom:1px solid #f8f6f3;font-size:12px;color:#6B6560;font-family:'Inter',Arial,sans-serif;line-height:1.6">
                  <strong style="color:#1A212B;font-weight:500">Please arrive 5 minutes early.</strong> Late arrivals beyond 15 minutes may result in a shortened session or rescheduling.
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f8f6f3;vertical-align:top;width:20px">
                  <span style="font-size:14px;color:#1A212B">·</span>
                </td>
                <td style="padding:10px 0 10px 10px;border-bottom:1px solid #f8f6f3;font-size:12px;color:#6B6560;font-family:'Inter',Arial,sans-serif;line-height:1.6">
                  <strong style="color:#1A212B;font-weight:500">Rescheduling</strong> is available up to 48 hours before your appointment — just reach out on WhatsApp.
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;vertical-align:top;width:20px">
                  <span style="font-size:14px;color:#1A212B">·</span>
                </td>
                <td style="padding:10px 0 10px 10px;font-size:12px;color:#6B6560;font-family:'Inter',Arial,sans-serif;line-height:1.6">
                  Questions? Message us on <strong style="color:#1A212B;font-weight:500">WhatsApp at +233 55 720 5803</strong> or reply to this email.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Cancel CTA -->
        <tr>
          <td style="padding:0 48px 48px">
            <p style="margin:0;font-size:11px;color:#B0ABA5;font-family:'Inter',Arial,sans-serif;line-height:1.8">
              Need to cancel?
              <a href="${cancelUrl}" style="color:#1A212B;text-decoration:underline">Cancel this appointment →</a>
            </p>
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
