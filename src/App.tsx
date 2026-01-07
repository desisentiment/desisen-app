import { useEffect, lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useFallbackItemStore } from './store/useFallbackItemStore';
import { useFallbackAuthStore } from './store/useFallbackAuthStore';
import { useBusinessStore } from './store/useBusinessStore';
import { initializeMockData } from './data/mockData';

const DashboardPage = lazy(() => import("./pages/dashboard/DashboardPage"));
const PartiesPage = lazy(() => import("./pages/parties/PartiesPage"));
const ItemsPage = lazy(() => import("./pages/items/ItemsPage"));
const SalesPage = lazy(() => import("./pages/sales/SalesPage"));
const PurchasesPage = lazy(() => import("./pages/purchases/PurchasesPage"));
const PaymentsPage = lazy(() => import("./pages/payments/PaymentsPage"));
const ExpensesPage = lazy(() => import("./pages/expenses/ExpensesPage"));
const SettingsPage = lazy(() => import("./pages/settings/SettingsPage"));
const ReturnsPage = lazy(() => import("./pages/returns/ReturnsPage"));
const LedgerPage = lazy(() => import("./pages/ledger/LedgerPage"));
const ReportsPage = lazy(() => import("./pages/reports/ReportsPage"));
const SearchPage = lazy(() => import("./pages/search/SearchPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  const { loadItems, isLoading } = useFallbackItemStore();
  const { isAuthenticated, user, login } = useFallbackAuthStore();
  const { initialize } = useBusinessStore();

  useEffect(() => {
    // Initialize mock data
    initializeMockData();
    
    // Initialize business store
    initialize();
    
    // Auto-login if not authenticated
    if (!isAuthenticated && !user) {
      login('demo@karobar360.com', 'demo123');
    }
  }, [isAuthenticated, user, login, initialize]);

  useEffect(() => {
    // Initialize app with items data
    loadItems('default-business-id');
  }, [loadItems]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
              </div>
            }>
              <Routes>
                <Route
                  path="/*"
                  element={
                    <MainLayout>
                      <ErrorBoundary>
                        <Routes>
                          <Route path="/" element={<DashboardPage />} />
                          <Route path="/parties" element={<PartiesPage />} />
                          <Route path="/items" element={<ItemsPage />} />
                          <Route path="/sales" element={<SalesPage />} />
                          <Route path="/sales/new" element={<SalesPage />} />
                          <Route path="/purchases" element={<PurchasesPage />} />
                          <Route path="/purchases/new" element={<PurchasesPage />} />
                          <Route path="/returns" element={<ReturnsPage />} />
                          <Route path="/ledger" element={<LedgerPage />} />
                          <Route path="/search" element={<SearchPage />} />
                          <Route path="/payments" element={<PaymentsPage />} />
                          <Route path="/expenses" element={<ExpensesPage />} />
                          <Route path="/reports" element={<ReportsPage />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </ErrorBoundary>
                    </MainLayout>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
