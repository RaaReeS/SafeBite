import { ALLERGENS, ALLERGEN_LABELS } from "@safebite/core";

// Página provisional: comprueba que @safebite/core se importa correctamente.
export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold">SafeBite</h1>
      <p>Los 14 alérgenos de declaración obligatoria:</p>
      <ul className="list-disc pl-6">
        {ALLERGENS.map((allergen) => (
          <li key={allergen}>{ALLERGEN_LABELS.es[allergen]}</li>
        ))}
      </ul>
    </main>
  );
}
