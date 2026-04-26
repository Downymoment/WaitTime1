import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, PlusCircle, Clock } from "lucide-react";
import AddLocationSheet from "@/components/AddLocationSheet";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [addOpen, setAddOpen] = useState(false);

  const isHome = location.pathname === "/";
  const isDetail = location.pathname.startsWith("/location/");

  return (
    <div className="min-h-screen bg-background" data-testid="app-layout">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border" data-testid="top-bar">
        <div className="max-w-md md:max-w-2xl lg:max-w-5xl mx-auto flex items-center justify-between p-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            data-testid="logo-button"
          >
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: 'Manrope, sans-serif' }}>
              WaitTime
            </span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground hidden sm:block">
              Community Queue Tracker
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-bottom-nav page-enter">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-border py-3 px-4 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
        data-testid="bottom-nav"
      >
        <button
          onClick={() => navigate("/")}
          className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-colors ${
            isHome ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
          data-testid="nav-home"
          aria-label="Home"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>
        <button
          onClick={() => {
            navigate("/");
            setTimeout(() => {
              document.getElementById("search-input")?.focus();
            }, 100);
          }}
          className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          data-testid="nav-search"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Search</span>
        </button>
        <button
          onClick={() => setAddOpen(true)}
          className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          data-testid="nav-add-location"
          aria-label="Add Location"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Add</span>
        </button>
      </nav>

      <AddLocationSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}
