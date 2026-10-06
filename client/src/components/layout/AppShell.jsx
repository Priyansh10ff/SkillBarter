import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import { PageLoader } from "./PageLoader";
import { Footer } from "./Footer";

export const AppShell = () => (
  <>
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 bg-accent text-accent-ink px-3 py-2 rounded">
      Skip to content
    </a>
    <Navbar />
    <main id="main" className="mx-auto max-w-page px-4 md:px-6 pt-24 pb-24 min-h-[calc(100dvh-4rem)]">
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </main>
    <Footer />
  </>
);
