import { describe, expect, it } from "vitest";
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  emailSchema,
  newPasswordSchema,
  otpCodeSchema,
  signInSchema,
  signUpSchema,
} from "./auth";

type SafeParseResult = {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
};

function errorsOf(result: SafeParseResult): Record<string, string> | null {
  if (result.success) return null;
  return Object.fromEntries(
    (result.error?.issues ?? []).map((issue) => [issue.path.join("."), issue.message]),
  );
}

describe("signUpSchema", () => {
  const valid = {
    email: "  Hola@LaHuerta.ES ",
    password: "contraseña-larga",
    accepted_terms: "on",
  };

  it("acepta un registro válido, normaliza el email y convierte la casilla en true", () => {
    expect(signUpSchema.parse(valid)).toEqual({
      email: "hola@lahuerta.es",
      password: "contraseña-larga",
      accepted_terms: true,
    });
  });

  it("no recorta espacios de la contraseña", () => {
    expect(signUpSchema.parse({ ...valid, password: " con espacios " }).password).toBe(
      " con espacios ",
    );
  });

  it.each<[string, Record<string, unknown>, Record<string, string>]>([
    ["email inválido", { email: "no-es-email" }, { email: "invalid_email" }],
    ["email vacío", { email: "" }, { email: "invalid_email" }],
    [
      `contraseña de menos de ${PASSWORD_MIN_LENGTH}`,
      { password: "a".repeat(PASSWORD_MIN_LENGTH - 1) },
      { password: "password_too_short" },
    ],
    [
      `contraseña de más de ${PASSWORD_MAX_LENGTH}`,
      { password: "a".repeat(PASSWORD_MAX_LENGTH + 1) },
      { password: "too_long" },
    ],
    ["términos sin aceptar", { accepted_terms: undefined }, { accepted_terms: "terms_required" }],
    ["términos con otro valor", { accepted_terms: "off" }, { accepted_terms: "terms_required" }],
  ])("rechaza: %s", (_, override, expected) => {
    expect(errorsOf(signUpSchema.safeParse({ ...valid, ...override }))).toEqual(expected);
  });

  it(`la longitud mínima coincide con la de Supabase Auth (${PASSWORD_MIN_LENGTH})`, () => {
    expect(PASSWORD_MIN_LENGTH).toBe(8);
  });
});

describe("signInSchema", () => {
  it("no aplica la longitud mínima (no revela la política a quien prueba contraseñas)", () => {
    expect(signInSchema.safeParse({ email: "a@b.es", password: "corta" }).success).toBe(true);
  });

  it("exige email y contraseña", () => {
    expect(errorsOf(signInSchema.safeParse({ email: "", password: "" }))).toEqual({
      email: "invalid_email",
      password: "required",
    });
  });
});

describe("emailSchema", () => {
  it("normaliza el email", () => {
    expect(emailSchema.parse({ email: " A@B.ES " })).toEqual({ email: "a@b.es" });
  });
});

describe("newPasswordSchema", () => {
  it("acepta dos contraseñas iguales y válidas", () => {
    expect(
      newPasswordSchema.parse({
        password: "nueva-segura-1",
        password_confirmation: "nueva-segura-1",
      }),
    ).toEqual({ password: "nueva-segura-1" });
  });

  it("rechaza contraseñas distintas", () => {
    expect(
      errorsOf(
        newPasswordSchema.safeParse({
          password: "nueva-clave-1",
          password_confirmation: "nueva-clave-2",
        }),
      ),
    ).toEqual({ password_confirmation: "passwords_mismatch" });
  });

  it("rechaza una contraseña corta", () => {
    expect(
      errorsOf(newPasswordSchema.safeParse({ password: "corta", password_confirmation: "corta" })),
    ).toEqual({ password: "password_too_short" });
  });
});

describe("otpCodeSchema", () => {
  it.each([
    ["123456", "123456"],
    ["12345678", "12345678"],
    [" 123 456 ", "123456"],
    ["1234 5678", "12345678"],
  ])("acepta %j -> %j", (input, expected) => {
    expect(otpCodeSchema.parse({ code: input })).toEqual({ code: expected });
  });

  it.each([["12345"], ["123456789"], ["12a456"], [""], ["------"]])("rechaza %j", (input) => {
    expect(errorsOf(otpCodeSchema.safeParse({ code: input }))).toEqual({ code: "invalid_code" });
  });
});
