import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  ChevronRight,
  Download,
  FileCheck2,
  FileDown,
  Filter,
  IdCard,
  LockKeyhole,
  Mail,
  Pencil,
  Plus,
  Printer,
  Search,
  Send,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useForm } from "react-hook-form";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";
import { KpiCard } from "@/components/KpiCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Stepper } from "@/components/Stepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { categoryConfig, documentLabels } from "@/data/categoryConfig";
import type {
  AccreditationCard,
  Application,
  Category,
  MasterData,
  Role,
  Status,
  UserAccount,
} from "@/data/types";
import {
  categoryLabels,
  formatDate,
  roleLabels,
  statusLabels,
  toCsv,
} from "@/lib/formatters";
import { cn, uid } from "@/lib/utils";
import { mockApi } from "@/services/mockApi";
import { getCurrentUser, useDemoStore } from "@/store";
import ecLogo from "@/assets/ec-logo.webp";

const categoryKeys = Object.keys(categoryConfig) as Category[];
const staffCredentials: Record<
  Exclude<Role, "applicant">,
  { username: string; password: string }
> = {
  central_admin: { username: "centraladmin", password: "Demo@123" },
  returning_officer: { username: "ro.dhaka", password: "Demo@123" },
  super_admin: { username: "superadmin", password: "Demo@123" },
  verifier: { username: "verifier", password: "Demo@123" },
};

const loginCards: Array<{
  role: Role;
  path: string;
  title: string;
  description: string;
  credential: string;
}> = [
  {
    role: "applicant",
    path: "/login/applicant",
    title: "Applicant OTP Login",
    description:
      "Register or continue with email/mobile, then enter any 6 digit OTP.",
    credential: "Mobile 01712345678 · OTP 123456",
  },
  {
    role: "central_admin",
    path: "/login/central-admin",
    title: "Central Administrator",
    description:
      "National and international review, approval, and card issuance.",
    credential: "centraladmin / Demo@123",
  },
  {
    role: "returning_officer",
    path: "/login/returning-officer",
    title: "Returning Officer",
    description: "Local admin view limited to domestic applications in Dhaka.",
    credential: "ro.dhaka / Demo@123",
  },
  {
    role: "super_admin",
    path: "/login/super-admin",
    title: "Super Administrator",
    description:
      "Master data, audit logs, reporting, templates, and system settings.",
    credential: "superadmin / Demo@123",
  },
  {
    role: "verifier",
    path: "/login/verifier",
    title: "Verifier",
    description:
      "Optional gated verification-desk mode. Public card lookup still works without login.",
    credential: "verifier / Demo@123",
  },
];

const roleByLoginSlug: Record<string, Role> = {
  applicant: "applicant",
  "central-admin": "central_admin",
  "returning-officer": "returning_officer",
  "super-admin": "super_admin",
  verifier: "verifier",
};

const homeByRole: Record<Role, string> = {
  applicant: "/applicant",
  central_admin: "/admin/review",
  returning_officer: "/admin/review",
  super_admin: "/superadmin/dashboard",
  verifier: "/verify",
};

function pageTitle(title: string, description: string) {
  return (
    <div className="mb-6 flex flex-col gap-2">
      <h1 className="text-3xl font-semibold tracking-normal">{title}</h1>
      <p className="max-w-3xl text-muted-foreground">{description}</p>
    </div>
  );
}

function requiredLabel(label: string, required = true) {
  return (
    <>
      {label}
      {required ? (
        <span className="ml-1 text-destructive" aria-hidden="true">
          *
        </span>
      ) : null}
    </>
  );
}

function applicationOwner(application: Application) {
  return (
    application.fields.fullName ||
    application.fields.organization ||
    "Applicant"
  );
}

function isCentralCategory(category: Category) {
  return categoryConfig[category].authority === "central";
}

function isVisibleToReviewer(
  application: Application,
  role: Role,
  jurisdiction?: string,
) {
  if (role === "central_admin" || role === "super_admin")
    return isCentralCategory(application.category);
  if (role === "returning_officer")
    return (
      !isCentralCategory(application.category) &&
      application.jurisdiction === jurisdiction
    );
  return false;
}

function homeSectionHeading(title: string, description: string) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-semibold tracking-normal">{title}</h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
    </div>
  );
}

const homeWorkflowSteps: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Submit application",
    description:
      "Choose a category, complete the form, and upload required documents.",
    icon: Send,
  },
  {
    title: "Review & decision",
    description:
      "Central or local administrators assess eligibility and approve or return applications.",
    icon: FileCheck2,
  },
  {
    title: "Card issuance",
    description:
      "Approved applicants receive a printed accreditation card with QR verification.",
    icon: IdCard,
  },
  {
    title: "On-site verification",
    description:
      "Polling staff and verifiers confirm card authenticity instantly at the venue.",
    icon: BadgeCheck,
  },
];

const loginCardIcons: Record<Role, LucideIcon> = {
  applicant: Mail,
  central_admin: FileCheck2,
  returning_officer: Users,
  super_admin: LockKeyhole,
  verifier: Search,
};

const publicStats = [
  { value: "14,200+", label: "Accreditations issued" },
  { value: "64", label: "Districts covered" },
  { value: "< 48 hrs", label: "Average review time" },
];

const managedAdminRoles: Role[] = [
  "central_admin",
  "returning_officer",
  "verifier",
];

const permissionMatrix: Record<string, string[]> = {
  "Central Administrator": [
    "Review central applications",
    "Approve applications",
    "Issue cards",
    "View reports",
  ],
  "Returning Officer": [
    "Review local applications",
    "Approve local applications",
    "Return applications",
    "View local reports",
  ],
  Verifier: ["Lookup cards", "Scan QR", "View verification result"],
  "Super Administrator": [
    "Manage users",
    "Edit master data",
    "Override workflow",
    "Revoke cards",
    "Export reports",
  ],
};

