import { TenantProvider } from "@/components/providers/tenant-provider";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TenantProvider slug={slug}>{children}</TenantProvider>;
}
