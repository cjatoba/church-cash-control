export type TransferDestination = "volunteer" | "external";

export function toTransferDestination(value: FormDataEntryValue | null): TransferDestination {
  return value === "volunteer" ? "volunteer" : "external";
}
