"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { setWorkspaceTheme, subscribeWorkspaceTheme } from "../../../../shared/theme.mjs";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => subscribeWorkspaceTheme(theme => setDark(theme === "dark")), []);
  return (
    <button
      type="button"
      className="icon-button theme-toggle"
      aria-label={dark ? "Açıq rejimə keç" : "Tünd rejimə keç"}
      aria-pressed={dark}
      title={dark ? "Açıq rejim" : "Tünd rejim"}
      onClick={() => {
        const next = !dark;
        setWorkspaceTheme(next ? "dark" : "light");
      }}
    >
      {dark ? <Sun size={19} /> : <Moon size={19} />}
    </button>
  );
}
