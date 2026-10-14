import {
  ArrowUpRight,
  Check,
  ChevronDown,
  LayoutDashboard,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  UserRound,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLocationFilter } from '@/context/LocationContext';
export default function Header() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { selectedCity, setSelectedCity, availableCities } =
    useLocationFilter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const locationRef = useRef(null);
  const isAdmin = user?.role === 'admin';
  const isAdminPanel = location.pathname.startsWith('/admin');
  useEffect(() => {
    function handleClickOutside(event) {
      if (locationRef.current && !locationRef.current.contains(event.target)) {
        setLocationOpen(false);
      }
    }
    if (locationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [locationOpen]);
  return (
    <header
      data-testid="site-header"
      className="sticky top-0 z-50 border-b border-[#e5e7eb]/90 bg-white/95 backdrop-blur-md"
    >
      <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            to={isAdminPanel ? '/admin' : '/'}
            data-testid="brand-home-link"
            className="group flex items-center gap-2"
            aria-label={isAdminPanel ? 'Vutto admin' : 'Vutto Auctions home'}
          >
            <span
              data-testid="brand-name"
              className="text-[19px] font-bold tracking-tight text-[#111827]"
            >
              vutto<span className="text-[#d23657]">.</span>
              <span className="ml-1 font-semibold text-gray-500">
                {isAdminPanel ? 'admin' : 'auctions'}
              </span>
            </span>
          </Link>

          {/* Location Selector (Only for public users browsing auctions, segregated from admin panel) */}
          {!isAdminPanel && (
            <div className="relative" ref={locationRef}>
              <button
                type="button"
                data-testid="header-location-selector"
                onClick={() => setLocationOpen((prev) => !prev)}
                className="flex items-center gap-1.5 rounded-full border border-gray-200/90 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-[#d23657] hover:bg-[#fdf0f3] hover:text-[#d23657] sm:px-3 cursor-pointer"
                aria-label="Filter location"
              >
                <MapPin className="size-3.5 text-[#d23657]" />
                <span className="max-w-[85px] truncate sm:max-w-none">
                  {selectedCity === 'all' ? 'All locations' : selectedCity}
                </span>
                <ChevronDown
                  className={`size-3 text-gray-400 transition-transform duration-200 ${locationOpen ? 'rotate-180 text-[#d23657]' : ''}`}
                />
              </button>

              {locationOpen && (
                <div
                  data-testid="header-location-dropdown"
                  className="absolute left-0 mt-2 w-48 rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xl ring-1 ring-black/5 z-50"
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Select auction city
                  </div>
                  {availableCities.map((city) => {
                    const isSelected = selectedCity === city.id;
                    return (
                      <button
                        key={city.id}
                        type="button"
                        data-testid={`header-city-option-${city.id}`}
                        onClick={() => {
                          setSelectedCity(city.id);
                          setLocationOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#fdf0f3] text-[#d23657]'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin
                            className={`size-3.5 ${isSelected ? 'text-[#d23657]' : 'text-gray-400'}`}
                          />
                          {city.label}
                        </span>
                        {isSelected && (
                          <Check className="size-3.5 text-[#d23657]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary Navigation Bar (Only for public view, admin shell has no centered buttons) */}
        {!isAdminPanel && (
          <nav
            className="hidden items-center gap-7 lg:flex"
            aria-label="Primary navigation"
          >
            <Link
              to="/"
              data-testid="nav-home"
              className={`text-sm font-medium transition-colors hover:text-[#d23657] ${
                location.pathname === '/' && !location.hash
                  ? 'text-[#d23657]'
                  : 'text-gray-600'
              }`}
            >
              Home
            </Link>

            <Link
              to="/auctions"
              data-testid="nav-auctions"
              className={`text-sm font-medium transition-colors hover:text-[#d23657] ${
                location.pathname === '/auctions'
                  ? 'text-[#d23657]'
                  : 'text-gray-600'
              }`}
            >
              Auctions
            </Link>

            <Link
              to="/contact"
              data-testid="nav-contact"
              className={`text-sm font-medium transition-colors hover:text-[#d23657] ${
                location.pathname === '/contact'
                  ? 'text-[#d23657]'
                  : 'text-gray-600'
              }`}
            >
              Contact
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                data-testid="nav-admin-hub"
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-[#d23657]"
              >
                <LayoutDashboard className="size-4" />
                Admin hub
              </Link>
            )}
          </nav>
        )}

        <div className="flex items-center gap-2.5">
          {/* In Admin Shell: View site link */}
          {isAdminPanel && (
            <Link
              to="/"
              data-testid="admin-view-site-link"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
            >
              <span>View site</span>
              <ArrowUpRight className="size-3.5 text-gray-400" />
            </Link>
          )}

          {user && (
            <div
              data-testid="header-user-badge"
              className="hidden items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 sm:flex"
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full ${
                  isAdminPanel
                    ? 'bg-[#fdf0f3] text-[#b02644]'
                    : 'bg-[#fdf0f3] text-[#d23657]'
                }`}
              >
                <UserRound className="size-3.5" />
              </span>
              <span className="max-w-[120px] truncate text-xs font-semibold text-gray-700">
                {user.name}
              </span>
            </div>
          )}

          {/* My Bids is only for users, segregated away in admin panel */}
          {user && !isAdminPanel && (
            <Link
              to="/my-bids"
              data-testid="my-bids-link"
              className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-[#fdf0f3] hover:text-[#d23657] md:block"
            >
              My bids
            </Link>
          )}

          {user ? (
            <button
              type="button"
              onClick={() => logout()}
              data-testid="header-signout-button"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              <LogOut className="size-3.5" />
              <span>Sign out</span>
            </button>
          ) : (
            <Link
              to="/login"
              data-testid="header-login-link"
              className="hidden items-center gap-1.5 rounded-xl bg-[#d23657] px-3.5 py-2 text-sm font-semibold text-white shadow-[0_5px_14px_rgba(210,54,87,.2)] transition hover:bg-[#b02644] sm:flex"
            >
              <LogIn className="size-4" />
              Sign in
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            data-testid="header-mobile-toggle"
            className="flex size-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          data-testid="header-mobile-menu"
          className="border-t border-gray-200 bg-white px-4 py-3 shadow-lg lg:hidden"
        >
          {isAdminPanel ? (
            <div className="flex flex-col gap-1.5">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <span>View site</span>
                <ArrowUpRight className="size-4 text-gray-400" />
              </Link>
              {user && (
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                  <UserRound className="size-3.5 text-[#d23657]" />
                  <span>{user.name}</span>
                </div>
              )}
              <button
                type="button"
                data-testid="header-signout-button-mobile"
                onClick={() => {
                  setMenuOpen(false);
                  void logout();
                }}
                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                <LogOut className="size-3.5" />
                <span>Sign out</span>
              </button>
            </div>
          ) : (
            <>
              {/* Mobile City Selector */}
              <div className="mb-3 rounded-xl bg-gray-50 p-2.5">
                <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <MapPin className="size-3 text-[#d23657]" />
                  Select Auction City
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {availableCities.map((city) => (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => setSelectedCity(city.id)}
                      className={`rounded-lg py-1.5 text-center text-xs font-bold transition cursor-pointer ${
                        selectedCity === city.id
                          ? 'bg-[#d23657] text-white shadow-xs'
                          : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {city.id === 'all' ? 'All' : city.id}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <Link
                  to="/"
                  data-testid="nav-home-mobile"
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[#fdf0f3] hover:text-[#d23657] ${
                    location.pathname === '/' && !location.hash
                      ? 'text-[#d23657] font-semibold'
                      : 'text-gray-700'
                  }`}
                >
                  Home
                </Link>

                <Link
                  to="/auctions"
                  data-testid="nav-auctions-mobile"
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[#fdf0f3] hover:text-[#d23657] ${
                    location.pathname === '/auctions'
                      ? 'text-[#d23657] font-semibold'
                      : 'text-gray-700'
                  }`}
                >
                  Auctions
                </Link>

                <Link
                  to="/contact"
                  data-testid="nav-contact-mobile"
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-[#fdf0f3] hover:text-[#d23657] ${
                    location.pathname === '/contact'
                      ? 'text-[#d23657] font-semibold'
                      : 'text-gray-700'
                  }`}
                >
                  Contact
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    data-testid="nav-admin-hub-mobile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-[#d23657] hover:bg-[#fdf0f3]"
                  >
                    <LayoutDashboard className="size-4" />
                    Admin hub
                  </Link>
                )}

                {user && (
                  <Link
                    to="/my-bids"
                    data-testid="my-bids-link-mobile"
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#fdf0f3] hover:text-[#d23657]"
                  >
                    My bids
                  </Link>
                )}

                {user ? (
                  <button
                    type="button"
                    data-testid="header-signout-button-mobile"
                    onClick={() => {
                      setMenuOpen(false);
                      void logout();
                    }}
                    className="mt-1 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2.5 text-left text-sm font-semibold text-gray-700"
                  >
                    <LogOut className="size-4" />
                    Sign out ({user.name})
                  </button>
                ) : (
                  <Link
                    to="/login"
                    data-testid="header-login-link-mobile"
                    onClick={() => setMenuOpen(false)}
                    className="mt-1 flex items-center gap-2 rounded-lg bg-[#d23657] px-3 py-2.5 text-left text-sm font-semibold text-white"
                  >
                    <LogIn className="size-4" />
                    Sign in
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
