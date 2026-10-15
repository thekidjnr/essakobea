import { redirect } from "next/navigation";

// Older confirmation emails link here. Cancelling now lives on the manage
// booking page, alongside rescheduling.
export default async function CancelRedirect({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/manage/${token}?view=cancel`);
}
