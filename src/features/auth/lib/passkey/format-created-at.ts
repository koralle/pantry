const passkeyCreatedAtFormatter = new Intl.DateTimeFormat("ja-JP", {
  day: "2-digit",
  hour: "2-digit",
  hour12: false,
  minute: "2-digit",
  month: "2-digit",
  timeZone: "Asia/Tokyo",
  year: "numeric",
});

const part = (
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes
): string => parts.find((entry) => entry.type === type)?.value ?? "";

export const formatPasskeyCreatedAt = (date: string | Date): string => {
  const parts = passkeyCreatedAtFormatter.formatToParts(
    typeof date === "string" ? new Date(date) : date
  );

  return `${part(parts, "year")}/${part(parts, "month")}/${part(parts, "day")} ${part(parts, "hour")}:${part(parts, "minute")}`;
};
