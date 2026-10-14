import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Gavel, Trophy, WalletCards } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuctions, getBids } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/format';
import Countdown from '@/components/app/Countdown';
export default function MyBids() {
  const [tab, setTab] = useState('active');
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['my-bids'],
    queryFn: async () => {
      const [auctions, bids] = await Promise.all([getAuctions(), getBids()]);
      return { auctions, bids };
    },
    refetchInterval: 10000,
  });
  const session = user || { email: '', name: '' };
  const data = query.data ?? { auctions: [], bids: [] };
  const mine = data.bids.filter((bid) => bid.bidderEmail === session.email);
  const cards = data.auctions
    .filter((auction) => mine.some((bid) => bid.auctionId === auction.id))
    .filter((auction) => {
      const myMax = Math.max(
        ...mine
          .filter((bid) => bid.auctionId === auction.id)
          .map((bid) => bid.amount)
      );
      return tab === 'active'
        ? auction.status === 'LIVE'
        : tab === 'won'
          ? auction.status === 'ENDED' && myMax >= auction.currentBid
          : auction.status === 'ENDED' && myMax < auction.currentBid;
    });
  const totalCommitted = mine.reduce((sum, bid) => sum + bid.amount, 0);
  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p
              data-testid="my-bids-eyebrow"
              className="text-xs font-bold uppercase tracking-[.16em] text-[#d23657]"
            >
              Your garage
            </p>
            <h1
              data-testid="my-bids-heading"
              className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              My bids
            </h1>
            <p data-testid="my-bids-description" className="mt-3 text-gray-600">
              Keep an eye on the rides you want before the hammer drops.
            </p>
          </div>
          <div
            data-testid="my-bids-user"
            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm"
          >
            <span className="text-gray-500">Signed in as </span>
            <b>{session.name}</b>
          </div>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div
            data-testid="metric-total-bids"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <Gavel className="size-5 text-[#d23657]" />
            <p className="mt-4 text-2xl font-extrabold">{mine.length}</p>
            <p className="text-xs font-semibold text-gray-500">
              Total bids placed
            </p>
          </div>
          <div
            data-testid="metric-leading"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <Trophy className="size-5 text-emerald-500" />
            <p className="mt-4 text-2xl font-extrabold">
              {
                data.auctions.filter(
                  (auction) =>
                    auction.status === 'LIVE' &&
                    mine.some(
                      (bid) =>
                        bid.auctionId === auction.id &&
                        bid.amount >= auction.currentBid
                    )
                ).length
              }
            </p>
            <p className="text-xs font-semibold text-gray-500">
              Auctions you lead
            </p>
          </div>
          <div
            data-testid="metric-committed"
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <WalletCards className="size-5 text-amber-500" />
            <p className="mt-4 text-2xl font-extrabold">
              {formatPrice(totalCommitted)}
            </p>
            <p className="text-xs font-semibold text-gray-500">
              Total committed
            </p>
          </div>
        </div>
        <div className="mt-10 flex gap-1 border-b border-gray-200">
          <button
            type="button"
            data-testid="my-bids-active"
            onClick={() => setTab('active')}
            className={`border-b-2 px-4 py-3 text-sm font-bold ${tab === 'active' ? 'border-[#d23657] text-[#d23657]' : 'border-transparent text-gray-500'}`}
          >
            Active bids
          </button>
          <button
            type="button"
            data-testid="my-bids-won"
            onClick={() => setTab('won')}
            className={`border-b-2 px-4 py-3 text-sm font-bold ${tab === 'won' ? 'border-[#d23657] text-[#d23657]' : 'border-transparent text-gray-500'}`}
          >
            Won auctions
          </button>
          <button
            type="button"
            data-testid="my-bids-lost"
            onClick={() => setTab('lost')}
            className={`border-b-2 px-4 py-3 text-sm font-bold ${tab === 'lost' ? 'border-[#d23657] text-[#d23657]' : 'border-transparent text-gray-500'}`}
          >
            Lost auctions
          </button>
        </div>
        {query.isLoading ? (
          <div
            data-testid="my-bids-loading"
            className="mt-8 animate-pulse rounded-2xl bg-gray-200 py-32"
          />
        ) : cards.length ? (
          <div data-testid="my-bids-list" className="mt-6 space-y-3">
            {cards.map((auction) => {
              const myMax = Math.max(
                ...mine
                  .filter((bid) => bid.auctionId === auction.id)
                  .map((bid) => bid.amount)
              );
              const leading = myMax >= auction.currentBid;
              return (
                <div
                  key={auction.id}
                  data-testid={`my-bid-card-${auction.id}`}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  <img
                    src={auction.images[0]}
                    alt={auction.title}
                    className="h-28 w-full rounded-xl object-cover sm:w-40"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        data-testid={`my-bid-title-${auction.id}`}
                        className="truncate font-bold"
                      >
                        {auction.title}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          auction.status === 'ENDED' && leading
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : leading
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {auction.status === 'ENDED' && leading
                          ? '🏆 Auction Won'
                          : leading
                          ? "You're winning"
                          : 'Outbid'}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Your highest bid {formatPrice(myMax)} · Current{' '}
                      {formatPrice(auction.currentBid)}
                    </p>
                    <div className="mt-3">
                      <Countdown
                        endsAt={auction.endsAt}
                        status={auction.status}
                        compact
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    {auction.status === 'ENDED' && leading ? (
                      <Link
                        to={`/checkout/${auction.id}`}
                        data-testid={`my-bid-pay-${auction.id}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#d23657] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#b02644]"
                      >
                        Proceed to Payment <ArrowRight className="size-4" />
                      </Link>
                    ) : (
                      <Link
                        to={`/auction/${auction.id}`}
                        data-testid={`my-bid-view-${auction.id}`}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#fdf0f3] px-4 py-2.5 text-sm font-bold text-[#b02644] transition hover:bg-[#fbe6eb]"
                      >
                        View auction <ArrowRight className="size-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            data-testid="my-bids-empty-state"
            className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center"
          >
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#fdf0f3] text-[#d23657]">
              <Gavel className="size-5" />
            </div>
            <p data-testid="my-bids-empty-heading" className="mt-4 font-bold">
              Nothing here yet
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Find a ride you love and make your first bid.
            </p>
            <Link
              to="/auctions"
              data-testid="my-bids-browse"
              className="mt-5 inline-flex rounded-xl bg-[#d23657] px-4 py-2.5 text-sm font-bold text-white"
            >
              Browse auctions
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
