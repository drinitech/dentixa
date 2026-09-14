"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/common/loading-spinner";
import { useAuth } from "@/lib/auth-context";
import { useInvitePreview } from "@/hooks/use-invite";
import { ApiError } from "@/lib/api-client";
import { roleHome } from "@/components/layout/nav-items";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "owner",
  RECEPTIONIST: "receptionist",
  DOCTOR: "doctor",
  PATIENT: "patient",
};

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { acceptInvite } = useAuth();
  const { data: preview, isLoading, isError } = useInvitePreview(token);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { user, tenantSlug } = await acceptInvite(token, {
        name: preview?.existingAccount ? undefined : name,
        password,
      });
      if (!tenantSlug) {
        toast.error("Joined, but couldn't determine the clinic's URL. Contact support.");
        return;
      }
      toast.success(`Welcome to ${preview?.clinicName ?? "your new clinic"}`);
      router.push(roleHome(tenantSlug, user.role));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Could not accept this invite");
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <PageLoading />
        </CardContent>
      </Card>
    );
  }

  if (isError || !preview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invite not found</CardTitle>
          <CardDescription>This invite link is invalid, expired, or already used.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join {preview.clinicName}</CardTitle>
        <CardDescription>
          You've been invited as {ROLE_LABELS[preview.role] ?? preview.role.toLowerCase()} — {preview.email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {!preview.existingAccount && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                autoComplete="name"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="password">
              {preview.existingAccount ? "Password (confirm your account)" : "Create a password"}
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete={preview.existingAccount ? "current-password" : "new-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Joining…" : "Accept invite"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
