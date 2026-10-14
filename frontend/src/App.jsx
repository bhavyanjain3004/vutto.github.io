import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from '@/pages/Home';
import Auctions from '@/pages/Auctions';
import AuctionDetail from '@/pages/AuctionDetail';
import MyBids from '@/pages/MyBids';
import Auth from '@/pages/Auth';
import Contact from '@/pages/Contact';
import Payment from '@/pages/Payment';
import Header from '@/components/app/Header';
import Footer from '@/components/app/Footer';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
// Lazy-load Admin routes and recharts dependencies
const Admin = lazy(() => import('@/pages/Admin'));
function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      <div className="mx-auto flex max-w-7xl flex-col gap-7 px-4 py-8 sm:px-6 lg:flex-row lg:px-8 lg:py-10">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-8 w-44 animate-pulse rounded bg-gray-200" />
          <div className="mt-8 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-11 w-full animate-pulse rounded-xl bg-gray-200"
              />
            ))}
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          <div className="mb-7 flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-60 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-8 w-32 animate-pulse rounded-full bg-gray-200" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-2xl bg-gray-200"
              />
            ))}
          </div>
          <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
            <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
            <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
          </div>
        </main>
      </div>
    </div>
  );
}
export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auctions" element={<Auctions />} />
        <Route path="/auction/:id" element={<AuctionDetail />} />
        <Route
          path="/my-bids"
          element={
            <ProtectedRoute>
              <MyBids />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/contact" element={<Contact />} />
        <Route
          path="/checkout/:id"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment/:id"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<AdminSkeleton />}>
                <Admin />
              </Suspense>
            </ProtectedRoute>
          }
        />
      </Routes>
      {!isAdminRoute && <Footer />}
    </>
  );
}
