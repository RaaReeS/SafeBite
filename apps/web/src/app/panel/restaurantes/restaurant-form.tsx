"use client";

import { slugify } from "@safebite/core";
import { useActionState, useId, useState } from "react";
import { FormStatus } from "@/components/form-status";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import { initialFormState, type FormState } from "@/lib/forms";

type RestaurantFormValues = {
  name: string;
  slug: string;
  city: string;
  address: string | null;
  phone: string | null;
  contact_email: string | null;
};

type RestaurantFormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  siteUrl: string;
  /** Ausente al crear. Al editar, los valores guardados. */
  initial?: RestaurantFormValues;
  /** Si la carta está publicada, cambiar la dirección exige confirmación. */
  published?: boolean;
  /** Si está verificado, se avisa de que cambiar nombre, ciudad o dirección exige verificarlo de nuevo. */
  verified?: boolean;
};

export function RestaurantForm({
  action,
  siteUrl,
  initial,
  published = false,
  verified = false,
}: RestaurantFormProps) {
  const t = getMessages();
  const isEdit = initial !== undefined;
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  // Al crear, la dirección se genera del nombre hasta que el usuario la edita.
  const [slugEdited, setSlugEdited] = useState(isEdit);
  const confirmId = useId();

  const value = (field: keyof RestaurantFormValues) =>
    state.values?.[field] ?? initial?.[field] ?? undefined;
  const slugChanged = isEdit && published && slug !== initial.slug;
  const confirmError = state.fieldErrors?.confirm_slug_change;

  return (
    <form action={formAction} aria-label={t.restaurant.details} className="flex flex-col gap-4">
      {isEdit && verified ? (
        <p className="text-sm text-muted">{t.verification.identityChangeWarning}</p>
      ) : null}
      <FormStatus state={state} />
      <TextField
        label={t.restaurant.name}
        name="name"
        required
        maxLength={120}
        value={name}
        onChange={(event) => {
          setName(event.target.value);
          if (!slugEdited) setSlug(slugify(event.target.value));
        }}
        error={state.fieldErrors?.name}
      />
      <TextField
        label={t.restaurant.slug}
        name="slug"
        required
        maxLength={80}
        value={slug}
        onChange={(event) => {
          setSlugEdited(true);
          setSlug(event.target.value);
        }}
        hint={
          <>
            {t.restaurant.slugHint}{" "}
            <span className="font-mono">
              {siteUrl}/r/{slug || "…"}
            </span>
          </>
        }
        error={state.fieldErrors?.slug}
      />
      {slugChanged ? (
        <div className="flex flex-col gap-2">
          <Alert tone="warning">{t.restaurant.slugChangeWarning}</Alert>
          <div className="flex items-start gap-2">
            <input
              id={confirmId}
              name="confirm_slug_change"
              type="checkbox"
              aria-invalid={confirmError ? true : undefined}
              className="mt-1 size-4 accent-primary"
            />
            <label htmlFor={confirmId} className="text-sm">
              {t.restaurant.slugChangeConfirm}
            </label>
          </div>
          {confirmError ? (
            <p className="text-sm font-semibold text-danger">{confirmError}</p>
          ) : null}
        </div>
      ) : null}
      <TextField
        label={t.restaurant.city}
        name="city"
        required
        maxLength={100}
        defaultValue={value("city")}
        error={state.fieldErrors?.city}
      />
      <TextField
        label={`${t.restaurant.address} ${t.restaurant.optional}`}
        name="address"
        maxLength={200}
        autoComplete="street-address"
        defaultValue={value("address")}
        error={state.fieldErrors?.address}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={`${t.restaurant.phone} ${t.restaurant.optional}`}
          name="phone"
          type="tel"
          maxLength={30}
          autoComplete="tel"
          defaultValue={value("phone")}
          error={state.fieldErrors?.phone}
        />
        <TextField
          label={`${t.restaurant.contactEmail} ${t.restaurant.optional}`}
          name="contact_email"
          type="email"
          maxLength={254}
          autoComplete="email"
          defaultValue={value("contact_email")}
          error={state.fieldErrors?.contact_email}
        />
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {isEdit
            ? pending
              ? t.restaurant.saving
              : t.restaurant.save
            : pending
              ? t.restaurant.creating
              : t.restaurant.create}
        </Button>
      </div>
    </form>
  );
}
