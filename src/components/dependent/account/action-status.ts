/** Where a button or form that runs one engine call is in its life. */
export type ActionStatus =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "error"; message: string };
