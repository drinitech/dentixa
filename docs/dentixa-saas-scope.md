# Dentixa SaaS — Scope i Projektit

**Versioni:** 1.0 · **Data:** 11 shtator 2026 · **Autori:** Drin Berisha

---

## 1. Përmbledhje

Dentixa SaaS e kthen sistemin ekzistues të rezervimeve (dentixa.vercel.app) nga aplikacion për një klinikë në **platformë multi-tenant**. Shumë klinika dentare regjistrohen në të njëjtën platformë dhe secila menaxhon stafin, oraret, shërbimet dhe terminet e veta, me faqen e vet publike të rezervimeve. Të dhënat e secilës klinikë janë plotësisht të izoluara nga të tjerat.

**Qëllimet:**

1. **Portfolio:** me demonstru arkitekturë reale SaaS (multi-tenancy, plane, limite, izolim të dhënash) në produksion.
2. **Upwork:** me e përmirësu listing-un në Project Catalog nga "sistem i personalizuar" në "platformë e gatshme, e konfiguruar për klinikën tuaj".
3. **E ardhmja:** bazë për klientë realë në Kosovë dhe rajon.

---

## 2. Pika e nisjes

| Pjesa | Gjendja aktuale |
|---|---|
| Frontend | Next.js / React në Vercel |
| Backend | Express + TypeScript + Prisma në Render |
| Databaza | PostgreSQL në NeonDB |
| Auth | argon2id, rotating refresh tokens |
| Rolet | patient, doctor, admin |
| Rezervimet | slot booking i sigurt ndaj race conditions (DB transactions) |
| Njoftimet | NotificationService (email/SMS/push sipas preferencës) |

**Ndryshimi kryesor:** çdo gjë që sot është globale bëhet e lidhur me një tenant (klinikë).

---

## 3. Rolet

| Roli | Niveli | Çka mundet me bo |
|---|---|---|
| Super Admin | Platformë | Sheh të gjitha klinikat, ndryshon planin, pezullon klinika |
| Clinic Owner | Klinikë | Settings, stafi, plani, raportet |
| Receptionist | Klinikë | Menaxhon terminet dhe pacientët |
| Doctor | Klinikë | Orari i vet, terminet e veta, shënimet |
| Patient | Klinikë | Rezervon, anulon, sheh historikun e vet |

**Vendim arkitekturor:** `User` është global, ndërsa roli ruhet te `Membership` (user ↔ klinikë). Kështu një person mund të jetë doktor në dy klinika, ose pacient në dy klinika, me një llogari të vetme. Autorizimi lexon gjithmonë rolin nga Membership, kurrë nga User.

---

## 4. MVP — Faza 1

### 4.1 Multi-tenancy

- **Modeli:** databazë e përbashkët, kolona `tenantId` në çdo tabelë që i përket klinikës.
- **Prisma Client Extension** që e shton `tenantId` automatikisht në çdo query. Një query në tabelë tenant-scoped pa kontekst tenant-i dështon me error, jo në heshtje.
- **Indekse të përbëra:** `(tenantId, email)`, `(tenantId, slug)`, `(tenantId, doctorId, startsAt)`.
- **Teste izolimi:** teste automatike ku user-i i klinikës A provon me lexu/ndryshu të dhëna të klinikës B dhe duhet me marrë 404.
- **PostgreSQL Row-Level Security:** mbrojtje e dytë. Opsionale në MVP, e rekomanduar para klientëve realë.

### 4.2 Identifikimi i tenant-it

- **MVP:** path-based, p.sh. `dentixa.vercel.app/c/[slug]`.
- **Më vonë:** subdomain `klinika.dentixa.app`. Kërkon domain tëndin me wildcard DNS, sepse `*.vercel.app` nuk mbështet wildcard subdomains për projekte.
- **Backend:** tenant-i lexohet nga slug-u ose header-i `X-Tenant-Slug` dhe verifikohet kundrejt Membership-it të user-it në çdo request.

### 4.3 Onboarding i klinikës

- Regjistrimi: emri i klinikës, slug, llogaria e owner-it → krijohet `Tenant` + `Membership (OWNER)` në një transaksion.
- Wizard me 3 hapa: orari i punës → shërbimet (emri, kohëzgjatja, çmimi) → doktori i parë.
- Opsion për të dhëna demo me një klik.

### 4.4 Stafi dhe ftesat

- Owner-i fton staf me email dhe rol; token-i ruhet si hash dhe skadon pas 72 orësh.
- Pranimi i ftesës krijon Membership (ose e lidh me User ekzistues).
- Heqja e stafit e çaktivizon Membership-in pa e fshi historikun e termineve.

### 4.5 Oraret dhe shërbimet

- Orari i punës për klinikë dhe për secilin doktor.
- Pushimet / time off për doktor.
- Shërbimet lidhen me doktorët që i ofrojnë.
- Çmimet ruhen si integer (cent), jo float.

### 4.6 Rezervimet

