/** @type {import('tailwindcss').Config} */

// Colors come from CSS variables in src/index.css so a second theme can be added later.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    colors: {
      transparent: "transparent",
      current: "currentColor",
      black: "#000",
      white: "#fff",
      bg: v("bg"),
      surface: v("surface"),
      raised: v("raised"),
      line: v("line"),
      "line-strong": v("line-strong"),
      ink: v("ink"),
      muted: v("muted"),
      faint: v("faint"),
      accent: v("accent"),
      "accent-ink": v("accent-ink"),
      ok: v("ok"),
      bad: v("bad"),
      warn: v("warn"),
    },
    fontFamily: {
      sans: ['"Instrument Sans"', "system-ui", "sans-serif"],
      mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
    },
    borderRadius: {
      none: "0",
      sm: "2px",
      DEFAULT: "4px",
      md: "4px",
      full: "9999px",
    },
    extend: {
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      maxWidth: {
        page: "72rem",
      },
    },
  },
  plugins: [],
};
