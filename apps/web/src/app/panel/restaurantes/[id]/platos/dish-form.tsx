"use client";

import { useActionState, useId } from "react";
import { FormStatus } from "@/components/form-status";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import { initialFormState, type FormState } from "@/lib/forms";

export type DishFormValues = {
  name: string;
  description: string;
  price: string;
  category: string;
  ingredients: string;
  is_active: boolean;
};

type DishFormProps = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Ausente al crear. */
  initial?: DishFormValues;
  /** Categorías ya usadas en la carta (sugerencias). */
  categories: string[];
};

export function DishForm({ action, initial, categories }: DishFormProps) {
  const t = getMessages();
  const isEdit = initial !== undefined;
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const categoriesId = useId();
  const activeId = useId();

  const value = (field: Exclude<keyof DishFormValues, "is_active">) =>
    state.values?.[field] ?? initial?.[field] ?? "";
  const isActive =
    state.values?.is_active !== undefined
      ? state.values.is_active === "on"
      : (initial?.is_active ?? true);

  return (
    <form action={formAction} aria-label={t.dishes.details} className="flex flex-col gap-4">
      <FormStatus state={state} />
      <TextField
        label={t.dishes.name}
        name="name"
        required
        maxLength={120}
        defaultValue={value("name")}
        error={state.fieldErrors?.name}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label={`${t.dishes.price} ${t.restaurant.optional}`}
          name="price"
          inputMode="decimal"
          hint={t.dishes.priceHint}
          defaultValue={value("price")}
          error={state.fieldErrors?.price}
        />
        <TextField
          label={`${t.dishes.category} ${t.restaurant.optional}`}
          name="category"
          maxLength={60}
          list={categoriesId}
          hint={t.dishes.categoryHint}
          defaultValue={value("category")}
          error={state.fieldErrors?.category}
        />
        <datalist id={categoriesId}>
          {categories.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </div>
      <TextAreaField
        label={`${t.dishes.description} ${t.restaurant.optional}`}
        name="description"
        maxLength={1000}
        defaultValue={value("description")}
        error={state.fieldErrors?.description}
      />
      <TextAreaField
        label={`${t.dishes.ingredients} ${t.restaurant.optional}`}
        name="ingredients"
        maxLength={2000}
        hint={t.dishes.ingredientsHint}
        defaultValue={value("ingredients")}
        error={state.fieldErrors?.ingredients}
      />
      <div className="flex items-center gap-2">
        <input
          id={activeId}
          name="is_active"
          type="checkbox"
          defaultChecked={isActive}
          className="size-4 accent-emerald-700"
        />
        <label htmlFor={activeId} className="text-sm">
          {t.dishes.active}
        </label>
      </div>
      <div>
        <Button type="submit" disabled={pending}>
          {isEdit
            ? pending
              ? t.dishes.saving
              : t.dishes.save
            : pending
              ? t.dishes.creating
              : t.dishes.create}
        </Button>
      </div>
    </form>
  );
}
