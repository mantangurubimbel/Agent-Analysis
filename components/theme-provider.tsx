"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextType | null>(null);

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = localStorage.getItem("theme") as Theme | null;
    return stored ?? "system";
  } catch {
    return "system";
  }
}

function resolveIsDark(theme: Theme): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Baca localStorage SINKRON di initial state → tidak ada flicker
  const [theme, setThemeState] = React.useState<Theme>(getInitialTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">(() =>
    resolveIsDark(getInitialTheme()) ? "dark" : "light"
  );

  // Apply theme ke DOM setiap kali berubah
  React.useEffect(() => {
    const isDark = resolveIsDark(theme);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    setResolvedTheme(isDark ? "dark" : "light");
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);

  // Listen ke system preference changes (kalau theme = "system")
  React.useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const isDark = mq.matches;
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
      setResolvedTheme(isDark ? "dark" : "light");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{ theme, resolvedTheme, setTheme: setThemeState }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
