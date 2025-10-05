import { createRootRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { RouterDevtools } from "../components/providers/RouterDevtools";
import { SolanaWalletProvider } from "../components/providers/SolanaWalletProvider";

const RootLayout = () => {
  const location = useLocation();

  const navLinks: Array<{ to: "/" | "/messages"; label: string }> = [
    { to: "/", label: "Send a Message" },
    { to: "/messages", label: "View Messages" },
  ];

  return (
    <SolanaWalletProvider>
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950" />
          <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="absolute -right-32 bottom-10 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-12 pt-8 sm:px-6 lg:px-12">
          <header className="mb-12 flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-cyan-500/5 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-6">
              <Link to="/" className="text-2xl font-semibold tracking-tight text-white">
                SolMessage
              </Link>
              <p className="max-w-xl text-sm text-slate-300">Send beautifully tokenized messages across the Solana network and keep an eye on every interaction in one sophisticated dashboard.</p>
            </div>
            <nav className="flex items-center gap-2">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link key={link.to} to={link.to} className={`rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? "bg-cyan-400 text-slate-900" : "text-slate-200 hover:bg-white/10"}`}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </header>

          <main className="flex-1">
            <Outlet />
          </main>

          <footer className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400 backdrop-blur">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-medium text-slate-200">Built for Solana creators and communities.</p>
              <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-wide text-slate-500">
                <span>Secure messaging</span>
                <span>Tokenized delivery</span>
                <span>Real-time insights</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
      <RouterDevtools />
    </SolanaWalletProvider>
  );
};

const NotFound = () => (
  <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-12 text-center shadow-lg shadow-cyan-500/5 backdrop-blur">
    <h1 className="text-4xl font-semibold text-white">Lost in the void.</h1>
    <p className="mt-4 text-slate-300">We couldn't find that page. Choose a destination above to continue your Solana journey.</p>
    <div className="mt-8">
      <Link to="/" className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300">
        Return to Home
      </Link>
    </div>
  </div>
);

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
});
