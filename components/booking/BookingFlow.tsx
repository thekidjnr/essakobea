"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";

// ─── Data ─────────────────────────────────────────────────────────────────────

const SERVICES = [
  {
    id: "wig-making",
    number: "01",
    name: "Wig Making",
    description: "Custom-crafted units built to your measurements",
    options: [
      { id: "frontal-wig", name: "Frontal Wig Making", price: "₵300" },
      { id: "closure-mini", name: "Closure (5×5 / 6×6 / Mini Frontal)", price: "₵250" },
      { id: "closure-standard", name: "Closure (4×4, 2×4, 2×6)", price: "₵200" },
      { id: "express", name: "Express Service", price: "₵100 – ₵300" },
      { id: "bleach", name: "Bleach Only", price: "₵100" },
      { id: "plucking", name: "Plucking Only", price: "₵100 – ₵200" },
    ],
  },
  {
    id: "installations",
    number: "02",
    name: "Installations",
    description: "Seamless lace installs and revamp services",
    options: [
      { id: "glueless-frontal", name: "Glueless Frontal", price: "₵250 – ₵450" },
      { id: "closure-install", name: "Closure (2×6, 4×4, 5×5, 6×6)", price: "₵200 – ₵550" },
      { id: "adhesive-frontal", name: "Adhesive Frontal", price: "₵300 – ₵600" },
      { id: "revamp", name: "Revamp & Treatment", price: "From ₵200" },
      { id: "wash", name: "Wash Only", price: "₵100 – ₵150" },
    ],
  },
  {
    id: "coloring",
    number: "03",
    name: "Coloring",
    description: "Rich, dimensional colour for any hair length",
    options: [
      { id: "black", name: "Black / Jet Black", price: "₵400 – ₵750" },
      { id: "blonde", name: "Simple Blonde Colors", price: "₵400 – ₵750" },
      { id: "loud-colors", name: "Loud Colors (Red, Ginger etc.)", price: "₵400 – ₵750" },
      { id: "highlights", name: "Highlights", price: "₵550 – ₵850" },
      { id: "balayage", name: "Balayage with Highlights", price: "₵650 – ₵1000" },
    ],
  },
  {
    id: "frontal-styling",
    number: "04",
    name: "Frontal Styling",
    description: "Ponytails and half-up styles on natural or relaxed hair",
    options: [
      { id: "normal-ponytail-natural", name: "Normal Ponytail — Natural Hair", price: "₵200" },
      { id: "normal-ponytail-relaxed", name: "Normal Ponytail — Relaxed Hair", price: "₵150" },
      { id: "frontal-ponytail-natural", name: "Frontal Ponytail — Natural Hair", price: "₵450" },
      { id: "frontal-ponytail-relaxed", name: "Frontal Ponytail — Relaxed Hair", price: "₵400" },
      { id: "half-up-natural", name: "Half Up Half Down — Natural Hair", price: "₵270" },
      { id: "half-up-relaxed", name: "Half Up Half Down — Relaxed Hair", price: "₵250" },
      { id: "frontal-half-up-natural", name: "Frontal Half Up Half Down — Natural Hair", price: "₵500+" },
      { id: "frontal-half-up-relaxed", name: "Frontal Half Up Half Down — Relaxed Hair", price: "₵450+" },
    ],
  },
];

