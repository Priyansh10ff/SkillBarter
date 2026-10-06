// Server-side text formatting for notifications and emails

// 1.5 → "1:30 h"
const formatHours = (credits = 0) => {
  const minutes = Math.round(Math.abs(credits) * 60);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")} h`;
};

// In the recipient's own timezone, e.g. "Tue 14 Oct, 18:30"
const formatDateTime = (date, timeZone = "UTC") => {
  const opts = { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false };
  try {
    return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" }).format(date) + " UTC";
  }
};

module.exports = { formatHours, formatDateTime };