function downloadCsv(
  filename: string,
  rows: Array<Record<string, string | number>>,
) {
  const csv = toCsv(rows);
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function PublicHomeLegacy() {
  const applications = useDemoStore((state) => state.applications);
  const cards = useDemoStore((state) => state.cards);
  const stats = {
    applications: applications.length,
    pending: applications.filter((item) =>
      ["submitted", "under_review"].includes(item.status),
    ).length,
    cards: cards.length,
  };
  return (
    <div className="grid gap-12 pb-2">
      <section className="relative overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--gold)/0.14),transparent_55%),radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.1),transparent_50%)]" />
        <div className="relative grid min-h-[480px] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col justify-center gap-8 p-8 lg:p-12 xl:p-14">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-card p-1.5 shadow-soft">
                <img
                  alt=""
                  aria-hidden
                  className="h-full w-full object-contain"
                  src={ecLogo}
                />
              </div>
              <Badge
                className="border-primary/20 bg-primary/10 text-primary"
                variant="secondary"
              >
                2026 National Election Accreditation
              </Badge>
            </div>
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-normal text-foreground md:text-5xl xl:text-[3.25rem]">
                Bangladesh Election Commission Accreditation Portal
              </h1>
              <p className="font-bangla mt-3 text-lg text-primary">
                নির্বাচন কমিশন · অ্যাক্রেডিটেশন পোর্টাল
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                A secure demo portal for journalists, observers, observer
                organizations, and support personnel — from application through
                review to card verification.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="gap-2 shadow-soft" size="lg">
                <Link to="/login/applicant">
                  Apply now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link to="/verify">Verify a card</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Offline-first demo
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
              <span>No external services required</span>
            </div>
          </div>
          <div className="relative bg-gradient-to-br from-primary via-primary to-primary-dark p-6 text-primary-foreground lg:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,hsl(var(--gold)/0.28),transparent_35%)]" />
            <div className="relative flex h-full flex-col justify-between gap-8 rounded-xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm lg:p-8">
              <div>
                <p className="font-bangla text-xl font-semibold">
                  নির্বাচন কমিশন
                </p>
                <p className="mt-1 text-sm font-medium text-white/90">
                  Bangladesh Election Commission
                </p>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
                  Live demo metrics from seeded data — reset anytime from the
                  header.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {[
                  { label: "Seeded applications", value: stats.applications },
                  { label: "Pending review", value: stats.pending },
                  { label: "Issued cards", value: stats.cards },
                ].map((item) => (
                  <div
                    className="rounded-lg border border-white/10 bg-white/10 p-4 transition hover:bg-white/15"
                    key={item.label}
                  >
                    <p className="text-3xl font-semibold tabular-nums">
                      {item.value}
                    </p>
                    <p className="mt-1 text-sm text-white/75">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        {homeSectionHeading(
          "How accreditation works",
          "Four stages from first submission to on-the-ground verification at polling centres.",
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {homeWorkflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                className="group relative rounded-xl border bg-card p-5 transition hover:border-primary/30 hover:shadow-soft"
                key={step.title}
              >
                {index < homeWorkflowSteps.length - 1 ? (
                  <ChevronRight
                    aria-hidden
                    className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground/50 xl:block"
                  />
                ) : null}
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <p className="font-medium">{step.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        {homeSectionHeading(
          "Accreditation categories",
          "Each category has tailored fields, document requirements, and a central or local review path.",
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoryKeys.map((key) => {
            const config = categoryConfig[key];
            return (
              <Card
                className="group overflow-hidden shadow-none transition hover:border-primary/25 hover:shadow-soft"
                key={key}
              >
                <CardHeader className="pb-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: config.accent }}
                    />
                    <Badge className="font-normal" variant="outline">
                      {config.authority === "central"
                        ? "Central review"
                        : "Local review"}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{config.label}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {config.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    {config.documents.filter((doc) => doc.required).length}{" "}
                    required documents
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-5 flex justify-center">
          <Button asChild className="gap-2" variant="outline">
            <Link to="/login/applicant">
              Start an application
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section>
        {homeSectionHeading(
          "Demo login portals",
          "Each role has its own entry flow and seeded credentials for guided walkthroughs.",
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {loginCards.map((card) => {
            const Icon = loginCardIcons[card.role];
            const isPrimary = card.role === "applicant";
            return (
              <Card
                className={cn(
                  "group flex flex-col shadow-none transition hover:-translate-y-0.5 hover:shadow-soft",
                  isPrimary && "border-primary/25 bg-primary/[0.02]",
                )}
                key={card.role}
              >
                <CardHeader className="pb-3">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition",
                        isPrimary
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent text-primary group-hover:bg-primary group-hover:text-primary-foreground",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <Badge className="shrink-0 font-normal" variant="secondary">
                      {roleLabels[card.role]}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {card.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto grid gap-3">
                  <div className="rounded-md border bg-muted/50 px-3 py-2.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Demo credentials
                    </p>
                    <p className="mt-0.5 text-xs font-medium">
                      {card.credential}
                    </p>
                  </div>
                  <Button
                    asChild
                    className="gap-2"
                    variant={isPrimary ? "default" : "outline"}
                  >
                    <Link to={card.path}>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function PublicHome() {
  return (
    <div className="grid gap-12 pb-2">
      <section className="relative overflow-hidden rounded-2xl border bg-card shadow-soft">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--gold)/0.12),transparent_55%),radial-gradient(ellipse_at_bottom_left,hsl(var(--primary)/0.08),transparent_50%)]" />
        <div className="relative grid min-h-[420px] lg:grid-cols-[1.16fr_0.84fr]">
          <div className="flex flex-col justify-center gap-6 p-8 lg:p-10 xl:p-12">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border bg-card p-1.5 shadow-soft">
                <img
                  alt=""
                  aria-hidden
                  className="h-full w-full object-contain"
                  src={ecLogo}
                />
              </div>
              <Badge
                className="border-primary/20 bg-primary/10 text-primary"
                variant="secondary"
              >
                2026 National Election Accreditation
              </Badge>
            </div>
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-normal text-foreground xl:text-5xl">
                Bangladesh Election Commission Accreditation Portal
              </h1>
              <p className="font-bangla mt-3 text-lg text-primary">
                নির্বাচন কমিশন · অ্যাক্রেডিটেশন পোর্টাল
              </p>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                A secure portal experience for journalists, observers, observer
                organizations, and support personnel from application through
                review to card verification.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="gap-2 shadow-soft" size="lg">
                <Link to="/login/applicant">
                  Apply now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/login/applicant">My Applications</Link>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                QR-enabled card verification
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-border sm:inline-block" />
              <span>Role-based digital accreditation workflow</span>
            </div>
          </div>

          <div className="relative flex items-center bg-gradient-to-br from-primary/8 via-accent to-primary/10 p-6 lg:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,hsl(var(--gold)/0.18),transparent_34%)]" />
            <div className="relative w-full rounded-2xl border bg-card p-6 shadow-soft">
              <div className="flex items-start gap-4">
                <img
                  alt="Bangladesh Election Commission logo"
                  className="h-20 w-20 shrink-0 object-contain"
                  src={ecLogo}
                />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Bangladesh Election Commission
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-normal">
                    Accreditation Card
                  </h2>
                  <p className="font-bangla text-sm text-muted-foreground">
                    নির্বাচন কমিশন · বাংলাদেশ
                  </p>
                </div>
              </div>
              <div className="mt-7 grid grid-cols-[104px_1fr] gap-5">
                <div className="h-32 rounded-xl border border-dashed bg-accent" />
                <div className="grid content-start gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Name
                    </p>
                    <p className="text-xl font-semibold">Tahmid Rahman</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Organization
                    </p>
                    <p className="font-medium">
                      Prothom Alo · Domestic Journalist
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Card no.
                    </p>
                    <p className="font-mono font-semibold">BD-EC-0001001</p>
                  </div>
                </div>
              </div>
              <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-full bg-accent px-4 py-3 text-sm">
                <span className="inline-flex items-center gap-2 font-semibold text-primary">
                  <ShieldCheck className="h-4 w-4" />
                  Verified · Valid until 15 Mar 2026
                </span>
                <span className="text-muted-foreground">Tap card to scan</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-2xl border bg-card px-6 py-7 shadow-soft sm:grid-cols-3">
        {publicStats.map((item) => (
          <div key={item.label}>
            <p className="text-3xl font-semibold tracking-normal">
              {item.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </section>

      <section>
        {homeSectionHeading(
          "How accreditation works",
          "Four stages from first submission to on-the-ground verification at polling centres.",
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {homeWorkflowSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                className="group relative rounded-xl border bg-card p-5 transition hover:border-primary/30 hover:shadow-soft"
                key={step.title}
              >
                {index < homeWorkflowSteps.length - 1 ? (
                  <ChevronRight
                    aria-hidden
                    className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground/50 xl:block"
                  />
                ) : null}
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <p className="font-medium">{step.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function LoginHubPage() {
  return <Navigate replace to="/login/applicant" />;
}

export function LoginPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const role = roleByLoginSlug[params.roleSlug ?? "applicant"] ?? "applicant";
  const activeCard =
    loginCards.find((card) => card.role === role) ?? loginCards[0];
  const Icon = loginCardIcons[role];
  const [applicantMode, setApplicantMode] = useState<"login" | "register">(
    searchParams.get("mode") === "register" ? "register" : "login",
  );
  const [contact, setContact] = useState("01712345678");
  const [registrationFullName, setRegistrationFullName] = useState("");
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [registrationMobile, setRegistrationMobile] = useState("");
  const [registrationConsent, setRegistrationConsent] = useState(false);
  const [otp, setOtp] = useState("123456");
  const staffRole = role === "applicant" ? "central_admin" : role;
  const [username, setUsername] = useState(
    role === "applicant" ? "" : staffCredentials[staffRole].username,
  );
  const [password, setPassword] = useState("Demo@123");
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const applicantContact =
    applicantMode === "register" ? registrationMobile.trim() : contact.trim();

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const isValidBangladeshiMobile = (value: string) =>
    /^01[3-9]\d{8}$/.test(value);

  const validateRegistrationForm = () => {
    if (registrationFullName.trim().length < 2) {
      return "Enter your full name with at least 2 characters.";
    }
    if (!isValidEmail(registrationEmail.trim())) {
      return "Enter a valid email address.";
    }
    if (!isValidBangladeshiMobile(registrationMobile.trim())) {
      return "Enter an 11 digit Bangladeshi mobile number, for example 01712345678.";
    }
    if (!registrationConsent) {
      return "Accept the Terms & Privacy consent to continue.";
    }
    return "";
  };

  const isValidLoginContact = () => {
    const value = contact.trim();
    return isValidEmail(value) || isValidBangladeshiMobile(value);
  };

  const sendApplicantOtp = () => {
    setError("");
    if (applicantMode === "register") {
      const validationError = validateRegistrationForm();
      if (validationError) {
        setError(validationError);
        return;
      }
    } else if (!isValidLoginContact()) {
      setError(
        "Enter a valid email address or Bangladeshi mobile number for OTP.",
      );
      return;
    }
    setOtpSent(true);
  };

  const submit = async () => {
    setError("");
    if (role === "applicant") {
      if (!otpSent) {
        sendApplicantOtp();
        return;
      }
      if (otp.trim().length !== 6) {
        setError("Enter any 6 digits for the demo OTP.");
        return;
      }
      const existingApplicant = useDemoStore
        .getState()
        .users.find(
          (user) =>
            user.role === "applicant" &&
            (user.mobile === applicantContact ||
              user.email === applicantContact),
        );
      if (applicantMode === "login") {
        if (!existingApplicant) {
          setError(
            "No applicant profile was found for this email or mobile number. Choose registration to create one.",
          );
          return;
        }
        await mockApi.login("applicant", otp);
        useDemoStore.getState().setCurrentUser(existingApplicant.id);
        navigate("/applicant");
        return;
      }
      const applicant = await mockApi.registerApplicant(
        applicantContact,
        registrationFullName.trim(),
        registrationEmail.trim(),
        registrationMobile.trim(),
      );
      await mockApi.login("applicant", otp);
      useDemoStore.getState().setCurrentUser(applicant.id);
      navigate("/applicant");
      return;
    }
    const credentials = staffCredentials[role];
    if (
      username !== credentials.username ||
      password !== credentials.password
    ) {
      setError(
        `Use the demo credentials: ${credentials.username} / ${credentials.password}`,
      );
      return;
    }
    await mockApi.login(role, username);
    navigate(homeByRole[role]);
  };

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative overflow-hidden rounded-2xl border bg-primary p-8 text-primary-foreground shadow-soft">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,hsl(var(--gold)/0.28),transparent_34%),radial-gradient(circle_at_80%_80%,hsl(var(--background)/0.16),transparent_38%)]" />
        <div className="relative grid min-h-[420px] content-between gap-10">
          <div>
            <div className="mb-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/25 bg-white p-1.5 shadow-soft">
              <img
                alt="Bangladesh Election Commission logo"
                className="h-full w-full object-contain"
                src={ecLogo}
              />
            </div>
            <Badge
              className="border-white/20 bg-white/10 text-white"
              variant="secondary"
            >
              {roleLabels[role]}
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal">
              {activeCard.title}
            </h1>
            <p className="mt-4 max-w-md leading-relaxed text-white/78">
              {activeCard.description}
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Icon className="h-4 w-4" />
              Demo access
            </div>
            <p className="text-sm leading-relaxed text-white/78">
              {role === "applicant"
                ? "Applicants can sign in or register with OTP sent to an email address or mobile number."
                : `Use ${activeCard.credential} to enter this role dashboard.`}
            </p>
          </div>
        </div>
      </section>

      <Card className="self-center shadow-soft">
        <CardHeader>
          <CardTitle>
            {role === "applicant"
              ? applicantMode === "login"
                ? "Applicant login"
                : "Applicant registration"
              : `${roleLabels[role]} login`}
          </CardTitle>
          <CardDescription>
            {role === "applicant"
              ? "Choose an applicant flow, then receive the demo OTP by email or mobile."
              : "This page only signs in the selected portal role."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {role === "applicant" ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  className={cn(
                    "rounded-lg border p-4 text-left transition hover:border-primary/40 hover:bg-accent",
                    applicantMode === "login" &&
                      "border-primary bg-primary/5 text-primary",
                  )}
                  onClick={() => {
                    setApplicantMode("login");
                    setOtpSent(false);
                    setError("");
                  }}
                  type="button"
                >
                  <LockKeyhole className="mb-3 h-5 w-5" />
                  <span className="block font-semibold">Login</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    Continue to existing applications.
                  </span>
                </button>
                <button
                  className={cn(
                    "rounded-lg border p-4 text-left transition hover:border-primary/40 hover:bg-accent",
                    applicantMode === "register" &&
                      "border-primary bg-primary/5 text-primary",
                  )}
                  onClick={() => {
                    setApplicantMode("register");
                    setOtpSent(false);
                    setError("");
                  }}
                  type="button"
                >
                  <UserPlus className="mb-3 h-5 w-5" />
                  <span className="block font-semibold">Registration</span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    Create a new applicant profile.
                  </span>
                </button>
              </div>
              {applicantMode === "register" ? (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="registrationFullName">
                      {requiredLabel("Full name")}
                    </Label>
                    <Input
                      id="registrationFullName"
                      minLength={2}
                      onChange={(event) => {
                        setRegistrationFullName(event.target.value);
                        setOtpSent(false);
                      }}
                      placeholder="Your full name"
                      required
                      value={registrationFullName}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="registrationEmail">
                      {requiredLabel("Email address")}
                    </Label>
                    <Input
                      id="registrationEmail"
                      onChange={(event) => {
                        setRegistrationEmail(event.target.value);
                        setOtpSent(false);
                      }}
                      placeholder="applicant@example.com"
                      required
                      type="email"
                      value={registrationEmail}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="registrationMobile">
                      {requiredLabel("Mobile number")}
                    </Label>
                    <Input
                      id="registrationMobile"
                      inputMode="numeric"
                      onChange={(event) => {
                        setRegistrationMobile(event.target.value);
                        setOtpSent(false);
                      }}
                      placeholder="01712345678"
                      required
                      value={registrationMobile}
                    />
                  </div>
                  <label className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3 text-sm leading-relaxed">
                    <input
                      checked={registrationConsent}
                      className="mt-1 h-4 w-4 rounded border-input accent-primary"
                      onChange={(event) => {
                        setRegistrationConsent(event.target.checked);
                        setOtpSent(false);
                      }}
                      type="checkbox"
                    />
                    <span>
                      {requiredLabel(
                        "I agree to the Terms & Privacy policy for creating an applicant portal account.",
                      )}
                    </span>
                  </label>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="contact">
                    {requiredLabel("Email address or mobile number")}
                  </Label>
                  <Input
                    id="contact"
                    onChange={(event) => {
                      setContact(event.target.value);
                      setOtpSent(false);
                    }}
                    placeholder="01712345678 or applicant@example.com"
                    value={contact}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Demo OTP can be sent by SMS or email. Use any 6 digits, for
                example 123456.
              </p>
              {otpSent ? (
                <div className="grid gap-2">
                  <Label htmlFor="otp">{requiredLabel("OTP")}</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    onChange={(event) => setOtp(event.target.value)}
                    value={otp}
                  />
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="rounded-lg border bg-muted/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Demo credentials
                </p>
                <p className="mt-1 font-medium">{activeCard.credential}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">{requiredLabel("Username")}</Label>
                <Input
                  id="username"
                  onChange={(event) => setUsername(event.target.value)}
                  value={username}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">{requiredLabel("Password")}</Label>
                <Input
                  id="password"
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  value={password}
                />
              </div>
            </>
          )}
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <Button onClick={() => void submit()}>
            {role === "applicant" && applicantMode === "register" ? (
              <UserPlus className="h-4 w-4" />
            ) : (
              <LockKeyhole className="h-4 w-4" />
            )}
            {role === "applicant"
              ? otpSent
                ? applicantMode === "register"
                  ? "Register and continue"
                  : "Login"
                : "Send OTP"
              : "Login"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ApplicantDashboard() {
  const user = useDemoStore(getCurrentUser);
  const allApplications = useDemoStore((state) => state.applications);
  const cards = useDemoStore((state) => state.cards);
  const applications = allApplications.filter(
    (item) => item.applicantId === user.id,
  );

  return (
    <div>
      {pageTitle(
        "Applicant Workspace",
        "Track application status, start a new application, and download issued accreditation cards.",
      )}
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Applications</h2>
          <Button asChild>
            <Link to="/applicant/apply">
              <Plus className="h-4 w-4" />
              New application
            </Link>
          </Button>
        </div>
        {applications.length === 0 ? (
          <Card className="shadow-none">
            <CardContent className="p-8 text-center text-muted-foreground">
              No applications yet. Start with a category and save a draft any
              time.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {applications.map((application) => {
              const card = cards.find((item) => item.id === application.cardId);
              const statusSteps: Status[] = [
                "draft",
                "submitted",
                "under_review",
                "approved",
                "card_issued",
              ];
              const statusIndex = statusSteps.indexOf(application.status);
              return (
                <Card className="shadow-none" key={application.id}>
                  <CardContent className="grid gap-5 p-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{application.refNo}</p>
                        <StatusBadge status={application.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {categoryLabels[application.category]} ·{" "}
                        {application.jurisdiction} · Updated{" "}
                        {formatDate(application.updatedAt)}
                      </p>
                      <div className="mt-4">
                        <Stepper
                          current={statusIndex < 0 ? 1 : statusIndex}
                          steps={[
                            "Draft",
                            "Submitted",
                            "Review",
                            "Approved",
                            "Card",
                          ]}
                        />
                      </div>
                    </div>
                    {card ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <div>
                          <p className="font-semibold text-primary">
                            Accreditation card ready
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Card no. {card.cardNumber} is issued and available
                            for download.
                          </p>
                        </div>
                        <Button asChild className="shadow-soft">
                          <Link to={`/cards/${card.cardNumber}`}>
                            <Download className="h-4 w-4" />
                            Download accreditation card
                          </Link>
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function ApplicantProfilePage() {
  const user = useDemoStore(getCurrentUser);
  const [profile, setProfile] = useState<UserAccount>(user);
  const [message, setMessage] = useState("");

  const saveProfile = async () => {
    await mockApi.saveProfile(profile);
    setMessage("Profile saved successfully.");
  };

  return (
    <div>
      {pageTitle(
        "Applicant Profile",
        "Update your contact details and default jurisdiction for future accreditation applications.",
      )}
      <Card className="max-w-xl shadow-soft">
        <CardHeader>
          <CardTitle>Profile details</CardTitle>
          <CardDescription>
            These details can be edited independently from application status.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input
              onChange={(event) =>
                setProfile({ ...profile, name: event.target.value })
              }
              value={profile.name}
            />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input
              onChange={(event) =>
                setProfile({ ...profile, email: event.target.value })
              }
              value={profile.email ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label>Mobile</Label>
            <Input
              onChange={(event) =>
                setProfile({ ...profile, mobile: event.target.value })
              }
              value={profile.mobile ?? ""}
            />
          </div>
          <div className="grid gap-2">
            <Label>Jurisdiction</Label>
            <Input
              onChange={(event) =>
                setProfile({ ...profile, jurisdiction: event.target.value })
              }
              value={profile.jurisdiction ?? "Dhaka"}
            />
          </div>
          {message ? (
            <div
              className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              role="alert"
            >
              {message}
            </div>
          ) : null}
          <Button onClick={() => void saveProfile()}>
            <Pencil className="h-4 w-4" />
            Save profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

type DynamicFormValues = Record<string, string>;

export function ApplicationFormPage() {
  const user = useDemoStore(getCurrentUser);
  const masterData = useDemoStore((state) => state.masterData);
  const [category, setCategory] = useState<Category>("domestic_journalist");
  const [step, setStep] = useState(0);
  const [submittedRef, setSubmittedRef] = useState("");
  const [applicationMessage, setApplicationMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const categoryRule = masterData.categoryRules.find(
    (rule) => rule.id === category,
  );
  const config = {
    ...categoryConfig[category],
    documents: categoryConfig[category].documents.map((document) => {
      const ruleDocument = categoryRule?.documents.find(
        (item) => item.type === document.type,
      );
      return ruleDocument
        ? { ...document, required: ruleDocument.required }
        : document;
    }),
  };
  const schema = useMemo(
    () =>
      z.object(
        Object.fromEntries(
          config.fields.map((field) => [
            field.name,
            field.required
              ? z.string().min(1, `${field.label} is required`)
              : z.string(),
          ]),
        ) as Record<string, z.ZodString>,
      ),
    [config.fields],
  );
  const form = useForm<DynamicFormValues>({
    resolver: zodResolver(schema),
    values: Object.fromEntries(
      config.fields.map((field) => [
        field.name,
        field.name === "fullName" ? user.name : "",
      ]),
    ) as DynamicFormValues,
  });

  const submit = async (draft: boolean) => {
    setApplicationMessage(null);
    const valid = draft || (await form.trigger());
    if (!valid) {
      const firstErrorField = config.fields.find(
        (field) => form.getFieldState(field.name).error,
      );
      const firstErrorIndex = firstErrorField
        ? config.fields.findIndex(
            (field) => field.name === firstErrorField.name,
          )
        : -1;
      if (firstErrorIndex >= 0) {
        setStep(firstErrorIndex < 3 ? 0 : 1);
      }
      setApplicationMessage({
        type: "error",
        text: "Please complete the required fields before submitting the application.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const values = form.getValues();
      const application = await mockApi.submitApplication({
        applicantId: user.id,
        category,
        fields: values,
        jurisdiction: values.jurisdiction || user.jurisdiction || "Dhaka",
        draft,
      });
      setSubmittedRef(application.refNo);
      setApplicationMessage({
        type: "success",
        text: draft
          ? `Draft saved. Reference issued: ${application.refNo}.`
          : `Application submitted successfully. Reference issued: ${application.refNo}.`,
      });
      if (!draft) window.setTimeout(() => navigate("/applicant"), 1800);
    } catch {
      setApplicationMessage({
        type: "error",
        text: "The application could not be submitted. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {pageTitle(
        "New Accreditation Application",
        "A four-step dynamic form driven by category configuration and zod validation.",
      )}
      <Stepper
        current={step}
        steps={["Personal", "Category Details", "Documents", "Review & Submit"]}
      />
      <Card className="mt-6">
        <CardContent className="grid gap-5 p-6">
          {step === 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>{requiredLabel("Category")}</Label>
                <select
                  className="mt-2 h-10 w-full rounded-md border bg-card px-3 text-sm"
                  onChange={(event) =>
                    setCategory(event.target.value as Category)
                  }
                  value={category}
                >
                  {categoryKeys.map((item) => (
                    <option key={item} value={item}>
                      {categoryLabels[item]}
                    </option>
                  ))}
                </select>
              </div>
              {config.fields.slice(0, 3).map((field) => (
                <div className="grid gap-2" key={field.name}>
                  <Label>{requiredLabel(field.label, field.required)}</Label>
                  <Input
                    placeholder={field.placeholder}
                    {...form.register(field.name)}
                  />
                  <p className="text-xs text-destructive">
                    {form.formState.errors[field.name]?.message}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          {step === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {config.fields.slice(3).map((field) => (
                <div className="grid gap-2" key={field.name}>
                  <Label>{requiredLabel(field.label, field.required)}</Label>
                  <Input
                    placeholder={field.placeholder}
                    {...form.register(field.name)}
                  />
                  <p className="text-xs text-destructive">
                    {form.formState.errors[field.name]?.message}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
          {step === 2 ? (
            <div className="grid gap-3 md:grid-cols-2">
              {config.documents.map((document) => (
                <div className="rounded-lg border p-4" key={document.type}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {requiredLabel(document.label, document.required)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {document.rule}
                      </p>
                    </div>
                    <Badge
                      variant={document.required ? "default" : "secondary"}
                    >
                      {document.required ? "Required" : "Optional"}
                    </Badge>
                  </div>
                  <div className="mt-4 rounded-md border border-dashed bg-accent p-4 text-sm">
                    <FileCheck2 className="mb-2 h-5 w-5 text-primary" />
                    {documentLabels[document.type]} selected · validated
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {step === 3 ? (
            <div className="grid gap-4">
              <div className="rounded-lg border bg-accent p-4">
                <p className="font-semibold">{config.label}</p>
                <p className="text-sm text-muted-foreground">
                  {config.description}
                </p>
              </div>
              <Table>
                <TBody>
                  {config.fields.map((field) => (
                    <TR key={field.name}>
                      <TH>{field.label}</TH>
                      <TD>{form.getValues(field.name) || field.placeholder}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              {submittedRef ? (
                <Badge className="w-fit">
                  Reference issued: {submittedRef}
                </Badge>
              ) : null}
            </div>
          ) : null}
          {applicationMessage ? (
            <div
              className={cn(
                "rounded-lg border p-4 text-sm",
                applicationMessage.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700",
              )}
              role="alert"
            >
              {applicationMessage.text}
            </div>
          ) : null}
          <div className="flex flex-wrap justify-between gap-3">
            <Button
              disabled={step === 0 || isSubmitting}
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              variant="outline"
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                disabled={isSubmitting}
                onClick={() => void submit(true)}
                variant="secondary"
              >
                Save draft
              </Button>
              {step < 3 ? (
                <Button
                  disabled={isSubmitting}
                  onClick={() => setStep((value) => Math.min(3, value + 1))}
                >
                  Next
                </Button>
              ) : (
                <Button
                  disabled={isSubmitting}
                  onClick={() => void submit(false)}
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "Submitting..." : "Submit application"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ReviewQueuePage() {
  const role = useDemoStore((state) => state.activeRole);
  const user = useDemoStore(getCurrentUser);
  const allApplications = useDemoStore((state) => state.applications);
  const applications = allApplications.filter((item) =>
    isVisibleToReviewer(item, role, user.jurisdiction),
  );

  return (
    <div>
      {pageTitle(
        "Review Queue",
        role === "returning_officer"
          ? "Returning Officer view is limited to domestic Dhaka applicants."
          : "Central review covers national and international authority queues.",
      )}
      <Card>
        <CardHeader>
          <CardTitle>Applications routed to you</CardTitle>
          <CardDescription>
            Open an application to review details, add a cause, and update the
            decision.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length ? (
            <Table>
              <THead>
                <TR>
                  <TH>Reference</TH>
                  <TH>Applicant</TH>
                  <TH>Category</TH>
                  <TH>Jurisdiction</TH>
                  <TH>Status</TH>
                  <TH>Action</TH>
                </TR>
              </THead>
              <TBody>
                {applications.map((application) => (
                  <TR key={application.id}>
                    <TD className="font-medium">{application.refNo}</TD>
                    <TD>{applicationOwner(application)}</TD>
                    <TD>{categoryLabels[application.category]}</TD>
                    <TD>{application.jurisdiction}</TD>
                    <TD>
                      <StatusBadge status={application.status} />
                    </TD>
                    <TD>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/admin/review/${application.id}`}>
                          Review
                        </Link>
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No applications in this role's queue.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ApplicationReviewDetailPage() {
  const { applicationId } = useParams();
  const role = useDemoStore((state) => state.activeRole);
  const user = useDemoStore(getCurrentUser);
  const applications = useDemoStore((state) => state.applications);
  const cards = useDemoStore((state) => state.cards);
  const application = applications.find((item) => item.id === applicationId);
  const issuedCard = application
    ? cards.find(
        (card) =>
          card.id === application.cardId ||
          card.applicationId === application.id,
      )
    : undefined;
  const isIssued = application?.status === "card_issued" || Boolean(issuedCard);
  const isRevoked = issuedCard?.state === "revoked";
  const backPath =
    role === "super_admin" ? "/superadmin/applications" : "/admin/review";
  const canReview =
    application &&
    (role === "super_admin" ||
      isVisibleToReviewer(application, role, user.jurisdiction));
  const [cause, setCause] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const decide = async (status: Status, comment = "") => {
    setMessage("");
    setError("");
    if (!application) return;
    setIsSubmitting(true);
    try {
      const updated = await mockApi.transitionApplication(
        application.id,
        status,
        comment,
        user.name,
      );
      setMessage(
        status === "approved"
          ? `${updated.refNo} approved and card issued successfully.`
          : `${updated.refNo} moved to ${statusLabels[updated.status]}.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const reject = async () => {
    setMessage("");
    setError("");
    if (!application) return;
    if (cause.trim().length < 3) {
      setError("Add a rejection cause before rejecting the application.");
      return;
    }
    setIsSubmitting(true);
    try {
      const updated = await mockApi.transitionApplication(
        application.id,
        "rejected",
        cause.trim(),
        user.name,
      );
      setMessage(`${updated.refNo} rejected successfully.`);
      setCause("");
      setIsRejecting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const revokeCard = async () => {
    setMessage("");
    setError("");
    if (!issuedCard) return;
    setIsSubmitting(true);
    try {
      const updated = await mockApi.updateCardState(
        issuedCard.id,
        "revoked",
        user.name,
      );
      setMessage(
        `${updated.cardNumber} revoked successfully. Public verification will show REVOKED.`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!application || !canReview) {
    return (
      <div>
        {pageTitle(
          "Application Review",
          "The requested application is not available for this role.",
        )}
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
            <p className="text-muted-foreground">
              This application could not be found in your review scope.
            </p>
            <Button asChild variant="outline">
              <Link to={backPath}>Back to queue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        {pageTitle(
          "Application Review",
          `${categoryLabels[application.category]} - ${application.jurisdiction} - ${applicationOwner(application)}`,
        )}
        <Button asChild variant="outline">
          <Link to={backPath}>Back to queue</Link>
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{application.refNo}</CardTitle>
                <CardDescription>
                  Submitted {formatDate(application.createdAt)} - Updated{" "}
                  {formatDate(application.updatedAt)}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={application.status} />
                {issuedCard ? (
                  <Badge
                    variant={
                      issuedCard.state === "revoked"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    Card {issuedCard.state.toUpperCase()}
                  </Badge>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 md:grid-cols-2">
              {Object.entries(application.fields)
                .filter(([, value]) => value)
                .map(([key, value]) => (
                  <div className="rounded-md border p-3" key={key}>
                    <p className="text-xs uppercase text-muted-foreground">
                      {key}
                    </p>
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {application.documents.map((document) => (
                <button
                  className="rounded-md border bg-accent p-3 text-left text-sm"
                  key={document.id}
                >
                  <FileCheck2 className="mb-2 h-4 w-4 text-primary" />
                  {document.fileName || documentLabels[document.type]} - Preview
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Review & Approval Workflow</CardTitle>
              <CardDescription>
                Move this application through review. A cause is required only
                when rejecting.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}
              {message ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                  {message}
                </div>
              ) : null}
              <div className="grid gap-2">
                <Button
                  disabled={isSubmitting || isIssued || isRevoked}
                  onClick={() => void decide("under_review")}
                  variant="secondary"
                >
                  Mark under review
                </Button>
                <Button
                  disabled={isSubmitting || isIssued || isRevoked}
                  onClick={() => void decide("approved")}
                  variant={isIssued || isRevoked ? "secondary" : "default"}
                >
                  {isRevoked
                    ? "Card revoked"
                    : isIssued
                      ? "Card already issued"
                      : "Approve + issue card"}
                </Button>
                {isIssued && issuedCard && !isRevoked ? (
                  <Button
                    disabled={isSubmitting}
                    onClick={() => void revokeCard()}
                    variant="destructive"
                  >
                    Revoke issued card
                  </Button>
                ) : null}
                {isRevoked ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Issued card is revoked.
                  </div>
                ) : null}
                {!isRejecting ? (
                  <Button
                    disabled={isSubmitting || isIssued || isRevoked}
                    onClick={() => {
                      setIsRejecting(true);
                      setMessage("");
                      setError("");
                    }}
                    variant="destructive"
                  >
                    Reject
                  </Button>
                ) : (
                  <div className="grid gap-3 rounded-lg border border-red-100 bg-red-50 p-3">
                    <div>
                      <Label htmlFor="rejection-cause">
                        {requiredLabel("Rejection cause")}
                      </Label>
                      <Textarea
                        id="rejection-cause"
                        onChange={(event) => setCause(event.target.value)}
                        placeholder="State the reason for rejection."
                        value={cause}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={isSubmitting}
                        onClick={() => void reject()}
                        variant="destructive"
                      >
                        Confirm rejection
                      </Button>
                      <Button
                        disabled={isSubmitting}
                        onClick={() => {
                          setIsRejecting(false);
                          setCause("");
                          setError("");
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Decision History</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {application.reviewerComments?.length ? (
                application.reviewerComments.map((comment) => (
                  <div className="rounded-md border p-3" key={comment.at}>
                    <p className="text-sm font-medium">{comment.by}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(comment.at)}
                    </p>
                    <p className="mt-2 text-sm">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No decision notes yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function CardArt({ card }: { card: AccreditationCard }) {
  return (
    <div
      className="max-w-md rounded-xl border bg-white p-5 text-foreground shadow-soft"
      id="accreditation-card"
    >
      <div className="flex items-start justify-between gap-4 border-b pb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Bangladesh Election Commission
          </p>
          <p className="font-bangla text-sm text-primary">নির্বাচন কমিশন</p>
          <h2 className="mt-2 text-xl font-semibold">
            Election Accreditation Card
          </h2>
        </div>
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border bg-white p-1">
          <img
            alt="Bangladesh Election Commission logo"
            className="h-full w-full object-contain"
            src={ecLogo}
          />
        </div>
      </div>
      <div className="grid grid-cols-[92px_1fr] gap-4 py-4">
        <div className="flex h-28 w-24 items-center justify-center rounded-md bg-accent text-sm font-semibold text-primary">
          PHOTO
        </div>
        <div className="grid gap-1 text-sm">
          <p className="text-xl font-semibold">{card.holderName}</p>
          <p>{categoryLabels[card.category]}</p>
          <p className="font-mono text-xs">{card.cardNumber}</p>
          <p>
            Valid {formatDate(card.validFrom)} to {formatDate(card.validTo)}
          </p>
          <Badge className="w-fit bg-primary">{card.state.toUpperCase()}</Badge>
        </div>
      </div>
      <div className="flex items-center justify-between border-t pt-4">
        <QRCodeSVG
          size={88}
          value={`${window.location.origin}${card.qrPayload}`}
        />
        <div className="text-right text-xs text-muted-foreground">
          <p>Scan for public verification</p>
          <p>Template accent: {categoryConfig[card.category].accent}</p>
        </div>
      </div>
    </div>
  );
}

export function CardPage() {
  const [params] = useSearchParams();
  const numberFromQuery = params.get("card");
  const pathnameCard = window.location.pathname.split("/").at(-1) ?? "";
  const cards = useDemoStore((state) => state.cards);
  const card =
    cards.find(
      (item) => item.cardNumber === (numberFromQuery ?? pathnameCard),
    ) ?? cards[0];
  return (
    <div>
      {pageTitle(
        "Accreditation Card",
        "Official printable card with a scannable QR code routed to public verification.",
      )}
      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <CardArt card={card} />
        <Card className="no-print shadow-none">
          <CardHeader>
            <CardTitle>Export</CardTitle>
            <CardDescription>
              Use print to save as PDF in the browser.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print / Download PDF
            </Button>
            <Button asChild variant="outline">
              <Link to={`/verify?card=${card.cardNumber}`}>
                <BadgeCheck className="h-4 w-4" />
                Verify card
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function VerifyPage() {
  const [params] = useSearchParams();
  const [cardNumber, setCardNumber] = useState(
    params.get("card") ?? "BEC-CARD-2026-0006",
  );
  const [result, setResult] = useState<AccreditationCard | null | "not-found">(
    null,
  );

  const verify = async () => {
    const card = await mockApi.verifyCard(cardNumber);
    setResult(card ?? "not-found");
  };

  useEffect(() => {
    const queryCard = params.get("card");
    if (!queryCard) return;
    void mockApi
      .verifyCard(queryCard)
      .then((card) => setResult(card ?? "not-found"));
  }, [params]);

  return (
    <div>
      {pageTitle(
        "Public Card Verification",
        "Enter a card number or scan a QR code to confirm VALID, EXPIRED, REVOKED, or NOT FOUND.",
      )}
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Lookup</CardTitle>
            <CardDescription>
              Try BEC-CARD-2026-0006, 0009, 0999, or any unknown number.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Label>Card number</Label>
            <Input
              onChange={(event) => setCardNumber(event.target.value)}
              value={cardNumber}
            />
            <Button onClick={() => void verify()}>
              <Search className="h-4 w-4" />
              Verify
            </Button>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardContent className="p-6">
            {result === null ? (
              <div className="rounded-lg border bg-accent p-6 text-muted-foreground">
                <p className="text-lg font-semibold text-foreground">
                  Ready to verify
                </p>
                <p>
                  Enter a card number and select Verify to display the public
                  result.
                </p>
              </div>
            ) : result === "not-found" ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
                <p className="text-2xl font-semibold">NOT FOUND</p>
                <p>No accreditation card matches this number.</p>
              </div>
            ) : (
              <div
                className={cn(
                  "rounded-lg border p-6",
                  result.state === "valid" &&
                    "border-green-200 bg-green-50 text-primary-dark",
                  result.state === "expired" &&
                    "border-amber-200 bg-amber-50 text-amber-800",
                  result.state === "revoked" &&
                    "border-red-200 bg-red-50 text-red-700",
                )}
              >
                <p className="text-3xl font-semibold">
                  {result.state.toUpperCase()}
                </p>
                <p className="mt-3 text-lg">{result.holderName}</p>
                <p>{categoryLabels[result.category]}</p>
                <p className="font-mono text-sm">{result.cardNumber}</p>
                <p className="mt-2 text-sm">
                  Valid {formatDate(result.validFrom)} to{" "}
                  {formatDate(result.validTo)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function ReportsPage() {
  const role = useDemoStore((state) => state.activeRole);
  const user = useDemoStore(getCurrentUser);
  const allApplications = useDemoStore((state) => state.applications);
  const applications = allApplications.filter((item) =>
    role === "returning_officer"
      ? item.jurisdiction === user.jurisdiction
      : true,
  );
  const [status, setStatus] = useState<Status | "all">("all");
  const [jurisdiction, setJurisdiction] = useState("all");
  const filtered = applications.filter(
    (item) =>
      (status === "all" || item.status === status) &&
      (jurisdiction === "all" || item.jurisdiction === jurisdiction),
  );
  const byStatus = Object.entries(
    filtered
      .filter((item) => item.status !== "draft")
      .reduce<Record<string, number>>(
        (acc, item) => ({
          ...acc,
          [statusLabels[item.status]]:
            (acc[statusLabels[item.status]] ?? 0) + 1,
        }),
        {},
      ),
  ).map(([name, value]) => ({ name, value }));
  const byCategory = Object.entries(
    filtered.reduce<Record<string, number>>(
      (acc, item) => ({
        ...acc,
        [categoryLabels[item.category]]:
          (acc[categoryLabels[item.category]] ?? 0) + 1,
      }),
      {},
    ),
  ).map(([name, value]) => ({ name, value }));

  const exportCsv = () => {
    const csv = toCsv(
      filtered.map((item) => ({
        reference: item.refNo,
        applicant: applicationOwner(item),
        category: categoryLabels[item.category],
        status: statusLabels[item.status],
        jurisdiction: item.jurisdiction,
      })),
    );
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "bec-accreditation-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {pageTitle(
        "Dashboard & Reporting",
        "Role-aware KPIs, filters, charts, CSV export, and print-ready tables.",
      )}
      <div className="grid gap-3 md:grid-cols-5">
        <KpiCard icon={Users} label="Total" value={filtered.length} />
        <KpiCard
          icon={Filter}
          label="Pending"
          value={
            filtered.filter((item) =>
              ["submitted", "under_review"].includes(item.status),
            ).length
          }
        />
        <KpiCard
          icon={BadgeCheck}
          label="Approved"
          value={filtered.filter((item) => item.status === "approved").length}
        />
        <KpiCard
          icon={FileDown}
          label="Rejected"
          value={filtered.filter((item) => item.status === "rejected").length}
        />
        <KpiCard
          icon={IdCard}
          label="Cards issued"
          value={
            filtered.filter((item) => item.status === "card_issued").length
          }
        />
      </div>
      <Card className="mt-6">
        <CardContent className="grid gap-3 p-5 md:grid-cols-[1fr_1fr_auto_auto]">
          <select
            className="h-10 rounded-md border bg-card px-3 text-sm"
            onChange={(event) =>
              setStatus(event.target.value as Status | "all")
            }
            value={status}
          >
            <option value="all">All statuses</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-card px-3 text-sm"
            onChange={(event) => setJurisdiction(event.target.value)}
            value={jurisdiction}
          >
            <option value="all">All jurisdictions</option>
            {Array.from(
              new Set(applications.map((item) => item.jurisdiction)),
            ).map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Button onClick={exportCsv} variant="outline">
            <Download className="h-4 w-4" />
            CSV
          </Button>
          <Button onClick={() => window.print()} variant="outline">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </CardContent>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Mix</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#006A4E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={95}
                >
                  {byCategory.map((entry, index) => (
                    <Cell
                      fill={
                        ["#006A4E", "#C9A227", "#2563EB", "#D97706", "#F42A41"][
                          index % 5
                        ]
                      }
                      key={entry.name}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6 shadow-none">
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Reference</TH>
                <TH>Applicant</TH>
                <TH>Category</TH>
                <TH>Jurisdiction</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((item) => (
                <TR key={item.id}>
                  <TD>{item.refNo}</TD>
                  <TD>{applicationOwner(item)}</TD>
                  <TD>{categoryLabels[item.category]}</TD>
                  <TD>{item.jurisdiction}</TD>
                  <TD>
                    <StatusBadge status={item.status} />
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function SuperAdminDashboardPage() {
  const applications = useDemoStore((state) => state.applications);
  const masterData = useDemoStore((state) => state.masterData);
  const [status, setStatus] = useState<Status | "all">("all");
  const [jurisdiction, setJurisdiction] = useState("all");
  const [category, setCategory] = useState<Category | "all">("all");
  const [authority, setAuthority] = useState<"all" | "central" | "local">(
    "all",
  );
  const filtered = applications.filter((item) => {
    const categoryRule = categoryConfig[item.category];
    return (
      (status === "all" || item.status === status) &&
      (jurisdiction === "all" || item.jurisdiction === jurisdiction) &&
      (category === "all" || item.category === category) &&
      (authority === "all" || categoryRule.authority === authority)
    );
  });
  const byJurisdiction = Object.entries(
    filtered.reduce<Record<string, number>>(
      (acc, item) => ({
        ...acc,
        [item.jurisdiction]: (acc[item.jurisdiction] ?? 0) + 1,
      }),
      {},
    ),
  ).map(([name, value]) => ({ name, value }));
  const byStatus = Object.entries(
    filtered.reduce<Record<string, number>>(
      (acc, item) => ({
        ...acc,
        [statusLabels[item.status]]: (acc[statusLabels[item.status]] ?? 0) + 1,
      }),
      {},
    ),
  ).map(([name, value]) => ({ name, value }));

  const exportDashboard = () =>
    downloadCsv(
      "superadmin-dashboard.csv",
      filtered.map((item) => ({
        reference: item.refNo,
        applicant: applicationOwner(item),
        category: categoryLabels[item.category],
        jurisdiction: item.jurisdiction,
        status: statusLabels[item.status],
        authority: categoryConfig[item.category].authority,
      })),
    );

  return (
    <div>
      {pageTitle(
        "Super Admin Dashboard",
        "System-wide KPIs, filters, analytics, CSV export, and print-ready reporting.",
      )}
      <div className="grid gap-3 md:grid-cols-5">
        <KpiCard icon={Users} label="Applications" value={filtered.length} />
        <KpiCard
          icon={BadgeCheck}
          label="Cards issued"
          value={
            filtered.filter((item) => item.status === "card_issued").length
          }
        />
        <KpiCard
          icon={Filter}
          label="Jurisdictions"
          value={masterData.jurisdictions.length}
        />
        <KpiCard
          icon={FileCheck2}
          label="Categories"
          value={categoryKeys.length}
        />
        <KpiCard
          icon={LockKeyhole}
          label="Admin roles"
          value={managedAdminRoles.length + 1}
        />
      </div>
      <Card className="mt-6">
        <CardContent className="grid gap-3 p-5 md:grid-cols-5">
          <select
            className="h-10 rounded-md border bg-card px-3 text-sm"
            onChange={(event) =>
              setStatus(event.target.value as Status | "all")
            }
            value={status}
          >
            <option value="all">All statuses</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-card px-3 text-sm"
            onChange={(event) => setJurisdiction(event.target.value)}
            value={jurisdiction}
          >
            <option value="all">All jurisdictions</option>
            {masterData.jurisdictions.map((item) => (
              <option key={item.id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-card px-3 text-sm"
            onChange={(event) =>
              setCategory(event.target.value as Category | "all")
            }
            value={category}
          >
            <option value="all">All categories</option>
            {categoryKeys.map((item) => (
              <option key={item} value={item}>
                {categoryLabels[item]}
              </option>
            ))}
          </select>
          <select
            className="h-10 rounded-md border bg-card px-3 text-sm"
            onChange={(event) =>
              setAuthority(event.target.value as "all" | "central" | "local")
            }
            value={authority}
          >
            <option value="all">All authority</option>
            <option value="central">Central</option>
            <option value="local">Local</option>
          </select>
          <div className="flex gap-2">
            <Button onClick={exportDashboard} variant="outline">
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button onClick={() => window.print()} variant="outline">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jurisdiction volume</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={byJurisdiction}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#006A4E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Status distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#C9A227" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SuperAdminUsersPage() {
  const users = useDemoStore((state) => state.users);
  const masterData = useDemoStore((state) => state.masterData);
  const actor = useDemoStore(getCurrentUser);
  const [draft, setDraft] = useState<UserAccount>({
    id: uid("admin"),
    role: "central_admin",
    name: "",
    email: "",
    jurisdiction: "Dhaka",
    status: "active",
    lastLogin: new Date().toISOString(),
  });
  const adminUsers = users.filter((user) =>
    managedAdminRoles.includes(user.role),
  );
  const save = async () => {
    await mockApi.saveAdminUser(draft, actor.name);
    setDraft({ ...draft, id: uid("admin"), name: "", email: "" });
  };
  const quickUpdate = (
    user: UserAccount,
    patch: Partial<UserAccount>,
    action: string,
  ) => {
    void mockApi.saveAdminUser({ ...user, ...patch }, actor.name);
    useDemoStore.getState().addAudit({
      id: uid("audit"),
      actor: actor.name,
      action,
      target: user.name,
      at: new Date().toISOString(),
    });
  };

  return (
    <div>
      {pageTitle(
        "User & Role Management",
        "Create, edit, deactivate, lock/unlock, assign roles, and manage simulated permissions.",
      )}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <Card className="shadow-none">
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Role</TH>
                  <TH>Jurisdiction</TH>
                  <TH>Status</TH>
                  <TH>Last login</TH>
                  <TH>Actions</TH>
                </TR>
              </THead>
              <TBody>
                {adminUsers.map((user) => (
                  <TR key={user.id}>
                    <TD>{user.name}</TD>
                    <TD>{roleLabels[user.role]}</TD>
                    <TD>{user.jurisdiction ?? "-"}</TD>
                    <TD>{user.status ?? "active"}</TD>
                    <TD>{user.lastLogin ? formatDate(user.lastLogin) : "-"}</TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDraft(user)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            quickUpdate(
                              user,
                              {
                                status:
                                  user.status === "locked"
                                    ? "active"
                                    : "locked",
                              },
                              "Locked/unlocked account",
                            )
                          }
                        >
                          {user.status === "locked" ? "Unlock" : "Lock"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            quickUpdate(
                              user,
                              { status: "inactive" },
                              "Deactivated account",
                            )
                          }
                        >
                          Deactivate
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            quickUpdate(user, {}, "Forced password reset")
                          }
                        >
                          Force reset
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Create / edit account</CardTitle>
            <CardDescription>
              Returning Officer jurisdiction drives local application routing.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Label>Name</Label>
            <Input
              value={draft.name}
              onChange={(event) =>
                setDraft({ ...draft, name: event.target.value })
              }
            />
            <Label>Email</Label>
            <Input
              value={draft.email ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, email: event.target.value })
              }
            />
            <Label>Role</Label>
            <select
              className="h-10 rounded-md border bg-card px-3 text-sm"
              value={draft.role}
              onChange={(event) =>
                setDraft({ ...draft, role: event.target.value as Role })
              }
            >
              {managedAdminRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
            <Label>Jurisdiction</Label>
            <select
              className="h-10 rounded-md border bg-card px-3 text-sm"
              value={draft.jurisdiction ?? ""}
              onChange={(event) =>
                setDraft({ ...draft, jurisdiction: event.target.value })
              }
            >
              {masterData.jurisdictions.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
            <Label>Status</Label>
            <select
              className="h-10 rounded-md border bg-card px-3 text-sm"
              value={draft.status ?? "active"}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  status: event.target.value as UserAccount["status"],
                })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="locked">Locked</option>
            </select>
            <Button onClick={() => void save()}>Save account</Button>
          </CardContent>
        </Card>
      </div>
      <Card className="mt-6 shadow-none">
        <CardHeader>
          <CardTitle>Permission matrix</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(permissionMatrix).map(([role, permissions]) => (
            <div className="rounded-lg border p-4" key={role}>
              <p className="font-semibold">{role}</p>
              <div className="mt-3 grid gap-2">
                {permissions.map((permission) => (
                  <label
                    className="flex items-center gap-2 text-sm"
                    key={permission}
                  >
                    <input
                      defaultChecked
                      type="checkbox"
                      className="accent-primary"
                    />
                    {permission}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function SuperAdminSettingsPage() {
  const settings = useDemoStore((state) => state.systemSettings);
  const actor = useDemoStore(getCurrentUser);
  const [draft, setDraft] = useState(settings);
  const [message, setMessage] = useState("");
  const save = async () => {
    await mockApi.updateSystemSettings(draft, actor.name);
    setMessage("System configuration saved.");
  };

  return (
    <div>
      {pageTitle(
        "System Configuration",
        "Configure accreditation cycle, numbering rules, portal contact details, and verification access mode.",
      )}
      <Card className="max-w-3xl shadow-soft">
        <CardContent className="grid gap-4 p-6 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label>Accreditation cycle / event</Label>
            <Input
              value={draft.eventName}
              onChange={(event) =>
                setDraft({ ...draft, eventName: event.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Application open date</Label>
            <Input
              type="date"
              value={draft.applicationOpenDate}
              onChange={(event) =>
                setDraft({ ...draft, applicationOpenDate: event.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Application close date</Label>
            <Input
              type="date"
              value={draft.applicationCloseDate}
              onChange={(event) =>
                setDraft({ ...draft, applicationCloseDate: event.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Card validity days</Label>
            <Input
              type="number"
              value={draft.cardValidityDays}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  cardValidityDays: Number(event.target.value),
                })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Reference number format</Label>
            <Input
              value={draft.referenceFormat}
              onChange={(event) =>
                setDraft({ ...draft, referenceFormat: event.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Card number format</Label>
            <Input
              value={draft.cardNumberFormat}
              onChange={(event) =>
                setDraft({ ...draft, cardNumberFormat: event.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Portal logo label</Label>
            <Input
              value={draft.portalLogo}
              onChange={(event) =>
                setDraft({ ...draft, portalLogo: event.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Contact email</Label>
            <Input
              value={draft.contactEmail}
              onChange={(event) =>
                setDraft({ ...draft, contactEmail: event.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Verification access mode</Label>
            <select
              className="h-10 rounded-md border bg-card px-3 text-sm"
              value={draft.verificationAccessMode}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  verificationAccessMode: event.target.value as
                    | "public"
                    | "gated",
                })
              }
            >
              <option value="public">Public</option>
              <option value="gated">Gated</option>
            </select>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={draft.emailEnabled}
                onChange={(event) =>
                  setDraft({ ...draft, emailEnabled: event.target.checked })
                }
                type="checkbox"
                className="accent-primary"
              />
              Email enabled
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                checked={draft.smsEnabled}
                onChange={(event) =>
                  setDraft({ ...draft, smsEnabled: event.target.checked })
                }
                type="checkbox"
                className="accent-primary"
              />
              SMS enabled
            </label>
          </div>
          {message ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 md:col-span-2">
              {message}
            </div>
          ) : null}
          <Button className="md:col-span-2" onClick={() => void save()}>
            Save system configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function SuperAdminApplicationsPage() {
  const applications = useDemoStore((state) => state.applications);
  const users = useDemoStore((state) => state.users);
  const actor = useDemoStore(getCurrentUser);
  const reviewers = users.filter(
    (user) =>
      user.role === "central_admin" || user.role === "returning_officer",
  );
  const reassign = (application: Application, jurisdiction: string) => {
    const updated = {
      ...application,
      jurisdiction,
      updatedAt: new Date().toISOString(),
    };
    useDemoStore.getState().upsertApplication(updated);
    useDemoStore.getState().addAudit({
      id: uid("audit"),
      actor: actor.name,
      action: "Reassigned application jurisdiction",
      target: application.refNo,
      at: new Date().toISOString(),
    });
  };

  return (
    <div>
      {pageTitle(
        "Workflow Oversight",
        "System-wide application view across every jurisdiction and category with reassignment and override tools.",
      )}
      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Reference</TH>
                <TH>Applicant</TH>
                <TH>Category</TH>
                <TH>Jurisdiction</TH>
                <TH>Status</TH>
                <TH>Reviewer</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {applications.map((application) => (
                <TR key={application.id}>
                  <TD className="font-medium">{application.refNo}</TD>
                  <TD>{applicationOwner(application)}</TD>
                  <TD>{categoryLabels[application.category]}</TD>
                  <TD>
                    <Input
                      className="h-8 min-w-28"
                      value={application.jurisdiction}
                      onChange={(event) =>
                        reassign(application, event.target.value)
                      }
                    />
                  </TD>
                  <TD>
                    <StatusBadge status={application.status} />
                  </TD>
                  <TD>
                    <select
                      className="h-8 rounded-md border bg-card px-2 text-xs"
                      onChange={(event) =>
                        useDemoStore.getState().addAudit({
                          id: uid("audit"),
                          actor: actor.name,
                          action: "Reassigned reviewer",
                          target: `${application.refNo} to ${event.target.value}`,
                          at: new Date().toISOString(),
                        })
                      }
                    >
                      <option>Assign reviewer</option>
                      {reviewers.map((reviewer) => (
                        <option key={reviewer.id}>{reviewer.name}</option>
                      ))}
                    </select>
                  </TD>
                  <TD>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`/superadmin/applications/${application.id}`}>
                        Review
                      </Link>
                    </Button>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function SuperAdminCardsPage() {
  const cards = useDemoStore((state) => state.cards);
  const actor = useDemoStore(getCurrentUser);
  const updateCard = (
    card: AccreditationCard,
    state: AccreditationCard["state"],
  ) => {
    void mockApi.updateCardState(card.id, state, actor.name);
  };

  return (
    <div>
      {pageTitle(
        "Card Lifecycle",
        "Super-admin-only card actions: revoke, suspend, reissue, and extend validity. Revocation is reflected live on public verification.",
      )}
      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Card</TH>
                <TH>Holder</TH>
                <TH>Category</TH>
                <TH>Validity</TH>
                <TH>State</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {cards.map((card) => (
                <TR key={card.id}>
                  <TD className="font-mono text-xs">{card.cardNumber}</TD>
                  <TD>{card.holderName}</TD>
                  <TD>{categoryLabels[card.category]}</TD>
                  <TD>
                    {formatDate(card.validFrom)} - {formatDate(card.validTo)}
                  </TD>
                  <TD>
                    <Badge
                      variant={
                        card.state === "revoked" ? "destructive" : "secondary"
                      }
                    >
                      {card.state.toUpperCase()}
                    </Badge>
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => updateCard(card, "revoked")}
                      >
                        Revoke
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCard(card, "expired")}
                      >
                        Suspend
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateCard(card, "valid")}
                      >
                        Reissue
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const extended = {
                            ...card,
                            validTo: new Date(
                              Date.now() + 1000 * 60 * 60 * 24 * 180,
                            ).toISOString(),
                          };
                          useDemoStore.getState().upsertCard(extended);
                          useDemoStore.getState().addAudit({
                            id: uid("audit"),
                            actor: actor.name,
                            action: "Extended card validity",
                            target: card.cardNumber,
                            at: new Date().toISOString(),
                          });
                        }}
                      >
                        Extend
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function MasterTable<T extends { id: string }>({
  title,
  rows,
  createRow,
  onAdd,
}: {
  title: string;
  rows: T[];
  createRow: (draft: Record<string, string>) => T;
  onAdd: (row: T) => void;
}) {
  const keys = rows[0]
    ? (Object.keys(rows[0]).filter((key) => key !== "id") as Array<
        Extract<keyof T, string>
      >)
    : [];
  const [draft, setDraft] = useState<Record<string, string>>({});
  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <Table>
          <THead>
            <TR>
              {keys.map((key) => (
                <TH key={String(key)}>{String(key)}</TH>
              ))}
            </TR>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR key={row.id}>
                {keys.map((key) => (
                  <TD key={key}>{String(row[key] ?? "")}</TD>
                ))}
              </TR>
            ))}
          </TBody>
        </Table>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4" />
              Add row
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add {title}</DialogTitle>
              <DialogDescription>
                Seeded demo CRUD is persisted to localStorage.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              {keys.map((key) => (
                <div className="grid gap-2" key={String(key)}>
                  <Label>{String(key)}</Label>
                  <Input
                    onChange={(event) =>
                      setDraft({ ...draft, [String(key)]: event.target.value })
                    }
                  />
                </div>
              ))}
              <Button
                onClick={() => {
                  onAdd(createRow(draft));
                }}
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export function MasterDataPage() {
  const masterData = useDemoStore((state) => state.masterData);
  const cards = useDemoStore((state) => state.cards);
  const user = useDemoStore(getCurrentUser);
  const update = async (next: MasterData) => {
    await mockApi.updateMasterData(next, user.name);
  };

  return (
    <div>
      {pageTitle(
        "Database & Directory / Master Data",
        "Editable seeded tables for BEC back-office configuration plus a read-only accreditation holders directory.",
      )}
      <Tabs defaultValue="outlets">
        <TabsList className="mb-4 flex flex-wrap">
          <TabsTrigger value="outlets">Media Outlets</TabsTrigger>
          <TabsTrigger value="orgs">Observer Orgs</TabsTrigger>
          <TabsTrigger value="jurisdictions">Jurisdictions</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="templates">Card Templates</TabsTrigger>
          <TabsTrigger value="fields">Form Fields</TabsTrigger>
          <TabsTrigger value="holders">Holders</TabsTrigger>
        </TabsList>
        <TabsContent value="outlets">
          <MasterTable
            createRow={(draft) => ({
              id: uid("mo"),
              name: draft.name ?? "New outlet",
              type: draft.type ?? "Media",
              contact: draft.contact ?? "contact@example.com",
            })}
            rows={masterData.mediaOutlets}
            title="Media Outlets"
            onAdd={(row) =>
              void update({
                ...masterData,
                mediaOutlets: [...masterData.mediaOutlets, row],
              })
            }
          />
        </TabsContent>
        <TabsContent value="orgs">
          <MasterTable
            createRow={(draft) => ({
              id: uid("oo"),
              name: draft.name ?? "New organization",
              scope: draft.scope ?? "Domestic",
              contact: draft.contact ?? "contact@example.com",
            })}
            rows={masterData.observerOrganizations}
            title="Observer Organizations"
            onAdd={(row) =>
              void update({
                ...masterData,
                observerOrganizations: [
                  ...masterData.observerOrganizations,
                  row,
                ],
              })
            }
          />
        </TabsContent>
        <TabsContent value="jurisdictions">
          <MasterTable
            createRow={(draft) => ({
              id: uid("j"),
              name: draft.name ?? "New jurisdiction",
              region: draft.region ?? "Region",
            })}
            rows={masterData.jurisdictions}
            title="Jurisdictions"
            onAdd={(row) =>
              void update({
                ...masterData,
                jurisdictions: [...masterData.jurisdictions, row],
              })
            }
          />
        </TabsContent>
        <TabsContent value="rules">
          <Card className="shadow-none">
            <CardContent className="p-0">
              <Table>
                <THead>
                  <TR>
                    <TH>Category</TH>
                    <TH>Authority</TH>
                    <TH>Document rules</TH>
                    <TH>Allowed type / max size</TH>
                  </TR>
                </THead>
                <TBody>
                  {masterData.categoryRules.map((rule) => (
                    <TR key={rule.id}>
                      <TD>{rule.label}</TD>
                      <TD>{rule.authority}</TD>
                      <TD>
                        <div className="flex flex-wrap gap-2">
                          {rule.documents.map((document) => (
                            <button
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs font-semibold",
                                document.required
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "text-muted-foreground",
                              )}
                              key={document.type}
                              onClick={() =>
                                void update({
                                  ...masterData,
                                  categoryRules: masterData.categoryRules.map(
                                    (item) =>
                                      item.id === rule.id
                                        ? {
                                            ...item,
                                            documents: item.documents.map(
                                              (doc) =>
                                                doc.type === document.type
                                                  ? {
                                                      ...doc,
                                                      required: !doc.required,
                                                    }
                                                  : doc,
                                            ),
                                          }
                                        : item,
                                  ),
                                })
                              }
                              type="button"
                            >
                              {document.type}:{" "}
                              {document.required ? "Mandatory" : "Optional"}
                            </button>
                          ))}
                        </div>
                      </TD>
                      <TD className="text-sm text-muted-foreground">
                        {categoryConfig[rule.id].documents
                          .map(
                            (document) => `${document.label}: ${document.rule}`,
                          )
                          .join("; ")}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="templates">
          <MasterTable
            createRow={(draft) => ({
              id: uid("tpl"),
              name: draft.name ?? "New Template",
              category: (draft.category as Category) ?? "domestic_journalist",
              accent: draft.accent ?? "#006A4E",
            })}
            rows={masterData.cardTemplates}
            title="Card Templates"
            onAdd={(row) =>
              void update({
                ...masterData,
                cardTemplates: [...masterData.cardTemplates, row],
              })
            }
          />
        </TabsContent>
        <TabsContent value="fields">
          <Card className="shadow-none">
            <CardContent className="p-0">
              <Table>
                <THead>
                  <TR>
                    <TH>Category</TH>
                    <TH>Dynamic fields</TH>
                  </TR>
                </THead>
                <TBody>
                  {categoryKeys.map((key) => (
                    <TR key={key}>
                      <TD>{categoryLabels[key]}</TD>
                      <TD>
                        {categoryConfig[key].fields
                          .map(
                            (field) =>
                              `${field.label}${field.required ? "*" : ""}`,
                          )
                          .join(", ")}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="holders">
          <Card className="shadow-none">
            <CardContent className="p-0">
              <Table>
                <THead>
                  <TR>
                    <TH>Card</TH>
                    <TH>Holder</TH>
                    <TH>Category</TH>
                    <TH>State</TH>
                  </TR>
                </THead>
                <TBody>
                  {cards.map((card) => (
                    <TR key={card.id}>
                      <TD>{card.cardNumber}</TD>
                      <TD>{card.holderName}</TD>
                      <TD>{categoryLabels[card.category]}</TD>
                      <TD>{card.state}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function NotificationsPage() {
  const notifications = useDemoStore((state) => state.notifications);
  const settings = useDemoStore((state) => state.systemSettings);
  const actor = useDemoStore(getCurrentUser);
  const updateSettings = (patch: Partial<typeof settings>) => {
    void mockApi.updateSystemSettings({ ...settings, ...patch }, actor.name);
  };
  const templates = [
    ["registration", "Welcome to the BEC accreditation portal."],
    ["submission", "Your accreditation application has been submitted."],
    ["approval", "Your accreditation application has been approved."],
    ["rejection", "Your accreditation application requires attention."],
    ["card issuance", "Your accreditation card is ready for download."],
  ];
  return (
    <div>
      {pageTitle(
        "Notification Module",
        "Simulated email/SMS settings, live toasts, and a complete notification log.",
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="shadow-none">
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>Type</TH>
                  <TH>Message</TH>
                  <TH>Date</TH>
                </TR>
              </THead>
              <TBody>
                {notifications.map((note) => (
                  <TR key={note.id}>
                    <TD>{note.type}</TD>
                    <TD>{note.message}</TD>
                    <TD>{formatDate(note.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Simulated channels</CardTitle>
            <CardDescription>
              Clearly labelled offline templates, no real SMS or email is sent.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={settings.emailEnabled}
                  className="accent-primary"
                  onChange={(event) =>
                    updateSettings({ emailEnabled: event.target.checked })
                  }
                  type="checkbox"
                />
                Email
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  checked={settings.smsEnabled}
                  className="accent-primary"
                  onChange={(event) =>
                    updateSettings({ smsEnabled: event.target.checked })
                  }
                  type="checkbox"
                />
                SMS
              </label>
            </div>
            {templates.map(([trigger, template]) => (
              <div className="rounded-md border p-3" key={trigger}>
                <Mail className="mb-2 h-4 w-4 text-primary" />
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {trigger}
                </p>
                <p className="mt-1 text-sm">{template}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function AuditPage() {
  const audit = useDemoStore((state) => state.audit);
  const [query, setQuery] = useState("");
  const filtered = audit.filter((entry) =>
    [entry.actor, entry.action, entry.target ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const exportAudit = () =>
    downloadCsv(
      "superadmin-audit-log.csv",
      filtered.map((entry) => ({
        actor: entry.actor,
        action: entry.action,
        target: entry.target ?? "",
        timestamp: entry.at,
      })),
    );
  return (
    <div>
      {pageTitle(
        "Audit Log",
        "A seeded and live-updating record of key demo actions.",
      )}
      <Card className="mb-4 shadow-none">
        <CardContent className="flex flex-wrap gap-2 p-4">
          <Input
            className="max-w-sm"
            placeholder="Search actor, action, or target"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button onClick={exportAudit} variant="outline">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Actor</TH>
                <TH>Action</TH>
                <TH>Target</TH>
                <TH>Date</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.map((entry) => (
                <TR key={entry.id}>
                  <TD>{entry.actor}</TD>
                  <TD>{entry.action}</TD>
                  <TD>{entry.target}</TD>
                  <TD>{formatDate(entry.at)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export function AboutPage() {
  return (
    <div>
      {pageTitle(
        "About / Project",
        "Deployment, training, documentation, source handover, and IFES support are represented here as the non-screen SOW module.",
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {[
          [
            "BEC infrastructure deployment",
            "Prepared for controlled hosting in BEC infrastructure with a backend service seam ready for integration.",
          ],
          [
            "Training and handover",
            "Role-based training flows cover applicant, central, local, super administrator, and verifier workflows.",
          ],
          [
            "Documentation",
            "Source handover, category rules, card templates, and mock API contracts are organized for future backend replacement.",
          ],
          [
            "Scope exclusions",
            "No native mobile app, payments, AI identity verification, or external NID/passport integrations are included.",
          ],
        ].map(([title, description]) => (
          <Card className="shadow-none" key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <Card className="mx-auto max-w-xl text-center">
      <CardHeader>
        <CardTitle>Page not found</CardTitle>
        <CardDescription>
          The accreditation demo route does not exist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link to="/">Return home</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
