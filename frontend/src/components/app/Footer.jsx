import { Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { CONTACT_DETAILS } from '@/data/contact';
export default function Footer() {
  const { user } = useAuth();
  return (
    <footer
      data-testid="site-footer"
      className="relative border-t border-[#f4d6dc] bg-gradient-to-b from-[#fdf6f8] via-[#faf5f7] to-[#fcf0f3] text-[#111827]"
    >
      {/* Theme color top accent stripe */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#d23657] via-[#e55b7a] to-[#d23657]" />

      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              to="/"
              data-testid="footer-brand"
              className="inline-flex items-center text-[20px] font-bold tracking-tight text-[#111827]"
              aria-label="Vutto Auctions home"
            >
              vutto<span className="text-[#d23657]">.</span>
              <span className="ml-1 font-semibold text-gray-600">auctions</span>
            </Link>
            <p className="mt-1 text-xs text-gray-500">
              Certified used two-wheeler auctions in Delhi NCR and Jaipur.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#d23657]/20 bg-[#fdf0f3] px-3.5 py-1 text-xs font-semibold text-[#b02644] sm:self-auto">
            <span className="size-1.5 rounded-full bg-[#d23657] shadow-[0_0_6px_#d23657]" />
            200+ Point Certified Auctions
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {/* Column 1: Auctions */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <span className="size-1.5 rounded-full bg-[#d23657]" />
              Auctions
            </h4>
            <ul className="mt-3.5 space-y-2 text-sm text-gray-600">
              <li>
                <Link
                  to="/auctions"
                  className="transition hover:text-[#d23657]"
                >
                  Live auctions
                </Link>
              </li>
              <li>
                <Link
                  to="/auctions?status=upcoming"
                  className="transition hover:text-[#d23657]"
                >
                  Upcoming
                </Link>
              </li>
              <li>
                <a
                  href="/#how-it-works"
                  className="transition hover:text-[#d23657]"
                >
                  How bidding works
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Account */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <span className="size-1.5 rounded-full bg-[#d23657]" />
              Account
            </h4>
            <ul className="mt-3.5 space-y-2 text-sm text-gray-600">
              {user ? (
                <>
                  <li>
                    <Link
                      to="/my-bids"
                      className="transition hover:text-[#d23657]"
                    >
                      My bids
                    </Link>
                  </li>
                  {user.role === 'admin' && (
                    <li>
                      <Link
                        to="/admin"
                        className="transition hover:text-[#d23657]"
                      >
                        Admin hub
                      </Link>
                    </li>
                  )}
                </>
              ) : (
                <>
                  <li>
                    <Link
                      to="/login"
                      className="transition hover:text-[#d23657]"
                    >
                      Sign in
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/register"
                      className="transition hover:text-[#d23657]"
                    >
                      Create account
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <span className="size-1.5 rounded-full bg-[#d23657]" />
              Contact
            </h4>
            <div className="mt-3.5 space-y-2.5 text-sm text-gray-600">
              <div
                data-testid="footer-phone"
                className="flex items-center gap-2.5"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[#d23657]/15 bg-[#fdf0f3] text-[#d23657]">
                  <Phone className="size-3.5" />
                </div>
                <span className="font-medium text-gray-700">
                  {CONTACT_DETAILS.phone}
                </span>
              </div>
              <div
                data-testid="footer-email"
                className="flex items-center gap-2.5"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[#d23657]/15 bg-[#fdf0f3] text-[#d23657]">
                  <Mail className="size-3.5" />
                </div>
                <span className="font-medium text-gray-700">
                  {CONTACT_DETAILS.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer & Copyright */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#f1d7dc] pt-6 text-center sm:flex-row sm:text-left">
          <p data-testid="footer-disclaimer" className="text-xs text-gray-500">
            Demo project inspired by{' '}
            <span className="font-semibold text-gray-700">vutto.in</span>. Not
            affiliated with Vutto.
          </p>
          <p className="text-xs text-gray-400">© 2026 Vutto Auctions (demo)</p>
        </div>
      </div>
    </footer>
  );
}
