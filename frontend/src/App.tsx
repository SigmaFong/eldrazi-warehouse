import { useState, useEffect, useCallback } from "react";
import type { Page, Order, Distributor } from "../types";
import { getOrders, getDistributors } from "./api";
import { useInventory } from "./hooks/useInventory";
import { useToast }     from "./hooks/useToast";
import { useAuth }      from "./context/AuthContext";

import { Sidebar }   from "./components/layout/Sidebar";
import { Topbar }    from "./components/layout/Topbar";
import { Toasts }    from "./components/ui/Toasts";

import { LoginPage }        from "./pages/LoginPage";
import { DashboardPage }    from "./pages/DashboardPage";
import { InventoryPage }    from "./pages/InventoryPage";
import { OrdersPage }       from "./pages/OrdersPage";
import { DistributorsPage } from "./pages/DistributorsPage";
import { ScryfallPage }     from "./pages/ScryfallPage";

function FontLoader() {
  return (
    <link
      href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap"
      rel="stylesheet"
    />
  );
}

function VoidBg() {
  return (
    <>
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025] z-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(139,92,246,.6) 40px,rgba(139,92,246,.6) 41px)," +
            "repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(139,92,246,.6) 40px,rgba(139,92,246,.6) 41px)",
        }}
      />
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%,rgba(109,40,217,.12) 0%,transparent 70%)" }}
      />
    </>
  );
}

function SessionLoader() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center gap-3 font-mono text-xs text-zinc-600 uppercase tracking-widest">
      <div className="w-5 h-5 border-2 border-zinc-800 border-t-violet-500 rounded-full animate-spin" />
      Restoring Session...
    </div>
  );
}

function AppShell() {
  const { user, logout } = useAuth();
  const [page,         setPage]         = useState<Page>("dashboard");
  const [orders,       setOrders]       = useState<Order[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading,      setLoading]      = useState(true);

  const { inventory, reload: reloadInventory, update: updateCard } = useInventory();
  const { toasts, addToast } = useToast();

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [ord, dist] = await Promise.all([getOrders(), getDistributors()]);
    setOrders(ord);
    setDistributors(dist);
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    await Promise.all([reloadInventory(), loadAll()]);
  }, [reloadInventory, loadAll]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const pendingCount = orders.filter(o => ["pending","processing"].includes(o.status)).length;

  const navItems = [
    { key: "dashboard"    as Page, icon: "◈", label: "Dashboard" },
    { key: "inventory"    as Page, icon: "▦", label: "Inventory",    badge: inventory.length    || null },
    { key: "orders"       as Page, icon: "◎", label: "Orders",       badge: pendingCount        || null },
    { key: "distributors" as Page, icon: "◉", label: "Distributors", badge: distributors.length || null },
    { key: "scryfall"     as Page, icon: "⬡", label: "Scryfall API" },
  ];

  const pageTitle = navItems.find(n => n.key === page)?.label ?? "";

  return (
    
    <div className="flex min-h-screen bg-zinc-950 relative z-10" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
      <Sidebar page={page} navItems={navItems} onNavigate={setPage} />
      <main className="ml-60 flex-1 flex flex-col min-h-screen">
        <Topbar title={pageTitle} onRefresh={handleRefresh} user={user} onLogout={logout} />
        <div className="flex-1 p-7">
          {loading ? (
            <div className="flex items-center justify-center py-32 gap-3 font-mono text-xs text-zinc-600 uppercase tracking-widest">
              <div className="w-5 h-5 border-2 border-zinc-800 border-t-violet-500 rounded-full animate-spin" />
              Initializing Void Systems
            </div>
          ) : (
            <>
              {page === "dashboard"    && <DashboardPage    inventory={inventory} orders={orders} />}
              {page === "inventory"    && <InventoryPage    inventory={inventory} onUpdate={updateCard} addToast={addToast} />}
              {page === "orders"       && <OrdersPage       orders={orders} inventory={inventory} addToast={addToast} />}
              {page === "distributors" && <DistributorsPage distributors={distributors} />}
              {page === "scryfall"     && <ScryfallPage     inventory={inventory} addToast={addToast} />}
            </>
          )}
        </div>
      </main>
      <Toasts toasts={toasts} />
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth();
  return (
    <>
      <FontLoader />
      <VoidBg />
      {isLoading                         && <SessionLoader />}
      {!isLoading && !isAuthenticated    && <LoginPage />}
      {!isLoading &&  isAuthenticated    && <AppShell />}
    </>
  );
}