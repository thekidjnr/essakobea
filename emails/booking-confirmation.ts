import { cancellationPolicyText } from '@/lib/refunds'
import { reschedulePolicyText } from '@/lib/reschedule-rules'
import type { ServicePolicy } from '@/lib/policies'

const escapeHtml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

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
  /** Worded for the service, from customizationLabel() in lib/service-rules */
  customizationLabel?: string | null
  isEmergency?:       boolean
  /** Chosen stylist's fee (negative for a discount), charged on top of the service price */
  stylistFee?:        number
  customizationFee?:  number
  emergencyFee?:      number
  serviceCharge?:     number
  bundleCount?:       number | null
  /** When a dropped-off unit should be ready, from formatReadyEstimate() in lib/service-rules */
  readyEstimate?:     string | null
  /** Home service address; null for salon appointments */
  homeAddress?:       string | null
  /** Manual bookings (added in the admin) know their full price and may be part paid or unpaid */
  manualPayment?:     { totalGHS: number; paidGHS: number; travelGHS: number; method: string | null } | null
  /** Extra terms the client agreed to when booking, e.g. the colouring policy */
  servicePolicy?:     ServicePolicy | null
}): string {
  const manageUrl  = `${opts.appUrl}/manage/${opts.cancelToken}`
  const ref        = opts.bookingId.slice(0, 8).toUpperCase()
  const amountLine = opts.isDeposit
    ? `₵${opts.depositGHS} deposit paid`
    : `₵${opts.depositGHS} paid in full`

  const custLabel = opts.customizationLabel ?? null

  const rows = [
    ['Service',   opts.serviceName],
    ['Treatment', opts.treatment],
    opts.stylistName ? ['Stylist', opts.stylistName] : null,
    [opts.readyEstimate ? 'Drop-off Date' : 'Date', opts.bookingDate],
    [opts.readyEstimate ? 'Drop-off Time' : 'Time', opts.timeSlot],
    opts.readyEstimate ? ['Estimated Ready', opts.readyEstimate] : null,
    opts.isEmergency ? ['Booking Type', '⚡ Emergency (Priority Handling)'] : null,
    custLabel ? ['Customization', custLabel] : null,
    opts.bundleCount ? ['Extensions', `Bringing ${opts.bundleCount} bundle${opts.bundleCount > 1 ? 's' : ''}`] : null,
    ['Location',  opts.homeAddress != null ? `Home service${opts.homeAddress ? `: ${escapeHtml(opts.homeAddress)}` : ''}` : 'East Legon, Accra'],
    ['Booking Ref', ref],
  ].filter(Boolean) as [string, string][]

  // Fee breakdown lines (only shown when there are add-ons)
  const stylistFee = opts.stylistFee ?? 0
  const hasAddOns = stylistFee !== 0 || (opts.customizationFee ?? 0) > 0 || (opts.emergencyFee ?? 0) > 0 || (opts.serviceCharge ?? 0) > 0
  const baseAmount = opts.depositGHS - stylistFee - (opts.customizationFee ?? 0) - (opts.emergencyFee ?? 0) - (opts.serviceCharge ?? 0)

  const manual = opts.manualPayment ?? null
  const balanceGHS = manual ? Math.max(0, manual.totalGHS - manual.paidGHS) : 0
  const feeRows: [string, string][] = manual ? ([
    manual.travelGHS > 0 ? ['Service', `₵${manual.totalGHS - manual.travelGHS}`] : null,
    manual.travelGHS > 0 ? ['Travel fee', `+₵${manual.travelGHS}`] : null,
    ['Total', `₵${manual.totalGHS}`],
    manual.paidGHS > 0 ? [`Paid${manual.method ? ` (${manual.method})` : ''}`, `₵${manual.paidGHS}`] : null,
    balanceGHS > 0 ? ['Balance Due', `₵${balanceGHS}`] : null,
  ].filter(Boolean) as [string, string][]) : hasAddOns ? [
    ['Service / Deposit', `₵${baseAmount}`] as [string, string],
    ...(stylistFee ? [[stylistFee > 0 ? 'Stylist fee' : 'Stylist discount', `${stylistFee > 0 ? '+' : '−'}₵${Math.abs(stylistFee)}`] as [string, string]] : []),
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

  const depositNote = manual
    ? (balanceGHS > 0
        ? `<p style="font-size:12px;color:#6B6560;font-family:'Inter',Arial,sans-serif;line-height:1.6;margin:0 0 0">
        ${manual.paidGHS > 0 ? `The balance of ₵${balanceGHS} is` : `Payment of ₵${balanceGHS} is`} due on the day of your appointment.
       </p>`
        : '')
    : opts.isDeposit
    ? `<p style="font-size:12px;color:#6B6560;font-family:'Inter',Arial,sans-serif;line-height:1.6;margin:0 0 0">
        The remaining balance is due on the day of your appointment.${stylistFee > 0 ? ` The ₵${stylistFee} stylist fee is added on top of your service price and is not deducted from your balance.` : ''}
       </p>`
    : ''

  const text = `font-size:13px;color:#55504a;font-family:'Inter',Arial,sans-serif;line-height:1.6`
  const policy = opts.servicePolicy
  const policyHtml = policy ? `
        <tr><td style="padding:0 48px"><hr style="border:none;border-top:1px solid #f0ede8;margin:0"></td></tr>
        <tr>
          <td style="padding:32px 48px">
            <p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9A9590;font-family:'Inter',Arial,sans-serif">${policy.title}</p>
            <p style="margin:0 0 16px;${text}">${policy.intro}</p>
            ${policy.sections.map((section) => [
              section.heading ? `<p style="margin:20px 0 8px;font-size:13px;font-weight:500;color:#1A212B;font-family:'Inter',Arial,sans-serif">${section.heading}</p>` : '',
              ...(section.paragraphs ?? []).map((p) => `<p style="margin:0 0 10px;${text}">${p}</p>`),
              section.bullets ? `<ul style="margin:0 0 10px;padding-left:18px">${section.bullets.map((b) => `<li style="margin:0 0 8px;${text}">${b}</li>`).join('')}</ul>` : '',
              section.numbered ? `<ol style="margin:0 0 10px;padding-left:18px">${section.numbered.map((n) => `<li style="margin:0 0 6px;${text}">${n}</li>`).join('')}</ol>` : '',
              ...(section.after ?? []).map((p) => `<p style="margin:0 0 10px;${text}">${p}</p>`),
            ].join('')).join('')}
            <p style="margin:16px 0 0;font-size:13px;font-weight:500;color:#1A212B;font-family:'Inter',Arial,sans-serif;line-height:1.6">${policy.closing}</p>
          </td>
        </tr>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Booking Confirmed | Essakobea</title>
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
            <p style="margin:0 0 40px;font-size:14px;color:#6B6560;font-family:'Inter',Arial,sans-serif;line-height:1.6">
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
                <td style="padding:10px 0 10px 10px;border-bottom:1px solid #f8f6f3;font-size:13px;color:#55504a;font-family:'Inter',Arial,sans-serif;line-height:1.6">
                  <strong style="color:#1A212B;font-weight:500">Cancellations.</strong> ${cancellationPolicyText(opts.isDeposit ? 'deposit' : 'payment')}
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f8f6f3;vertical-align:top;width:20px">
                  <span style="font-size:14px;color:#1A212B">·</span>
                </td>
                <td style="padding:10px 0 10px 10px;border-bottom:1px solid #f8f6f3;font-size:13px;color:#55504a;font-family:'Inter',Arial,sans-serif;line-height:1.6">
                  ${opts.homeAddress != null
                    ? `<strong style="color:#1A212B;font-weight:500">Please be ready when your stylist arrives.</strong> Message us on WhatsApp if your address or directions change.`
                    : `<strong style="color:#1A212B;font-weight:500">Please arrive 5 minutes early.</strong> Late arrivals beyond 15 minutes may result in a shortened session or rescheduling.`}
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f8f6f3;vertical-align:top;width:20px">
                  <span style="font-size:14px;color:#1A212B">·</span>
                </td>
                <td style="padding:10px 0 10px 10px;border-bottom:1px solid #f8f6f3;font-size:13px;color:#55504a;font-family:'Inter',Arial,sans-serif;line-height:1.6">
                  <strong style="color:#1A212B;font-weight:500">Rescheduling.</strong> ${reschedulePolicyText()} Use the link at the bottom of this email.
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;vertical-align:top;width:20px">
                  <span style="font-size:14px;color:#1A212B">·</span>
                </td>
                <td style="padding:10px 0 10px 10px;font-size:13px;color:#55504a;font-family:'Inter',Arial,sans-serif;line-height:1.6">
                  Questions? Message us on <strong style="color:#1A212B;font-weight:500">WhatsApp at +233 55 720 5803</strong> or reply to this email.
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Service policy (e.g. colouring) -->
        ${policyHtml}

        <!-- Manage CTA -->
        <tr>
          <td style="padding:0 48px 48px">
            <p style="margin:0;font-size:11px;color:#B0ABA5;font-family:'Inter',Arial,sans-serif;line-height:1.8">
              Need to change your plans?
              <a href="${manageUrl}" style="color:#1A212B;text-decoration:underline">Reschedule or cancel →</a>
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
