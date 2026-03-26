import Dashboard from "@/components/Dashboard";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <Dashboard />
      </Suspense>
    </main>
  );
}
