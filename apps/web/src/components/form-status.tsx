import { Alert } from "@/components/ui/alert";
import type { FormState } from "@/lib/forms";

/** Mensaje general de un formulario (error o éxito). */
export function FormStatus({ state }: { state: FormState }) {
  if (state.message === undefined) return null;
  return <Alert tone={state.status === "success" ? "success" : "error"}>{state.message}</Alert>;
}
