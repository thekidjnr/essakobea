function emailList(value: string | undefined) {
  return (value ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
}

// Who may use the admin dashboard. Being signed in to Supabase is not enough:
// the anon key is public, so anyone could sign up an account. Admins are
// ADMIN_EMAILS (comma-separated) plus the payout operators. When ADMIN_EMAILS
// is unset we fall back to ADMIN_EMAIL, the salon's shared login.
export function adminEmails() {
  const explicit = emailList(process.env.ADMIN_EMAILS)
  const base = explicit.length > 0 ? explicit : emailList(process.env.ADMIN_EMAIL)
  return Array.from(new Set([...base, ...emailList(process.env.OPERATOR_EMAILS)]))
}

export function isAdminEmail(email: string | null | undefined) {
  return !!email && adminEmails().includes(email.toLowerCase())
}

export function isOperatorEmail(email: string | null | undefined) {
  return !!email && emailList(process.env.OPERATOR_EMAILS).includes(email.toLowerCase())
}
