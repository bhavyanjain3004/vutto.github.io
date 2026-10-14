import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  Home,
  RefreshCw,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getAuctions } from '@/lib/api';
import AuctionCard from '@/components/app/AuctionCard';
import { useLocationFilter } from '@/context/LocationContext';
import { CATEGORIES, getAuctionCategories } from '@/lib/categories';
const EMPTY_AUCTIONS = [];
const PAGE_SIZE = 12;
export default function Auctions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = useQuery({
    queryKey: ['auctions'],
    queryFn: getAuctions,
    refetchInterval: 15000,
  });
  const auctions = query.data ?? EMPTY_AUCTIONS;
  // Resolve status from query params (supports ?status=... and backwards-compat ?tab=...)
  const statusParam = searchParams.get('status') || searchParams.get('tab');
  const status =
    statusParam === 'upcoming'
      ? 'upcoming'
      : statusParam === 'ended'
        ? 'ended'
        : 'live';
  // Filter params from URL query string
  const q = searchParams.get('q') ?? '';
  const brand = searchParams.get('brand') ?? 'all';
  const category = searchParams.get('category') ?? 'all';
  const price =
    searchParams.get('price') ??
    searchParams.get('priceRange') ??
    searchParams.get('maxPrice') ??
    'all';
  const sort = searchParams.get('sort') ?? 'ending';
  const pageParam = parseInt(searchParams.get('page') ?? '1', 10);
  const page = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const { selectedCity } = useLocationFilter();
  // Local state for search input to allow 300ms debouncing
  const [prevQ, setPrevQ] = useState(q);
  const [searchInput, setSearchInput] = useState(q);
  // Keep local input in sync if q changes externally (e.g. browser back/forward)
  if (prevQ !== q) {
    setPrevQ(q);
    setSearchInput(q);
  }
  // Debounce search input by 300ms and write to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== q) {
        const next = new URLSearchParams(searchParams);
        if (trimmed) {
          next.set('q', trimmed);
        } else {
          next.delete('q');
        }
        next.delete('page');
        setSearchParams(next, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, q, searchParams, setSearchParams]);
  const brands = useMemo(
    () => Array.from(new Set(auctions.map((auction) => auction.brand))),
    [auctions]
  );
  // Tab counts
  const liveCount = useMemo(
    () => auctions.filter((auction) => auction.status === 'LIVE').length,
    [auctions]
  );
  const upcomingCount = useMemo(
    () => auctions.filter((auction) => auction.status === 'UPCOMING').length,
    [auctions]
  );
  const endedCount = useMemo(
    () =>
      auctions.filter(
        (auction) =>
          auction.status === 'ENDED' || auction.status === 'CANCELLED'
      ).length,
    [auctions]
  );
  const tabs = [
    { id: 'live', label: `Live (${liveCount})`, testId: 'tab-live' },
    {
      id: 'upcoming',
      label: `Upcoming (${upcomingCount})`,
      testId: 'tab-upcoming',
    },
    { id: 'ended', label: `Ended (${endedCount})`, testId: 'tab-ended' },
  ];
  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'all' || (key === 'sort' && value === 'ending')) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    // Clean up legacy aliases
    if (key === 'price') {
      next.delete('priceRange');
      next.delete('maxPrice');
    }
    next.delete('page');
    setSearchParams(next);
  };
  const handleTabChange = (newStatus) => {
    const next = new URLSearchParams(searchParams);
    if (newStatus === 'live') {
      next.delete('status');
    } else {
      next.set('status', newStatus);
    }
    next.delete('tab');
    next.delete('page');
    setSearchParams(next);
  };
  const hasActiveFilters = Boolean(
    q.trim() ||
    brand !== 'all' ||
    category !== 'all' ||
    price !== 'all' ||
    sort !== 'ending'
  );
  const clearFilters = () => {
    const next = new URLSearchParams();
    if (status !== 'live') {
      next.set('status', status);
    }
    setSearchInput('');
    setSearchParams(next);
  };
  const filtered = useMemo(() => {
    let result = auctions.filter((auction) => {
      const matchesTab =
        status === 'live'
          ? auction.status === 'LIVE'
          : status === 'upcoming'
            ? auction.status === 'UPCOMING'
            : auction.status === 'ENDED' || auction.status === 'CANCELLED';
      const matchesBrand = brand === 'all' || auction.brand === brand;
      const matchesCategory =
        category === 'all' || getAuctionCategories(auction).includes(category);
      const matchesCity =
        selectedCity === 'all' || auction.city.includes(selectedCity);
      const matchesPrice =
        price === 'all'
          ? true
          : price === '0-50000'
            ? auction.currentBid <= 50000
            : price === '50001-75000'
              ? auction.currentBid >= 50001 && auction.currentBid <= 75000
              : price === '75001-100000'
                ? auction.currentBid >= 75001 && auction.currentBid <= 100000
                : price === 'above-100000'
                  ? auction.currentBid > 100000
                  : auction.currentBid <= Number(price);
      const matchesSearch =
        !q ||
        `${auction.model} ${auction.brand} ${auction.variant}`
          .toLowerCase()
          .includes(q.toLowerCase());
      return (
        matchesTab &&
        matchesBrand &&
        matchesCategory &&
        matchesCity &&
        matchesPrice &&
        matchesSearch
      );
    });
    result = [...result].sort((a, b) => {
      if (sort === 'price-low') return a.currentBid - b.currentBid;
      if (sort === 'price-high') return b.currentBid - a.currentBid;
      if (sort === 'year') return b.year - a.year;
      if (sort === 'km') return a.kilometers - b.kilometers;
      if (status === 'ended') {
        return Date.parse(b.endsAt) - Date.parse(a.endsAt);
      }
      return Date.parse(a.endsAt) - Date.parse(b.endsAt);
    });
    return result;
  }, [auctions, brand, category, price, q, selectedCity, sort, status]);
  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedAuctions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);
  const goToPage = (newPage) => {
    const next = new URLSearchParams(searchParams);
    if (newPage <= 1) {
      next.delete('page');
    } else {
      next.set('page', String(newPage));
    }
    setSearchParams(next);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };
  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      {/* Breadcrumb Navigation Bar */}
      <div className="border-b border-gray-100 bg-[#fafafa]/80 py-3.5">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 text-xs font-semibold text-gray-500 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 transition hover:text-[#d23657]"
          >
            <Home className="size-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="size-3.5 text-gray-400" />
          <span className="font-bold text-gray-900">Auctions</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Page Header */}
        <div>
          <h1
            data-testid="auctions-heading"
            className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl"
          >
            Auctions
          </h1>
        </div>

        {/* Tabs: Live, Upcoming, Ended */}
        <div
          className="mt-8 flex gap-1 overflow-x-auto border-b border-gray-200"
          role="tablist"
          aria-label="Auction status"
        >
          <div className="flex min-w-max gap-1">
            {tabs.map((item) => (
              <button
                type="button"
                key={item.id}
                role="tab"
                aria-selected={status === item.id}
                data-testid={item.testId}
                onClick={() => handleTabChange(item.id)}
                className={`border-b-2 px-4 py-3 text-sm font-bold transition ${
                  status === item.id
                    ? 'border-[#d23657] text-[#d23657]'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div
          data-testid="auction-filter-bar"
          className="mt-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center"
        >
          {/* Search Input with Magnifier */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400" />
            <input
              data-testid="auction-search-input"
              aria-label="Search auctions"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search auctions"
              className="h-10 w-full rounded-xl bg-gray-50 pl-10 pr-3 text-sm outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-[#d23657]/30"
            />
          </div>

          {/* Brand select */}
          <label className="sr-only" htmlFor="brand-filter">
            Brand
          </label>
          <select
            id="brand-filter"
            data-testid="filter-brand-select"
            value={brand}
            onChange={(event) => updateParam('brand', event.target.value)}
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#d23657]"
          >
            <option value="all">All brands</option>
            {brands.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {/* Category select */}
          <label className="sr-only" htmlFor="category-filter">
            Category
          </label>
          <select
            id="category-filter"
            data-testid="filter-category-select"
            value={category}
            onChange={(event) => updateParam('category', event.target.value)}
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#d23657]"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* Price filter select */}
          <label className="sr-only" htmlFor="price-filter">
            Price range
          </label>
          <select
            id="price-filter"
            data-testid="filter-price-select"
            value={price}
            onChange={(event) => updateParam('price', event.target.value)}
            className="h-10 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-[#d23657]"
          >
            <option value="all">Any price</option>
            <option value="0-50000">₹0 - ₹50,000</option>
            <option value="50001-75000">₹50,001 - ₹75,000</option>
            <option value="75001-100000">₹75,001 - ₹1,00,000</option>
            <option value="above-100000">Above ₹1,00,000</option>
          </select>

          {/* Sort select */}
          <div className="flex items-center gap-2 lg:ml-auto">
            <label className="sr-only" htmlFor="sort-auctions">
              Sort auctions
            </label>
            <div className="relative">
              <select
                id="sort-auctions"
                data-testid="auction-sort-select"
                value={sort}
                onChange={(event) => updateParam('sort', event.target.value)}
                className="h-10 appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-8 text-sm font-medium text-gray-700 outline-none focus:border-[#d23657]"
              >
                <option value="ending">Ending soonest</option>
                <option value="price-low">Current bid: low to high</option>
                <option value="price-high">Current bid: high to low</option>
                <option value="year">Newest year</option>
                <option value="km">Lowest kms</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            </div>

            {/* Clear filters button (only visible when filters are active) */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-gray-900"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Error Banner with Retry */}
        {query.isError && (
          <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row">
            <p className="text-sm font-medium text-red-800">
              Failed to load auctions. Please check your connection and try
              again.
            </p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#d23657] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#b02644]"
            >
              <RefreshCw className="size-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Muted count above grid inside aria-live="polite" */}
        <div
          aria-live="polite"
          data-testid="auction-count"
          className="mt-6 text-sm text-gray-500"
        >
          {query.isLoading
            ? 'Loading auctions...'
            : `${filtered.length} ${filtered.length === 1 ? 'auction' : 'auctions'}`}
        </div>

        {/* Loading Skeletons (4:3 ratio) */}
        {query.isLoading ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, item) => (
              <div
                key={item}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="aspect-[4/3] w-full animate-pulse bg-gray-200" />
                <div className="flex flex-1 flex-col p-4">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="mt-2 h-3.5 w-1/2 animate-pulse rounded bg-gray-200" />
                  <div className="mt-6 h-9 w-full animate-pulse rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length ? (
          <>
            {/* Grid of Auction Cards */}
            <div
              data-testid="auction-results-grid"
              className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {paginatedAuctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>

            {/* Pagination (12 per page) */}
            {totalPages > 1 && (
              <nav
                aria-label="Auctions pagination"
                className="mt-10 flex items-center justify-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      aria-current={isCurrent ? 'page' : undefined}
                      onClick={() => goToPage(pageNum)}
                      className={`size-9 rounded-xl text-xs font-bold transition ${
                        isCurrent
                          ? 'bg-[#d23657] text-white shadow-sm'
                          : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        ) : (
          /* Empty state */
          <div
            data-testid="auction-empty-state"
            className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center"
          >
            <p className="text-lg font-bold text-gray-900">
              No auctions match your filters
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Try a different category, brand or price range.
            </p>
            <button
              type="button"
              data-testid="clear-auction-filters"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-[#fdf0f3] px-4 py-2.5 text-sm font-bold text-[#b02644] transition hover:bg-[#fbe6eb]"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
