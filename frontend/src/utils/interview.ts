export function extractId(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value?.toString === "function") {
    const str = value.toString();
    if (typeof str === "string" && str !== "[object Object]") return str;
  }
  if (typeof value?._id === "string") return value._id;
  if (typeof value?.$oid === "string") return value.$oid;
  return "";
}

export function formatDate(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}
