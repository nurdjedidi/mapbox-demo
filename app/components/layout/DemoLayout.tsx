import type { ReactNode } from "react";
import { Navbar } from "./Navbar";

interface DemoLayoutProps {
  children: ReactNode;
}

export function DemoLayout({ children }: DemoLayoutProps) {
  return (
    <div className="relative w-screen h-[100dvh] overflow-hidden bg-dark-bg">
      <Navbar />
      {children}
    </div>
  );
}
