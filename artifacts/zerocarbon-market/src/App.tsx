import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { Shell } from '@/components/zc/layout';
import NotFound from '@/pages/not-found';
import Home from '@/pages/home';
import Market from '@/pages/market';
import ListingPage from '@/pages/listing';
import Signup from '@/pages/signup';
import Buy from '@/pages/buy';
import Orders from '@/pages/orders';
import OrderPage from '@/pages/order';
import CertificatePage from '@/pages/certificate';
import Scan from '@/pages/scan';
import Ask from '@/pages/ask';
import Comply from '@/pages/comply';
import Live from '@/pages/live';
import Admin from '@/pages/admin';
import Pricing from '@/pages/pricing';

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } });

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/market" component={Market} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/listings/:id" component={ListingPage} />
        <Route path="/signup" component={Signup} />
        <Route path="/buy/:id" component={Buy} />
        <Route path="/orders" component={Orders} />
        <Route path="/orders/:id" component={OrderPage} />
        <Route path="/certificates/:token" component={CertificatePage} />
        <Route path="/scan" component={Scan} />
        <Route path="/ask" component={Ask} />
        <Route path="/comply" component={Comply} />
        <Route path="/live" component={Live} />
        <Route path="/admin" component={Admin} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Shell>
            <Router />
          </Shell>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
