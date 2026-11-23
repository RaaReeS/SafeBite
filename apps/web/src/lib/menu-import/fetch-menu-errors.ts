/** Lo que hay en el enlace de la carta. */
export type FetchedMenu =
  | { kind: "html"; html: string }
  | { kind: "pdf"; data: Uint8Array }
  | { kind: "image"; dataUrl: string };

export type MenuFetchFailure =
  "invalid" | "private" | "unreachable" | "tooLarge" | "unsupported" | "redirects";

export class MenuFetchError extends Error {
  constructor(readonly reason: MenuFetchFailure) {
    super(reason);
    this.name = "MenuFetchError";
  }
}
