"use client";

import { useEffect, useState } from "react";

type RecipeSuccessToastProps = {
  message: string;
};

export function RecipeSuccessToast({ message }: RecipeSuccessToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 2800);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed right-4 top-4 z-50 max-w-sm rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 shadow-lg dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      {message}
    </div>
  );
}
