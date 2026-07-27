import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SideNav, BottomNav } from '@/components/layout/BottomNav';
import { Dashboard } from '@/pages/Dashboard';
import { Inventory } from '@/pages/Inventory';
import { ItemForm } from '@/pages/ItemForm';
import { ItemDetail } from '@/pages/ItemDetail';
import { Sales } from '@/pages/Sales';
import { SaleForm } from '@/pages/SaleForm';
import { Reports } from '@/pages/Reports';
import { Profile } from '@/pages/Profile';
import { Installments } from '@/pages/Installments';
import { FinancialManagement } from '@/pages/FinancialManagement';
import { useStore } from '@/store/useStore';
import { Loader2 } from 'lucide-react';
import { Login } from '@/pages/Login';

export default function App() {
  const loadData = useStore((s) => s.loadData);
  const loading = useStore((s) => s.loading);
  const currentUser = useStore((s) => s.currentUser);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-zinc-950 text-white space-y-4">
        <Loader2 size={36} className="text-emerald-400 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-semibold text-zinc-200">Giro App</p>
          <p className="text-xs text-zinc-500">Conectando e sincronizando dados na nuvem...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }


  return (
    <BrowserRouter>
      <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row text-white selection:bg-emerald-500 selection:text-white">
        {/* Desktop sidebar */}
        <SideNav />

        {/* Main content area */}
        <div className="flex-1 flex flex-col min-h-screen md:ml-60 pb-20 md:pb-0">
          <main className="flex-1 overflow-x-hidden">
            {/* Inner container: full width on desktop */}
            <div className="w-full">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/estoque" element={<Inventory />} />
                <Route path="/estoque/novo" element={<ItemForm />} />
                <Route path="/estoque/:id" element={<ItemDetail />} />
                <Route path="/estoque/:id/editar" element={<ItemForm />} />
                <Route path="/vendas" element={<Sales />} />
                <Route path="/vendas/nova" element={<SaleForm />} />
                <Route path="/parcelados" element={<Installments />} />
                <Route path="/relatorios" element={<Reports />} />
                <Route path="/perfil" element={<Profile />} />
                <Route path="/financeiro" element={<FinancialManagement />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>

          {/* Mobile bottom nav */}
          <BottomNav />
        </div>
      </div>
    </BrowserRouter>
  );
}
