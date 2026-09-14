"use client";

import Link from "next/link";
import { CalendarCheck, Clock, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageLoading } from "@/components/common/loading-spinner";
import { Avatar } from "@/components/common/avatar";
import { StarRating } from "@/components/appointments/star-rating";
import { usePublicClinic, usePublicDoctors, usePublicServices } from "@/hooks/use-public-clinic";
import type { ClinicService } from "@/types";

function formatPrice(price: ClinicService["price"]): string | null {
  if (price === null || price === undefined) return null;
  return `$${Number(price).toFixed(2)}`;
}

export default function ClinicPublicPage() {
  const { data: clinicData, isLoading: clinicLoading, isError: clinicError } = usePublicClinic();
  const { data: doctorsData } = usePublicDoctors();
  const { data: servicesData } = usePublicServices();

  if (clinicLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <PageLoading />
      </main>
    );
  }

  if (clinicError || !clinicData) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Clinic not found</h1>
        <p className="mt-2 text-muted-foreground">This clinic doesn&apos;t exist or is no longer active.</p>
        <Link href="/" className={buttonVariants("outline", "sm", "mt-6")}>
          Back to Dentixa
        </Link>
      </main>
    );
  }

  const clinic = clinicData.clinic;

  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary font-semibold text-primary-foreground">
            {clinic.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-lg font-semibold tracking-tight">{clinic.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Log in
          </Link>
          <Link href={`/c/${clinic.slug}/register`} className={buttonVariants("primary", "sm")}>
            Book now
          </Link>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 py-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">{clinic.name}</h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          See open slots in real time, request an appointment, and get notified the moment it&apos;s confirmed.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href={`/c/${clinic.slug}/register`} className={buttonVariants("primary", "lg")}>
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

      {doctorsData && doctorsData.doctors.length > 0 && (
        <section className="mx-auto w-full max-w-5xl px-6 py-12">
          <h2 className="text-center text-2xl font-semibold text-foreground">Our doctors</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {doctorsData.doctors.map((doctor) => (
              <div key={doctor.id} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center">
                <Avatar src={doctor.avatarUrl} name={doctor.name} size="lg" />
                <p className="text-sm font-medium text-foreground">{doctor.name}</p>
                {doctor.specialty && <p className="text-xs text-muted-foreground">{doctor.specialty}</p>}
                {doctor.averageRating != null && (
                  <div className="flex items-center gap-1">
                    <StarRating value={doctor.averageRating} size="sm" />
                    <span className="text-xs text-muted-foreground">({doctor.reviewCount})</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {servicesData && servicesData.services.length > 0 && (
        <section className="mx-auto w-full max-w-3xl px-6 pb-20">
          <h2 className="text-center text-2xl font-semibold text-foreground">Services</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {servicesData.services.map((service) => {
              const price = formatPrice(service.price);
              return (
                <span
                  key={service.id}
                  className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-foreground"
                >
                  {service.name}
                  <span className="ml-1.5 text-xs text-muted-foreground">
                    {service.durationMinutes}min{price ? ` · ${price}` : ""}
                  </span>
                </span>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
