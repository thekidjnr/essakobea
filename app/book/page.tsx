import type { Metadata } from "next";
import { Suspense } from "react";
import Nav from "@/components/layout/Nav";
import BookingFlow from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Book an Appointment — Essakobea",
  description: "Book a professional beauty appointment in Accra, East Legon.",
};

export default function BookPage() {
  return (
    <>
      <Nav />
      <Suspense fallback={<div className="min-h-screen bg-paper" />}>
        <BookingFlow />
      </Suspense>
    </>
  );
}
