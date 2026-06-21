// ============================================================
// src/app/page.tsx
// Root route — redirect to /dashboard (auth handled by middleware).
// ============================================================

import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/dashboard");
}
