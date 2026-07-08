"use client";

import { useRef, useState } from "react";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "./avatar";
import { resizeImageToDataUrl } from "@/lib/image";
import { useUpdateAvatar } from "@/hooks/use-avatar";
import { ApiError } from "@/lib/api-client";

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB raw upload cap, before client-side resize

export function AvatarUpload({
  src,
  name,
  onUploaded,
}: {
  src?: string | null;
  name: string;
  onUploaded: (avatarUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null | undefined>(src);
  const updateAvatar = useUpdateAvatar();

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("Image is too large (max 8MB)");
      return;
    }

    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setPreviewSrc(dataUrl);
      const result = await updateAvatar.mutateAsync(dataUrl);
      onUploaded(result.user.avatarUrl ?? dataUrl);
      toast.success("Profile picture updated");
    } catch (err) {
      setPreviewSrc(src);
      toast.error(err instanceof ApiError ? err.message : "Could not update profile picture");
    }
  }

  return (
    <div className="relative inline-block">
      <Avatar src={previewSrc} name={name} size="lg" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={updateAvatar.isPending}
        aria-label="Change profile picture"
        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 disabled:opacity-60"
      >
        {updateAvatar.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
