"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const supabase = getBrowserSupabase();
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    });
    if (error) { setError(error.message); setLoading(false); return; }
    setDone(true); setLoading(false);
  }

  if (done) {
    return (
      <main className="min-h-screen grid place-items-center p-6 text-center">
        <div className="max-w-sm space-y-3">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-[var(--text-soft)]">We sent a confirmation link to <b>{email}</b>. Open it to finish signing up.</p>
          <p className="text-sm text-[var(--text-faint)]">After confirming, ask your admin to assign you to a tenant.</p>
          <Button onClick={() => router.push("/sign-in")}>Back to sign in</Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-sm text-[var(--text-soft)]">14-day trial · no card required</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6 rounded-2xl border"
          style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "var(--shadow-md)" }}>
          <div className="space-y-2">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-[var(--color-status-overdue)]">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-[var(--text-soft)]">
          Already have an account? <Link href="/sign-in" className="text-[var(--color-accent)] font-medium">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
