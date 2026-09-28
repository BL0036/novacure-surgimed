import type { Metadata } from "next";
import { loginAction } from "@/lib/admin/actions/auth";
import { Label, Input } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Log in" };

// Phase 13 §1 — locked-out attempts get their own message rather than
// the generic "incorrect email or password" one; unlike that generic
// message (deliberately vague so it doesn't confirm/deny a registered
// email), a lockout isn't secret — the person typing it already knows
// their email+IP, and telling them why they're blocked and for how long
// is more useful than making them guess whether they mistyped their
// password again.
function formatRetryAfter(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return minutes <= 1 ? "about a minute" : `about ${minutes} minutes`;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; retryAfter?: string }>;
}) {
  const { error, retryAfter } = await searchParams;
  const isLocked = error === "locked";
  const retryAfterSeconds = Number.parseInt(retryAfter ?? "", 10);

  return (
    <div className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center px-6 py-20">
      <p className="text-sm font-medium text-link">NovaCure Admin</p>
      <h1 className="text-page-title mt-2">Log in</h1>

      {isLocked ? (
        <p className="mt-4 rounded-md border border-danger bg-danger-tint px-3 py-2 text-sm text-danger">
          Too many failed attempts. Please try again in{" "}
          {Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
            ? formatRetryAfter(retryAfterSeconds)
            : "about 15 minutes"}
          .
        </p>
      ) : error ? (
        <p className="mt-4 rounded-md border border-danger bg-danger-tint px-3 py-2 text-sm text-danger">
          Incorrect email or password.
        </p>
      ) : null}

      <form action={loginAction} className="mt-6 flex flex-col gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" fullWidth>
          Log in
        </Button>
      </form>
    </div>
  );
}
