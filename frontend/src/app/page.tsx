import Link from "next/link";
import { CalendarCheck, Clock, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">
            D
          </div>
          <span className="text-lg font-semibold tracking-tight">Dentixa</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Log in
          </Link>
          <Link href="/register" className={buttonVariants("primary", "sm")}>
            Get started
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Book your dental visit, without the phone call.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          See your dentist&apos;s open slots in real time, request an appointment, and get notified the moment
          it&apos;s confirmed.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/register" className={buttonVariants("primary", "lg")}>
            Create your account
          </Link>
          <Link href="/login" className={buttonVariants("outline", "lg")}>
            I already have one
          </Link>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { icon: CalendarCheck, title: "Real-time slots", desc: "Only ever request times that are actually free." },
            { icon: Clock, title: "Fast decisions", desc: "Doctors approve or decline in a couple of clicks." },
            { icon: ShieldCheck, title: "Reliable reminders", desc: "Email and SMS reminders 24h before your visit." },
          ].map((f) => (
            <div key={f.title} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5">
              <f.icon className="h-6 w-6 text-primary" />
              <p className="text-sm font-medium">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
