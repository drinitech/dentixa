"use client";

import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AvatarUpload } from "@/components/common/avatar-upload";
import { useAuth } from "@/lib/auth-context";

export default function AdminProfilePage() {
  const { user, patchUser } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Your admin account details." />

      <Card>
        <CardHeader>
          <CardTitle>Profile picture</CardTitle>
          <CardDescription>Shown next to your name in the admin dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-5">
          <AvatarUpload
            src={user.avatarUrl}
            name={user.name}
            onUploaded={(avatarUrl) => patchUser({ avatarUrl })}
          />
          <div>
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
