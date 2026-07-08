"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useResetPassword } from "@/hooks/use-password-reset";
import { ApiError } from "@/lib/api-client";

export function ResetPasswordForm() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const resetPassword = useResetPassword();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await resetPassword.mutateAsync({ token, newPassword });
      toast.success("Password reset — you can log in now");
      router.push("/login");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "This reset link is invalid or has expired");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset password</CardTitle>
        <CardDescription>Choose a new password for your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {!token ? (
          <p className="text-sm text-muted-foreground">
            This link is missing its reset token. Request a new one from the{" "}
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              forgot password
            </Link>{" "}
            page.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
              {resetPassword.isPending ? "Resetting…" : "Reset password"}
            </Button>
          </form>
        )}
        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
