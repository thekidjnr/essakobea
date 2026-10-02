"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";
import Image from "next/image";
import { homeImages, logo } from "@/public/images";
import { Button, Field, ErrorNote, inputClass } from "@/components/admin/ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Only follow same-site admin paths, never an off-site URL.
  const requested = searchParams.get("next") ?? "";
  const next = /^\/admin(\/|$)/.test(requested) ? requested : "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(next);
    }
  };

  return (
    <div className="min-h-screen bg-paper md:grid md:grid-cols-2">
      {/* Photo: full height on md+, a rounded band on mobile */}
      <div className="relative h-[220px] md:h-auto md:min-h-screen overflow-hidden bg-ink rounded-b-[32px] md:rounded-none">
        <Image
          src={homeImages.hero}
          alt=""
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover opacity-40 md:opacity-100"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/25 to-transparent" />
        <div className="absolute top-8 left-6 md:top-10 md:left-12">
          <Image src={logo.light} alt="Essakobea" width={417} height={30} className="h-auto w-[170px] md:w-[200px]" priority />
        </div>
      </div>

      <div className="flex items-start md:items-center justify-center px-6 pt-10 pb-16 md:py-16">
        <div className="w-full max-w-sm fade-up">
          <h1 className="font-serif text-[44px] font-light text-ink leading-none mb-10">
            Welcome <span className="italic">back</span>
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className={inputClass}
                placeholder="admin@essakobea.com"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className={inputClass}
                placeholder="••••••••"
              />
            </Field>

            <ErrorNote>{error}</ErrorNote>

            <Button type="submit" disabled={loading} className="w-full h-12 mt-2">
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
