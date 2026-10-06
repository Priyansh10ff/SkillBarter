import { useMemo } from "react";
import { Select } from "./Field";

const ALL_ZONES = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"];

export const TimezoneSelect = ({ value, ...props }) => {
  // keep the saved value selectable even if this browser doesn't list it
  const zones = useMemo(() => (value && !ALL_ZONES.includes(value) ? [value, ...ALL_ZONES] : ALL_ZONES), [value]);
  return (
    <Select value={value} {...props}>
      {zones.map((tz) => (
        <option key={tz} value={tz}>
          {tz.replaceAll("_", " ")}
        </option>
      ))}
    </Select>
  );
};
