import type { Metadata } from "next";
import { getMessages } from "@/i18n";
import { requireAdmin } from "@/lib/auth";
import { setAccountPlan } from "./actions";
import { PlanForm } from "./plan-form";

export const metadata: Metadata = { title: "Planes · SafeBite" };

export default async function PlansPage() {
  const t = getMessages();
  await requireAdmin();

  return (
    <>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{t.admin.plans.title}</h1>
        <p className="text-muted">{t.admin.plans.description}</p>
      </div>
      <PlanForm action={setAccountPlan} />
    </>
  );
}
