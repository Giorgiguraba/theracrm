"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutAndRefresh() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      onClick={() => {
        start(async () => {
          const supabase = getBrowserSupabase();
          await supabase.auth.signOut();
          router.push("/sign-in");
          router.refresh();
        });
      }}
      disabled={pending}
      className="w-full"
    >
      {pending ? "Signing out…" : "Sign out & sign in again"}
    </Button>
  );
}