- Faqja publike e klinikës: shërbimet, doktorët, slot-et e lira.
- Logjika ekzistuese race-safe mbetet, tash e kufizuar brenda tenant-it. Opsionalisht: PostgreSQL exclusion constraint mbi `(doctorId, tstzrange(startsAt, endsAt))` për garanci në nivel databaze.
- Statuset: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`.
- Kohët ruhen në UTC dhe shfaqen sipas timezone-it të klinikës.

### 4.7 Dashboard i klinikës

- Terminet e sotme dhe të javës
- Shkalla e no-show
- Shërbimet më të kërkuara
- Të ardhurat e vlerësuara (bazuar në çmimet e shërbimeve)

### 4.8 Njoftimet

- Përdoret NotificationService ekzistues: konfirmim, anulim, kujtesë 24 orë para terminit (email në MVP).
- Template-t përmbajnë emrin dhe logon e klinikës.

### 4.9 Paneli i Super Admin-it

- Lista e klinikave me statusin, planin dhe numrin e termineve
- Ndryshimi i planit dhe pezullimi i klinikës

### 4.10 Audit log

- Regjistrohet kush ndryshoi çka dhe kur për terminet, stafin dhe settings.

---

## 5. Faza 2 — Plane dhe billing

- **Plane me limite** (shembull):
  - *Free:* 1 doktor, 100 termine në muaj
  - *Pro:* pa limit, kujtesa SMS, branding i klinikës
- Limitet zbatohen në backend (middleware p.sh. `requirePlanFeature('sms')`), jo vetëm në UI.
- **Pagesat:** në fillim manuale. Super Admin-i e aktivizon planin pas transferit bankar ose faturës. Stripe dhe PayPal nuk i mbështesin bizneset e regjistruara në Kosovë, prandaj opsionet për pagesa online (gateway i bankës lokale, merchant-of-record etj.) duhet me u verifiku para se me u ndërtu integrimi.
- Kujtesa SMS
- Branding: logo dhe ngjyrat e klinikës në faqen publike
- Eksport CSV i termineve dhe pacientëve
- Privatësia: pacienti mund t'i shkarkojë të dhënat e veta dhe ta fshijë llogarinë

---

## 6. Faza 3 — E ardhmja

- Subdomain ose custom domain për klinikë
- Lista e pritjes (waitlist) kur lirohet një slot
- Përmbledhje AI e historikut të pacientit për doktorin
- Sinkronizim me Google Calendar
- Shumë gjuhë (shqip / anglisht)
- Depozitë online gjatë rezervimit

---

## 7. Jashtë scope

- Kartela mjekësore, dental charting, sigurimet shëndetësore
- Faturim fiskal
- Aplikacion mobile native
- Certifikime të rregulloreve shëndetësore (p.sh. HIPAA)

---

## 8. Modeli i të dhënave

```
Tenant        (id, name, slug, timezone, plan, status, createdAt)
User          (id, email, passwordHash, name, createdAt)
Membership    (id, userId, tenantId, role, status)       UNIQUE(userId, tenantId)
Invite        (id, tenantId, email, role, tokenHash, expiresAt, acceptedAt)
Doctor        (id, tenantId, membershipId, specialty)
Service       (id, tenantId, name, durationMin, priceCents)
DoctorService (doctorId, serviceId, tenantId)
WorkingHours  (id, tenantId, doctorId?, weekday, startTime, endTime)
TimeOff       (id, tenantId, doctorId, startsAt, endsAt, reason)
Appointment   (id, tenantId, doctorId, patientMembershipId, serviceId,
               startsAt, endsAt, status, notes, createdAt)
AuditLog      (id, tenantId, actorUserId, action, entity, entityId, meta, createdAt)
RefreshToken  (ekzistues)
```

---

## 9. Milestones (part-time, ~10–15 orë në javë)

| Java | Puna | Rezultati |
|---|---|---|
| 1 | Skema multi-tenant, migrimi i të dhënave ekzistuese në një klinikë demo | Migrime Prisma |
| 2 | Identifikimi i tenant-it, Prisma extension, testet e izolimit | Teste cross-tenant që kalojnë |
| 3 | Onboarding i klinikës, ftesat e stafit | Klinikë e re nga zero |
| 4 | Oraret, shërbimet, faqja publike e rezervimeve | Rezervim end-to-end |
| 5 | Dashboard i klinikës, njoftimet me email | Dashboard live |
| 6 | Paneli i Super Admin-it, audit log | Menaxhim i platformës |
| 7 | Plane dhe limite bazë, polish i UI | Free vs Pro funksional |
| 8 | Buffer, deploy, dokumentim, case study | Version publik |

Afatet janë të përafërta. Çdo milestone duhet me qenë i deploy-ueshëm më vete, që projekti të ketë vlerë edhe nëse ndalet në mes.

---

## 10. Kriteret e përfundimit të MVP-së

- [ ] 2 klinika demo me të dhëna plotësisht të ndara
- [ ] Llogari demo për çdo rol
- [ ] Testet cross-tenant kalojnë
- [ ] Dy rezervime të njëkohshme për të njëjtin slot: vetëm njëra pranohet
- [ ] README me diagram arkitekture dhe vendimet teknike
- [ ] Screenshots dhe GIF për Upwork dhe LinkedIn
- [ ] Deploy live

---

## 11. Rreziqet

| Rreziku | Ndikimi | Masa |
|---|---|---|
| Rrjedhje të dhënash mes klinikave | Shumë i lartë | Prisma extension, teste izolimi, RLS |
| Scope creep | I lartë | Çdo gjë jashtë seksionit 4 shkon në Fazën 2 ose 3 |
| Mungesa e kohës (punë me klientë, aplikime) | I lartë | Milestones të vogla, secila e deploy-ueshme |
| Pagesat online në Kosovë | Mesatar | Billing manual në MVP |
| Render free tier fle pas mosaktivitetit (kërkesa e parë e ngadaltë) | Mesatar | Plan i paguar para se me ia tregu klientëve |
