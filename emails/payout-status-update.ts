export function payoutStatusUpdateHtml(opts: {
  status:           'approved' | 'rejected' | 'paid'
  amountGHS:        number
  rejectedReason?:  string | null
  payoutReference?: string | null
  appUrl:           string
}): string {
  const payoutsUrl = `${opts.appUrl}/admin/payouts`

  const copy = {
    approved: {
      title:   'Withdrawal<br><em>approved.</em>',
      lede:    `Your withdrawal request for ₵${opts.amountGHS.toLocaleString()} has been approved and is being processed.`,
    },
    paid: {
      title:   'Withdrawal<br><em>sent.</em>',
      lede:    `₵${opts.amountGHS.toLocaleString()} has been sent to your account.${opts.payoutReference ? ` Reference: ${opts.payoutReference}` : ''}`,
    },
    rejected: {
      title:   'Withdrawal<br><em>declined.</em>',
      lede:    `Your withdrawal request for ₵${opts.amountGHS.toLocaleString()} was declined.${opts.rejectedReason ? ` Reason: ${opts.rejectedReason}` : ''}`,
    },
  }[opts.status]

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Withdrawal Update | Essakobea</title>
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
              ${copy.title}
            </h1>
            <p style="margin:0 0 40px;font-size:14px;color:#6B6560;font-family:'Inter',Arial,sans-serif;line-height:1.6">
              ${copy.lede}
            </p>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:0 48px 48px">
            <a href="${payoutsUrl}" style="display:inline-block;background:#1A212B;color:#ffffff;text-decoration:none;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:16px 32px">
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
