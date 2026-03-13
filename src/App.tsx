import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminPrivateRoute } from "./components/auth/AdminPrivateRoute";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Deliveries from "./pages/Deliveries";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import RestaurantSettings from "./pages/RestaurantSettings";
import Users from "./pages/Users";
import PDV from "./pages/PDV";
import Reports from "./pages/Reports";
import Customization from "./pages/Customization";
import TrackOrder from "./pages/TrackOrder";
import TestHome from "./pages/TestHome";
import Coupons from "./pages/Coupons";
import Promotions from "./pages/Promotions";
import FiscalSettings from "./pages/admin/FiscalSettings";
import NFCeHistory from "./pages/admin/NFCeHistory";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    const applyFavicon = async () => {
      try {
        const { data } = await supabase
          .from("restaurants")
          .select("theme_settings")
          .limit(1)
          .maybeSingle();

        const themeSettings =
          data?.theme_settings && typeof data.theme_settings === "object"
            ? (data.theme_settings as any)
            : null;

        const faviconUrl = themeSettings?.favicon_url || themeSettings?.faviconUrl;
        if (!faviconUrl) return;

        const faviconEl = document.getElementById(
          "app-favicon"
        ) as HTMLLinkElement | null;
        if (faviconEl) {
          faviconEl.href = faviconUrl;
        }
      } catch (_) {
        // ignore favicon errors
      }
    };

    applyFavicon();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster 
          richColors 
          position="top-center" 
          duration={2000}
        />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/track-order/:orderId" element={<TrackOrder />} />

              {/* Admin Routes - Protected with role validation */}
              <Route element={<AdminPrivateRoute />}>
                <Route element={
                  <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                  >
                    <DashboardLayout />
                  </ThemeProvider>
                }>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/deliveries" element={<Deliveries />} />
                  <Route path="/settings" element={<RestaurantSettings />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/pdv" element={<PDV />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/customization" element={<Customization />} />
                  <Route path="/coupons" element={<Coupons />} />
                  <Route path="/promotions" element={<Promotions />} />
                  <Route path="/admin/fiscal-settings" element={<FiscalSettings />} />
                  <Route path="/admin/nfce-history" element={<NFCeHistory />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
