"use client";

import {
  ALLERGEN_LABELS,
  centsToPriceInput,
  isUnusualPrice,
  parsePrice,
  type AllergenSuggestion,
  type ImportedDish,
} from "@safebite/core";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { AllergenIcon } from "@/components/menu/allergen-icon";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, Skeleton } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { TextAreaField, TextField } from "@/components/ui/field";
import { getMessages } from "@/i18n";
import { PAGE_FIELD } from "@/lib/menu-import/limits";
import { ACCEPT, PrepareError, prepareImages } from "@/lib/menu-import/prepare-images";
import {
  createImportedDishes,
  readMenu,
  readMenuFromText,
  readMenuFromUrl,
  type ReadMenuState,
} from "./actions";

type ReviewDish = {
  key: number;
  include: boolean;
  name: string;
  price: string;
  category: string;
  description: string;
  ingredients: string;
  suggestions: AllergenSuggestion[];
};

type Source = "files" | "link" | "text";

const SOURCES: Source[] = ["files", "link", "text"];

type Stage = { kind: "select" } | { kind: "reading" } | { kind: "review"; dishes: ReviewDish[] };

function toReview(dishes: ImportedDish[]): ReviewDish[] {
  return dishes.map((dish, key) => ({
    key,
    include: true,
    name: dish.name,
    price: dish.priceCents === null ? "" : centsToPriceInput(dish.priceCents),
    category: dish.category ?? "",
    description: dish.description ?? "",
    ingredients: dish.ingredients ?? "",
    suggestions: dish.suggestions,
  }));
}

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/**
 * Importar la carta: elegir fotos o PDF → leer (IA en el servidor) → revisar →
 * añadir. Los archivos se preparan aquí, en el navegador, y no se guardan.
 */
