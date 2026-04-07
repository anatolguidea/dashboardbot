"use client";

import React, { createContext, useContext, useState } from "react";
import { dictionary, Language, DictionaryContextType } from "@/lib/i18n";

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: DictionaryContextType;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const saved = localStorage.getItem("dashboard-lang") as Language | null;
    return saved && dictionary[saved] ? saved : "en";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("dashboard-lang", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t: dictionary[language] }}>
      <div>{children}</div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
