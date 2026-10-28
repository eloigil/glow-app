"use client";

import { createContext, useContext, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { AnalyzeResponse, Look, Tone } from "@/lib/types";

// In-memory session (spec.md > Session Store). A reload sends her back to Welcome.
export type Session = {
  /** Object URL or data URL of the photo being shown. */
  photo?: string;
  analysis?: AnalyzeResponse;
  tone?: Tone;
  looks?: Look[];
  /** The look being followed in the tutorial. */
  lookId?: string;
  /** Per look id: index i is the render with steps 0..i applied. */
  stepImages?: Record<string, (string | undefined)[]>;
  /** Per look id: index i is true when stepImages[i] is a replay stand-in, not a real render. */
  stepPlaceholders?: Record<string, boolean[]>;
  /** Render failures keyed `${look.id}:${stepIndex}`. */
  stepErrors?: Record<string, string>;
  /** Set when the tutorial is replaying a look saved on the device: every image is local, nothing is fetched. */
  savedId?: string;
};

type SessionContext = { session: Session; setSession: Dispatch<SetStateAction<Session>> };

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