export function ImportFlow({ restaurantId }: { restaurantId: string }) {
  const t = getMessages().menuImport;
  const [stage, setStage] = useState<Stage>({ kind: "select" });
  // Los archivos se leen del campo al pulsar «Leer la carta» (no del estado):
  // así funciona aunque se elijan antes de que la página termine de cargar.
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [source, setSource] = useState<Source>("files");
  const [link, setLink] = useState("");
  const [pasted, setPasted] = useState("");
  /** Archivos elegidos. Arrastrar o elegir más los suma; cada uno se puede quitar. */
  const [chosen, setChosen] = useState<File[]>([]);
  const addFiles = (files: FileList | null) => {
    const added = Array.from(files ?? []);
    if (added.length === 0) return;
    setChosen((current) => [
      ...current,
      // Sin repetir el mismo archivo si se elige dos veces.
      ...added.filter(
        (file) =>
          !current.some(
            (other) =>
              other.name === file.name &&
              other.size === file.size &&
              other.lastModified === file.lastModified,
          ),
      ),
    ]);
  };
  const removeFile = (index: number) =>
    setChosen((current) => current.filter((_, position) => position !== index));

  // El campo de archivos refleja siempre la lista (por si se lee de él).
  const adopted = useRef(false);
  useEffect(() => {
    const input = fileInput.current;
    if (input === null) return;
    // Al cargar, los archivos elegidos antes de que la página respondiera se
    // quedan en el campo: se adoptan en la lista en vez de borrarlos.
    if (!adopted.current) {
      adopted.current = true;
      if (chosen.length === 0 && (input.files?.length ?? 0) > 0) {
        setChosen(Array.from(input.files ?? []));
        return;
      }
    }
    const transfer = new DataTransfer();
    for (const file of chosen) transfer.items.add(file);
    input.files = transfer.files;
  }, [chosen]);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const inputId = useId();

  /** Lee con la acción que toca; ante cualquier fallo, aviso y de vuelta a elegir. */
  async function run(load: () => Promise<ReadMenuState | null>) {
    setError(null);
    setStage({ kind: "reading" });
    let result: ReadMenuState | null;
    try {
      result = await load();
    } catch {
      // Fallo inesperado (red, tiempo agotado, servidor): nunca se queda cargando.
      result = { status: "error", message: t.errors.unavailable };
    }
    if (result === null) {
      setStage({ kind: "select" });
      return;
    }
    if (result.status === "error") {
      setError(result.message);
      setStage({ kind: "select" });
      return;
    }
    setSubmitted(false);
    setStage({ kind: "review", dishes: toReview(result.dishes) });
  }

  function readFiles() {
    // La lista de la página; si se eligieron antes de que cargara, el propio campo.
    const files = chosen.length > 0 ? chosen : Array.from(fileInput.current?.files ?? []);
    if (files.length === 0) {
      setError(t.prepare.noFiles);
      return;
    }
    void run(async () => {
      const formData = new FormData();
      try {
        for (const page of await prepareImages(files)) {
          formData.append(PAGE_FIELD, page, "pagina.jpg");
        }
      } catch (prepareError) {
        setError(
          prepareError instanceof PrepareError
            ? t.prepare[prepareError.reason]
            : t.prepare.unreadable,
        );
        return null;
      }
      return readMenu(restaurantId, formData);
    });
  }

  function read() {
    if (source === "files") {
      readFiles();
    } else if (source === "link") {
      if (link.trim() === "") {
        setError(t.link.invalid);
        return;
      }
      void run(() => readMenuFromUrl(restaurantId, link.trim()));
    } else {
      void run(() => readMenuFromText(restaurantId, pasted));
    }
  }

  if (stage.kind === "reading") {
    return (
      <div role="status" aria-label={t.reading} className="flex flex-col gap-4">
        <p className="text-sm text-muted">{t.reading}</p>
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  if (stage.kind === "review") {
    const dishes = stage.dishes;
    const included = dishes.filter((dish) => dish.include);
    const missingName = included.some((dish) => dish.name.trim() === "");
    /** Precio escrito pero que no se entiende (vacío sí vale: «sin precio»). */
    const badPrice = (dish: ReviewDish) =>
      dish.price.trim() !== "" && parsePrice(dish.price) === null;
    const anyBadPrice = included.some(badPrice);

    const update = (key: number, patch: Partial<ReviewDish>) =>
      setStage({
        kind: "review",
        dishes: dishes.map((dish) => (dish.key === key ? { ...dish, ...patch } : dish)),
      });

    function save() {
      setSubmitted(true);
      if (included.length === 0 || missingName || anyBadPrice) return;
      setSaveError(null);
      startSaving(async () => {
        let result: Awaited<ReturnType<typeof createImportedDishes>>;
        try {
          result = await createImportedDishes(
            restaurantId,
            included.map((dish) => ({
              name: dish.name.trim(),
              description: emptyToNull(dish.description),
              priceCents: parsePrice(dish.price),
              category: emptyToNull(dish.category),
              ingredients: emptyToNull(dish.ingredients),
              suggestions: dish.suggestions,
            })),
          );
        } catch {
          setSaveError(t.errors.createFailed);
          return;
        }
        setSaveError(result.message);
      });
    }

    return (
      <form
        aria-label={t.reviewLabel}
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">{t.reviewTitle}</h2>
          <p className="text-sm text-muted">{t.reviewIntro(dishes.length)}</p>
        </div>
        <Alert tone="warning">{t.responsibility}</Alert>

        <ul className="flex flex-col gap-4">
          {dishes.map((dish, index) => (
            <Card as="li" key={dish.key} className={dish.include ? "" : "opacity-60"}>
              <fieldset className="flex flex-col gap-4">
                <legend className="sr-only">{t.dishLegend(index + 1, dish.name)}</legend>
                <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold">
                  <input
                    type="checkbox"
                    checked={dish.include}
                    onChange={(event) => update(dish.key, { include: event.target.checked })}
                    className="size-5 accent-primary"
                  />
                  {t.include(dish.name || t.untitled)}
                </label>
                {dish.include ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
                      <TextField
                        label={t.fields.name}
                        value={dish.name}
                        maxLength={120}
                        onChange={(event) => update(dish.key, { name: event.target.value })}
                        error={submitted && dish.name.trim() === "" ? t.nameRequired : undefined}
                      />
                      <TextField
                        label={t.fields.price}
                        value={dish.price}
                        inputMode="decimal"
                        onChange={(event) => update(dish.key, { price: event.target.value })}
                        error={submitted && badPrice(dish) ? t.priceInvalid : undefined}
                        hint={isUnusualPrice(parsePrice(dish.price)) ? t.priceUnusual : undefined}
                      />
                    </div>
                    <TextField
                      label={t.fields.category}
                      value={dish.category}
                      maxLength={60}
                      onChange={(event) => update(dish.key, { category: event.target.value })}
                    />
                    <TextAreaField
                      label={t.fields.description}
                      value={dish.description}
                      maxLength={1000}
                      rows={2}
                      onChange={(event) => update(dish.key, { description: event.target.value })}
                    />
                    <TextAreaField
                      label={t.fields.ingredients}
                      value={dish.ingredients}
                      maxLength={2000}
                      rows={2}
                      onChange={(event) => update(dish.key, { ingredients: event.target.value })}
                    />
                    <div className="flex flex-col gap-2">
                      <p className="text-sm font-semibold">{t.suggestedTitle}</p>
                      {dish.suggestions.length === 0 ? (
                        <p className="text-sm text-muted">{t.noSuggestions}</p>
                      ) : (
                        <ul aria-label={t.suggestedTitle} className="flex flex-wrap gap-2">
                          {dish.suggestions.map((suggestion) => (
                            <li
                              key={suggestion.allergen}
                              className="inline-flex items-center gap-1.5 rounded-full bg-warning-bg px-3 py-1 text-sm font-medium text-warning-fg"
                            >
                              <AllergenIcon allergen={suggestion.allergen} className="size-4" />
                              {ALLERGEN_LABELS.es[suggestion.allergen]} ·{" "}
                              {t.levels[suggestion.level]}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                ) : null}
              </fieldset>
            </Card>
          ))}
        </ul>

        {submitted && included.length === 0 ? <Alert tone="error">{t.noneIncluded}</Alert> : null}
        {saveError ? <Alert tone="error">{saveError}</Alert> : null}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" icon="add" disabled={saving}>
            {t.add(included.length)}
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setChosen([]);
              setStage({ kind: "select" });
            }}
          >
            {t.startOver}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <Card>
      <p className="text-sm text-muted">{t.intro}</p>
      <div
        role="tablist"
        aria-label={t.tabsLabel}
        className="flex flex-wrap gap-1 rounded-full bg-surface p-1"
      >
        {SOURCES.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            id={`${inputId}-tab-${option}`}
            aria-selected={source === option}
            aria-controls={`${inputId}-panel-${option}`}
            onClick={() => {
              setSource(option);
              setError(null);
            }}
            className={`inline-flex min-h-11 flex-1 items-center justify-center rounded-full px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text ${
              source === option ? "bg-card text-fg shadow-card" : "text-muted hover:text-fg"
            }`}
          >
            {t.tabs[option]}
          </button>
        ))}
      </div>
      {error ? <Alert tone="error">{error}</Alert> : null}

      <div
        role="tabpanel"
        id={`${inputId}-panel-link`}
        aria-labelledby={`${inputId}-tab-link`}
        hidden={source !== "link"}
      >
        <TextField
          label={t.link.label}
          hint={t.link.hint}
          type="url"
          inputMode="url"
          placeholder="https://"
          value={link}
          maxLength={2000}
          onChange={(event) => setLink(event.target.value)}
        />
      </div>

      <div
        role="tabpanel"
        id={`${inputId}-panel-text`}
        aria-labelledby={`${inputId}-tab-text`}
        hidden={source !== "text"}
      >
        <TextAreaField
          label={t.text.label}
          hint={t.text.hint}
          rows={10}
          maxLength={30_000}
          value={pasted}
          onChange={(event) => setPasted(event.target.value)}
        />
      </div>

      <div
        role="tabpanel"
        id={`${inputId}-panel-files`}
        aria-labelledby={`${inputId}-tab-files`}
        hidden={source !== "files"}
        className="flex flex-col gap-2"
      >
        <label htmlFor={inputId} className="text-sm font-semibold">
          {t.fileLabel}
        </label>
        {/* Zona para arrastrar las fotos o el PDF; el campo de archivos sigue
            dentro (teclado, lectores de pantalla y «Elegir archivos»). */}
        <div
          data-testid="menu-dropzone"
          data-dragging={dragging}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={(event) => {
            // Solo al salir de la zona, no al pasar por encima de lo que contiene.
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setDragging(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
          className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition ${
            dragging ? "border-primary-text bg-primary-soft" : "border-input bg-surface"
          }`}
        >
          <Icon name="document" className="size-8 text-primary-text" />
          <p className="text-sm font-semibold">{dragging ? t.dropNow : t.dropHere}</p>
          <input
            id={inputId}
            type="file"
            accept={ACCEPT}
            multiple
            ref={fileInput}
            onChange={(event) => addFiles(event.target.files)}
            className="block w-full max-w-sm text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:font-semibold file:text-on-primary"
          />
        </div>
        {chosen.length > 0 ? (
          <ul aria-label={t.chosen} className="flex flex-wrap gap-2">
            {chosen.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-surface py-1 pr-1 pl-3 text-sm"
              >
                <Icon name="document" className="size-4 text-muted" />
                {file.name}
                <button
                  type="button"
                  aria-label={t.remove(file.name)}
                  onClick={() => removeFile(index)}
                  className="inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-danger-soft hover:text-danger focus-visible:outline-2 focus-visible:outline-primary-text"
                >
                  <Icon name="close" className="size-5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <p className="text-sm text-muted">{t.fileHint}</p>
      </div>
      <div>
        <Button icon="scan" onClick={read}>
          {t.read}
        </Button>
      </div>
    </Card>
  );
}
