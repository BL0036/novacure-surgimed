import type { Metadata } from "next";
import { loginAction } from "@/lib/admin/actions/auth";
import { Label, Input } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Log in" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-sm flex-col justify-center px-6 py-20">
      <p className="text-sm font-medium text-brand">NovaCure Admin</p>
      <h1 className="text-page-title mt-2">Log in</h1>

      {error ? (
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
