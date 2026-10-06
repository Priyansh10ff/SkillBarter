import dayjs from "./date";

// Credits are hours. 1.5 → "1:30 h", 0.5 → "0:30 h", -1 → "−1:00 h"
export const formatHours = (credits = 0, { signed = false } = {}) => {
  const totalMinutes = Math.round(Math.abs(credits) * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = String(totalMinutes % 60).padStart(2, "0");
  const sign = credits < 0 ? "−" : signed && credits > 0 ? "+" : "";
  return `${sign}${h}:${m} h`;
};

export const formatDuration = (minutes) => (minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`);

// Always shown in the viewer's own timezone
export const formatDateTime = (date) => dayjs(date).format("ddd D MMM · HH:mm");
export const formatDate = (date) => dayjs(date).format("D MMM YYYY");
export const fromNow = (date) => dayjs(date).fromNow();

export const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";

// Stable muted color per name for avatars
const AVATAR_TONES = ["#3B4A3F", "#4A3F3B", "#3B414A", "#47433A", "#3F3B4A", "#3A4747", "#4A3B44", "#41473A"];
export const avatarTone = (name = "") => {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[hash % AVATAR_TONES.length];
};

export const apiError = (error, fallback = "Something went wrong") => error?.response?.data?.message || fallback;

// Server validation details → { field: message }
export const fieldErrors = (error) =>
  Object.fromEntries((error?.response?.data?.details || []).map((d) => [d.field, d.message]));
