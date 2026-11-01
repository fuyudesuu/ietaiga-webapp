"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageHeading,
  formErrorClass,
  panelClass,
} from "@/components/encore-ui/ui";
import { cn } from "@/lib/utils";
import { safeReturnPath } from "../domain/return-path";

// Messages for the fixed error codes the auth routes send. Anything else in
// the address is ignored, so the page never echoes attacker-chosen text.
const errorMessages: Record<string, string> = {
  start: "Discord sign-in couldn't start. Please try again.",
  cancelled: "Sign-in was cancelled on Discord. Nothing was changed.",
  failed: "Sign-in didn't complete. Please try again.",
  signout:
    "You're signed out on this browser, but the server didn't confirm it. Sign in and out again to be sure.",
};

function SignInForm() {
  const params = useSearchParams();
  const error = errorMessages[params.get("error") ?? ""];
  return (
    <div className={cn(panelClass, "max-w-md p-6")}>
      {error && (
        <p className={cn(formErrorClass, "mb-4 flex gap-2")} role="alert">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </p>
      )}
      <form method="post" action="/auth/sign-in">
        <input
          type="hidden"
          name="next"
          value={safeReturnPath(params.get("next"))}
        />
        <Button type="submit" className="primary-button w-full">
          Continue with Discord
        </Button>
      </form>
      <p className="mt-4 text-small leading-relaxed text-muted-foreground">
        Encore asks Discord who you are (your name and email address). It can’t
        read your servers or messages, and reminders are set up separately.
      </p>
    </div>
  );
}

export function SignIn() {
  return (
    <>
      <PageHeading
        title="Sign in"
        subtitle="Your plans, private to you, on every device."
      />
      <Suspense>
        <SignInForm />
      </Suspense>
    </>
  );
}