const TIME_SLOTS = [
  { period: "Morning", slots: ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM"] },
  { period: "Afternoon", slots: ["12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"] },
  { period: "Evening", slots: ["4:00 PM", "5:00 PM", "6:00 PM"] },
];

const STEPS = ["Service", "Date", "Time", "Details"];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BookingState {
  serviceId: string;
  optionId: string;
  date: Date | null;
  time: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function BookingFlow() {
  const searchParams = useSearchParams();
  const preselectedService = searchParams.get("service") ?? "";

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [booking, setBooking] = useState<BookingState>({
    serviceId: preselectedService,
    optionId: "",
    date: null,
    time: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    notes: "",
  });

  // If a service was pre-selected via URL, scroll the sub-options into view
  useEffect(() => {
    if (preselectedService) {
      const el = document.getElementById("service-options");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [preselectedService]);

  const set = useCallback(
    <K extends keyof BookingState>(key: K, value: BookingState[K]) =>
      setBooking((b) => ({ ...b, [key]: value })),
    []
  );

  const canAdvance = () => {
    if (step === 0) return booking.serviceId && booking.optionId;
    if (step === 1) return !!booking.date;
    if (step === 2) return !!booking.time;
    if (step === 3) return booking.firstName && booking.phone;
    return false;
  };

  const selectedService = SERVICES.find((s) => s.id === booking.serviceId);
  const selectedOption = selectedService?.options.find((o) => o.id === booking.optionId);

  const handleSubmit = () => {
    // TODO: wire to backend
    setSubmitted(true);
  };

  if (submitted) {
    return <ConfirmationScreen booking={booking} selectedService={selectedService} selectedOption={selectedOption} />;
  }

  return (
    <div className="min-h-screen bg-paper pt-28 md:pt-36 pb-24">
      <div className="max-w-[900px] mx-auto px-6 md:px-10">

        {/* Back to services breadcrumb (when pre-selected from services page) */}
        {preselectedService && (
          <a
            href="/services"
            className="inline-flex items-center gap-2 font-sans text-[10px] tracking-widest uppercase text-ink/35 hover:text-ink transition-colors mb-10"
          >
            ← Back to Services
          </a>
        )}

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-16">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center">
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={`flex items-center gap-2 transition-all duration-300 ${
                  i < step ? "cursor-pointer opacity-40 hover:opacity-70" : "cursor-default"
                }`}
              >
                <span
                  className={`font-sans text-[10px] tabular-nums transition-colors duration-300 ${
                    i === step ? "text-ink" : "text-ink/30"
                  }`}
                >
                  0{i + 1}
                </span>
                <span
                  className={`font-sans text-[11px] tracking-widest uppercase transition-colors duration-300 ${
                    i === step ? "text-ink font-medium" : "text-ink/30"
                  }`}
                >
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && (
                <div className="mx-4 h-px w-8 md:w-12 bg-ink/15" />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[520px]">
          {step === 0 && <StepService booking={booking} set={set} />}
          {step === 1 && <StepDate booking={booking} set={set} />}
          {step === 2 && <StepTime booking={booking} set={set} />}
          {step === 3 && (
            <StepDetails
              booking={booking}
              set={set}
              selectedService={selectedService}
              selectedOption={selectedOption}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-14 pt-8 border-t border-ink/10">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="font-sans text-[11px] tracking-widest uppercase text-ink/40 hover:text-ink transition-colors flex items-center gap-2"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className={`font-sans text-[11px] tracking-widest uppercase px-8 py-4 transition-all duration-300 ${
                canAdvance()
                  ? "bg-ink text-paper hover:bg-ink/80"
                  : "bg-ink/10 text-ink/30 cursor-not-allowed"
              }`}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canAdvance()}
              className={`font-sans text-[11px] tracking-widest uppercase px-8 py-4 transition-all duration-300 ${
                canAdvance()
                  ? "bg-ink text-paper hover:bg-ink/80"
                  : "bg-ink/10 text-ink/30 cursor-not-allowed"
              }`}
            >
              Confirm Booking →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Service ──────────────────────────────────────────────────────────

function StepService({
  booking,
  set,
}: {
  booking: BookingState;
  set: <K extends keyof BookingState>(k: K, v: BookingState[K]) => void;
}) {
  const selectedService = SERVICES.find((s) => s.id === booking.serviceId);
  const hasPreselected = !!booking.serviceId;

  return (
    <div>
      <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] font-light text-ink leading-none mb-2">
        {hasPreselected ? (
          <>
            Booking <span className="italic">{selectedService?.name}.</span>
          </>
        ) : (
          <>What are you <span className="italic">booking?</span></>
        )}
      </h2>
      <p className="font-sans text-[13px] text-ink/45 font-light mb-10">
        {hasPreselected
          ? "Choose your specific treatment below, or switch to a different service."
          : "Select a service category, then choose the specific treatment."}
      </p>

      {/* Service tabs — compact when pre-selected, full cards when not */}
      {hasPreselected ? (
        <div className="flex flex-wrap gap-2 mb-10">
          {SERVICES.map((service) => (
            <button
              key={service.id}
              onClick={() => {
                set("serviceId", service.id);
                set("optionId", "");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 border font-sans text-[11px] tracking-widest uppercase transition-all duration-200 ${
                booking.serviceId === service.id
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/15 text-ink/50 hover:border-ink/40 hover:text-ink"
              }`}
            >
              <span className="text-[9px] opacity-60">{service.number}</span>
              {service.name}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
          {SERVICES.map((service) => (
            <button
              key={service.id}
              onClick={() => {
                set("serviceId", service.id);
                set("optionId", "");
              }}
              className={`text-left p-5 border transition-all duration-200 ${
                booking.serviceId === service.id
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/15 hover:border-ink/40 text-ink"
              }`}
            >
              <span
                className={`font-sans text-[9px] tracking-widest block mb-3 ${
                  booking.serviceId === service.id ? "text-paper/50" : "text-ink/30"
                }`}
              >
                {service.number}
              </span>
              <span className="font-serif text-[1.05rem] font-light leading-snug block">
                {service.name}
              </span>
              <span
                className={`font-sans text-[11px] font-light mt-1 block ${
                  booking.serviceId === service.id ? "text-paper/50" : "text-ink/40"
                }`}
              >
                {service.description}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Specific options */}
      {selectedService && (
        <div id="service-options">
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-4">
            Choose specific treatment
          </p>
          <div className="flex flex-col divide-y divide-ink/[0.07]">
            {selectedService.options.map((option) => (
              <button
                key={option.id}
                onClick={() => set("optionId", option.id)}
                className="flex items-center justify-between py-4 text-left transition-all duration-200 group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
                      booking.optionId === option.id
                        ? "border-ink bg-ink"
                        : "border-ink/25 group-hover:border-ink/50"
                    }`}
                  >
                    {booking.optionId === option.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-paper" />
                    )}
                  </div>
                  <span
                    className={`font-sans text-[13px] font-light transition-colors ${
                      booking.optionId === option.id ? "text-ink" : "text-ink/65"
                    }`}
                  >
                    {option.name}
                  </span>
                </div>
                <span className="font-sans text-[12px] text-ink/50 flex-shrink-0 ml-4">
                  {option.price}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Date ─────────────────────────────────────────────────────────────

function StepDate({
  booking,
  set,
}: {
  booking: BookingState;
  set: <K extends keyof BookingState>(k: K, v: BookingState[K]) => void;
}) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const emptyLeadingDays = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

  const monthLabel = viewDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const isPrevDisabled =
    year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="max-w-[480px]">
      <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] font-light text-ink leading-none mb-2">
        Pick a <span className="italic">date.</span>
      </h2>
      <p className="font-sans text-[13px] text-ink/45 font-light mb-10">
        Choose your preferred appointment date.
      </p>

      {/* Calendar */}
      <div>
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            disabled={isPrevDisabled}
            className={`font-sans text-[13px] px-2 py-1 transition-opacity ${
              isPrevDisabled ? "opacity-20 cursor-not-allowed" : "hover:opacity-50"
            }`}
          >
            ←
          </button>
          <span className="font-sans text-[13px] tracking-wider uppercase text-ink">
            {monthLabel}
          </span>
          <button onClick={nextMonth} className="font-sans text-[13px] px-2 py-1 hover:opacity-50 transition-opacity">
            →
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <span
              key={d}
              className="font-sans text-[10px] tracking-widest uppercase text-ink/30 text-center py-1"
            >
              {d}
            </span>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {/* Leading empty cells */}
          {Array.from({ length: emptyLeadingDays }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = new Date(year, month, i + 1);
            const isPast = day < today;
            const isSunday = day.getDay() === 0;
            const isSelected =
              booking.date?.toDateString() === day.toDateString();
            const isToday = day.toDateString() === today.toDateString();
            const disabled = isPast || isSunday;

            return (
              <button
                key={i}
                disabled={disabled}
                onClick={() => set("date", day)}
                className={`aspect-square flex items-center justify-center font-sans text-[13px] transition-all duration-150 relative ${
                  isSelected
                    ? "bg-ink text-paper"
                    : disabled
                    ? "text-ink/15 cursor-not-allowed"
                    : "text-ink hover:bg-ink/8"
                } ${isToday && !isSelected ? "font-medium" : ""}`}
              >
                {i + 1}
                {isToday && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ink" />
                )}
              </button>
            );
          })}
        </div>

        <p className="font-sans text-[10px] text-ink/30 mt-4">
          We are closed on Sundays.
        </p>
      </div>

      {/* Selected date display */}
      {booking.date && (
        <div className="mt-8 pt-6 border-t border-ink/10">
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-1">
            Selected Date
          </p>
          <p className="font-serif text-[1.4rem] font-light text-ink">
            {booking.date.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Step 3: Time ─────────────────────────────────────────────────────────────

function StepTime({
  booking,
  set,
}: {
  booking: BookingState;
  set: <K extends keyof BookingState>(k: K, v: BookingState[K]) => void;
}) {
  return (
    <div className="max-w-[560px]">
      <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] font-light text-ink leading-none mb-2">
        Choose a <span className="italic">time.</span>
      </h2>
      <p className="font-sans text-[13px] text-ink/45 font-light mb-10">
        {booking.date
          ? booking.date.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })
          : "Select a time slot for your appointment."}
      </p>

      <div className="flex flex-col gap-8">
        {TIME_SLOTS.map((group) => (
          <div key={group.period}>
            <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/35 mb-3">
              {group.period}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {group.slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => set("time", slot)}
                  className={`py-3 px-4 font-sans text-[12px] tracking-wide border transition-all duration-200 ${
                    booking.time === slot
                      ? "bg-ink text-paper border-ink"
                      : "border-ink/15 text-ink/65 hover:border-ink/40 hover:text-ink"
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 4: Details ──────────────────────────────────────────────────────────

function StepDetails({
  booking,
  set,
  selectedService,
  selectedOption,
}: {
  booking: BookingState;
  set: <K extends keyof BookingState>(k: K, v: BookingState[K]) => void;
  selectedService: (typeof SERVICES)[0] | undefined;
  selectedOption: (typeof SERVICES)[0]["options"][0] | undefined;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Form */}
      <div>
        <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] font-light text-ink leading-none mb-2">
          Your <span className="italic">details.</span>
        </h2>
        <p className="font-sans text-[13px] text-ink/45 font-light mb-10">
          We&apos;ll use these to confirm your appointment.
        </p>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="First Name"
              required
              value={booking.firstName}
              onChange={(v) => set("firstName", v)}
              placeholder="Akua"
            />
            <Field
              label="Last Name"
              value={booking.lastName}
              onChange={(v) => set("lastName", v)}
              placeholder="Mensah"
            />
          </div>

          <Field
            label="Phone Number"
            required
            type="tel"
            value={booking.phone}
            onChange={(v) => set("phone", v)}
            placeholder="055 720 5803"
          />

          <Field
            label="Email Address"
            type="email"
            value={booking.email}
            onChange={(v) => set("email", v)}
            placeholder="akua@email.com"
          />

          <div>
            <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">
              Notes <span className="normal-case not-italic text-ink/25">(optional)</span>
            </label>
            <textarea
              value={booking.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Hair length, texture, any preferences..."
              rows={3}
              className="w-full border border-ink/15 px-4 py-3 font-sans text-[13px] text-ink placeholder:text-ink/25 font-light focus:outline-none focus:border-ink transition-colors resize-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Booking summary */}
      <div className="md:pt-16">
        <div className="bg-mist p-8">
          <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-6">
            Booking Summary
          </p>

          <div className="flex flex-col gap-5">
            <SummaryRow
              label="Service"
              value={selectedService?.name ?? "—"}
            />
            <SummaryRow
              label="Treatment"
              value={selectedOption?.name ?? "—"}
            />
            <SummaryRow
              label="Price"
              value={selectedOption?.price ?? "—"}
            />
            <div className="h-px bg-ink/10" />
            <SummaryRow
              label="Date"
              value={
                booking.date
                  ? booking.date.toLocaleDateString("en-GB", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "—"
              }
            />
            <SummaryRow label="Time" value={booking.time || "—"} />
            <div className="h-px bg-ink/10" />
            <SummaryRow
              label="Location"
              value="Accra, East Legon"
            />
          </div>

          <p className="font-sans text-[11px] text-ink/35 font-light mt-8 leading-relaxed">
            We will confirm your booking via phone or WhatsApp within 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Confirmation screen ──────────────────────────────────────────────────────

function ConfirmationScreen({
  booking,
  selectedService,
  selectedOption,
}: {
  booking: BookingState;
  selectedService: (typeof SERVICES)[0] | undefined;
  selectedOption: (typeof SERVICES)[0]["options"][0] | undefined;
}) {
  return (
    <div className="min-h-screen bg-paper pt-28 md:pt-36 pb-24 flex items-center">
      <div className="max-w-[600px] mx-auto px-6 md:px-10 text-center">
        <p className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 mb-6">
          Booking Received
        </p>
        <h2 className="font-serif text-[clamp(2.5rem,6vw,5rem)] font-light text-ink leading-none mb-6">
          You&apos;re all set,{" "}
          <span className="italic">{booking.firstName}.</span>
        </h2>
        <p className="font-sans text-[13px] text-ink/50 font-light leading-relaxed mb-12 max-w-sm mx-auto">
          Your request for{" "}
          <span className="text-ink">{selectedOption?.name}</span> on{" "}
          <span className="text-ink">
            {booking.date?.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
            })}
          </span>{" "}
          at <span className="text-ink">{booking.time}</span> has been received.
          We&apos;ll confirm via WhatsApp shortly.
        </p>

        {/* Summary card */}
        <div className="bg-mist p-8 text-left mb-10">
          <div className="flex flex-col gap-4">
            <SummaryRow label="Service" value={selectedService?.name ?? "—"} />
            <SummaryRow label="Treatment" value={selectedOption?.name ?? "—"} />
            <SummaryRow label="Price" value={selectedOption?.price ?? "—"} />
            <div className="h-px bg-ink/10" />
            <SummaryRow
              label="Date"
              value={
                booking.date?.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }) ?? "—"
              }
            />
            <SummaryRow label="Time" value={booking.time} />
            <div className="h-px bg-ink/10" />
            <SummaryRow label="Contact" value={booking.phone} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/"
            className="inline-block bg-ink text-paper font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink/80 transition-colors"
          >
            Back to Home
          </a>
          <a
            href="https://wa.me/233557205803"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-ink text-ink font-sans text-[11px] tracking-widest uppercase px-8 py-4 hover:bg-ink hover:text-paper transition-all"
          >
            Message Us
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="font-sans text-[10px] tracking-widest2 uppercase text-ink/40 block mb-2">
        {label}{" "}
        {required && <span className="text-ink/60">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-ink/15 px-4 py-3 font-sans text-[13px] text-ink placeholder:text-ink/25 font-light focus:outline-none focus:border-ink transition-colors bg-transparent"
      />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-sans text-[10px] tracking-widest uppercase text-ink/35 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="font-sans text-[13px] text-ink font-light text-right">
        {value}
      </span>
    </div>
  );
}
