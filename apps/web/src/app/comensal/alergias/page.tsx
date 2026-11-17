import type { Metadata } from "next";
import { getMessages } from "@/i18n";
import { getMyHealthProfile } from "@/lib/data/health-profile";
import { giveHealthConsent, saveMyAllergens } from "../actions";
import { AllergiesForm, ConsentForm } from "./health-forms";

export const metadata: Metadata = { title: "Mis alergias · SafeBite" };

export default async function AllergiesPage() {
  const t = getMessages();
  const profile = await getMyHealthProfile();

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">{t.diner.allergies.title}</h1>
      {profile.consentGivenAt === null ? (
        <ConsentForm action={giveHealthConsent} />
      ) : (
        <AllergiesForm action={saveMyAllergens} initial={profile.allergens} />
      )}
    </>
  );
}
