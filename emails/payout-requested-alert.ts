export function payoutRequestedAlertHtml(opts: {
  amountGHS:   number
  requestedBy: string | null
  notes?:      string | null
  destination: {
    method:          'momo' | 'bank'
    account_name:    string
    momo_number?:    string | null
    momo_network?:   string | null
    bank_name?:      string | null
    account_number?: string | null
  }
  appUrl: string
}): string {
  const payoutsUrl = `${opts.appUrl}/admin/payouts`
  const destLine    = opts.destination.method === 'momo'
    ? `${opts.destination.account_name} · ${(opts.destination.momo_network ?? '').toUpperCase()} ${opts.destination.momo_number ?? ''}`
    : `${opts.destination.account_name} · ${opts.destination.bank_name ?? ''} ${opts.destination.account_number ?? ''}`

  const rows: [string, string][] = [
    ['Amount',      `₵${opts.amountGHS.toLocaleString()}`],
    ['Requested by', opts.requestedBy ?? '—'],
    ['Destination', destLine],
  ]

  const makeRow = ([label, value]: [string, string]) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid #f0ede8;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9A9590;font-family:'Inter',Arial,sans-serif;white-space:nowrap;padding-right:24px">${label}</td>
        <td style="padding:14px 0;border-bottom:1px solid #f0ede8;font-size:13px;color:#1A212B;font-family:'Inter',Arial,sans-serif;text-align:right">${value}</td>
      </tr>`

  const rowHtml = rows.map(makeRow).join('')

  const notesBlock = opts.notes
    ? `<tr><td style="padding:28px 48px 0">
        <p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#9A9590;font-family:'Inter',Arial,sans-serif">Note</p>
        <p style="margin:0;font-size:13px;color:#55504a;font-family:'Inter',Arial,sans-serif;line-height:1.6;font-style:italic">&ldquo;${opts.notes}&rdquo;</p>
      </td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Withdrawal Requested | Essakobea</title>
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
              Withdrawal<br><em>requested.</em>
            </h1>
            <p style="margin:0 0 40px;font-size:14px;color:#6B6560;font-family:'Inter',Arial,sans-serif;line-height:1.6">
              Essakobea just requested a payout. Review and process it when ready.
            </p>
          </td>
        </tr>

        <!-- Details table -->
        <tr>
          <td style="padding:0 48px">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${rowHtml}
            </table>
          </td>
        </tr>

        <!-- Note -->
        ${notesBlock}

        <!-- CTA -->
        <tr>
          <td style="padding:40px 48px 48px">
            <a href="${payoutsUrl}" style="display:inline-block;background:#1A212B;color:#ffffff;text-decoration:none;font-family:'Inter',Arial,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;padding:16px 32px">
              Review in Admin Dashboard &rarr;
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
