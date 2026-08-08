"use client";

import React from "react";
import PublicNavbar from "./PublicNavbar";
import PublicFooter from "./PublicFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-body text-on-surface antialiased bg-[#FAF9F9] min-h-screen flex flex-col justify-between">
      <PublicNavbar />
      <main className="flex-grow pt-[140px] pb-20 px-6 md:px-16 max-w-container-max-width mx-auto w-full">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
