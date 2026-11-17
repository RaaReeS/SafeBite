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
        <h1 className="text-2xl font-semibold">{t.admin.plans.title}</h1>
        <p className="text-zinc-700 dark:text-zinc-300">{t.admin.plans.description}</p>
      </div>
      <PlanForm action={setAccountPlan} />
    </>
  );
}
