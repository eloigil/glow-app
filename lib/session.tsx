"use client";

import { createContext, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { saveCurrent } from "@/lib/current";
import type { AnalyzeResponse, Look, ProductLink, Tone } from "@/lib/types";

// In-memory session (spec.md > Session Store). A reload sends her back to Welcome, but today's photo and its
// results are also kept on the device (lib/current.ts) so the photo screen can offer them again.
export type Session = {
  /** Object URL or data URL of the photo being shown. */
  photo?: string;
  analysis?: AnalyzeResponse;
  tone?: Tone;
  looks?: Look[];
  /** The photo (fileId) the looks were designed for. */
  looksFor?: string;
  /** The look being followed in the tutorial. */
  lookId?: string;
  /** Per look id: index i is the render with steps 0..i applied. */
  stepImages?: Record<string, (string | undefined)[]>;
  /** Per look id: index i is true when stepImages[i] is a replay stand-in, not a real render. */
  stepPlaceholders?: Record<string, boolean[]>;
  /** Render failures keyed `${fileId}:${look.id}:${stepIndex}`. */
  stepErrors?: Record<string, string>;
  /** Set when the tutorial is replaying a look saved on the device: every image is local, nothing is fetched. */
  savedId?: string;
  /** Exact product pages keyed by productKey(); a missing key is still unresolved, null means none found. */
  productLinks?: Record<string, ProductLink | null>;
  /** True while /api/products is running for the current looks. */
  productLinksPending?: boolean;
};

type SessionContext = { session: Session; setSession: Dispatch<SetStateAction<Session>> };

const Ctx = createContext<SessionContext | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({});
  useEffect(() => {
    // Renders arrive one by one; write once they settle rather than on every image.
    const t = setTimeout(() => void saveCurrent(session).catch(() => undefined), 800);
    return () => clearTimeout(t);
  }, [session]);
  return <Ctx.Provider value={{ session, setSession }}>{children}</Ctx.Provider>;
}

export function useSession() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
