export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-accent/40 to-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
            D
          </div>
          <span className="text-xl font-semibold tracking-tight text-foreground">Dentixa</span>
          <p className="text-sm text-muted-foreground">Your dental clinic, made simple.</p>
        </div>
        {children}
      </div>
    </div>
  );
}
