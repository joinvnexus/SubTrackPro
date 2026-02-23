"use client";

import { ReactNode } from "react";
import { AuthProvider } from "@/hooks/use-auth";

export function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
