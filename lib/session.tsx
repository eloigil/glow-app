"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { AnalyzeResponse, Tone } from "@/lib/types";

// In-memory session (spec.md > Session Store). A reload sends her back to Welcome.
type Session = {
  /** Object URL or data URL of the photo being shown. */
  photo?: string;
  analysis?: AnalyzeResponse;
  tone?: Tone;
};

type SessionContext = { session: Session; setSession: (next: Session) => void };

const Ctx = createContext<SessionContext | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({});
  return <Ctx.Provider value={{ session, setSession }}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
