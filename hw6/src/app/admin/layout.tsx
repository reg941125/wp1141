import "@/app/globals.css";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="bg-zinc-50 text-zinc-900">
        <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
          {children}
        </div>
      </body>
    </html>
  );
}

