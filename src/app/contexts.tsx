"use client";
import { SequenceConnect } from "@0xsequence/connect";
import { useEffect, useState } from "react";
import { Loading } from "@/app/views/Loading";
import { config } from "../config";

export function Contexts({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    // Optional: skeleton or fallback
    return null;
  }

  if (!hydrated) {
    return <Loading />;
  }

  return <SequenceConnect config={config}>{children}</SequenceConnect>;
}
