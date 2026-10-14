import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Clock3,
  CreditCard,
  Gavel,
  Home,
  LogIn,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Tag,
  Trophy,
  UserRound,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAuction, getBids, placeBid } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatKm, formatPrice, formatTime } from '@/lib/format';
import { getPrimaryCategory } from '@/lib/categories';
import Countdown from '@/components/app/Countdown';
import {
  joinAuctionRoom,
  leaveAuctionRoom,
  useRealtimeStatus,
} from '@/lib/realtime';
import { toast } from 'sonner';
export default function AuctionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const client = useQueryClient();
  const socketStatus = useRealtimeStatus();
  const [imageIndex, setImageIndex] = useState(0);
  const [customBid, setCustomBid] = useState('');
  const [pricePopped, setPricePopped] = useState(false);
  const [antiSnipeExtended, setAntiSnipeExtended] = useState(false);
  const auctionQuery = useQuery({
    queryKey: ['auction', id],
    queryFn: () => getAuction(id ?? ''),
    enabled: Boolean(id),
    refetchInterval: 5000,
  });
  const bidsQuery = useQuery({
    queryKey: ['bids'],
    queryFn: getBids,
    refetchInterval: 5000,
  });
  const auction = auctionQuery.data;
  const session = user || { email: '', name: '' };
  // Real-time room subscription
  useEffect(() => {
    if (id) {
      joinAuctionRoom(id);
      return () => {
        leaveAuctionRoom(id);
      };
    }
  }, [id]);
  // Anti-sniping extension listener
  useEffect(() => {
    const handleExtended = (e) => {
      const customEvent = e;
      if (customEvent.detail?.auctionId === id) {
        setAntiSnipeExtended(true);
        const timer = window.setTimeout(
          () => setAntiSnipeExtended(false),
          8000
        );
        return () => window.clearTimeout(timer);
      }
    };
    window.addEventListener('vutto-auction-extended', handleExtended);
    return () =>
      window.removeEventListener('vutto-auction-extended', handleExtended);
  }, [id]);
  // Trigger CSS price pop animation when current bid increases
  const prevBidRef = useRef(undefined);
  useEffect(() => {
    if (auction?.currentBid !== undefined) {
      if (
        prevBidRef.current !== undefined &&
        auction.currentBid > prevBidRef.current
      ) {
        setPricePopped(true);
        const timer = window.setTimeout(() => setPricePopped(false), 550);
        prevBidRef.current = auction.currentBid;
        return () => window.clearTimeout(timer);
      }
      prevBidRef.current = auction.currentBid;
    }
  }, [auction?.currentBid]);
  const bidMutation = useMutation({
    mutationFn: (amount) => placeBid(id ?? '', amount),
    onSuccess: (bid) => {
      setCustomBid('');
      toast.success(`Bid placed at ${formatPrice(bid.amount)}`);
      void client.invalidateQueries({ queryKey: ['auction', id] });
      void client.invalidateQueries({ queryKey: ['bids'] });
    },
    onError: (error) => toast.error(error.message),
  });
  if (auctionQuery.isLoading) {
    return (
      <div
        data-testid="auction-detail-loading"
        className="min-h-screen bg-[#fafafa] px-4 py-20 text-center"
      >
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#d23657] border-t-transparent" />
        <p className="mt-4 text-sm text-gray-500">Loading auction details…</p>
      </div>
    );
  }
  if (!auction) {
    return (
      <div
        data-testid="auction-not-found"
        className="min-h-screen px-4 py-24 text-center"
      >
        <p className="text-xl font-bold">That auction could not be found.</p>
        <Link
          to="/auctions"
          data-testid="back-to-auctions"
          className="mt-5 inline-flex rounded-xl bg-[#d23657] px-4 py-2.5 text-sm font-bold text-white"
        >
          Back to auctions
        </Link>
      </div>
    );
  }
  const auctionBids = (bidsQuery.data ?? [])
    .filter((bid) => bid.auctionId === auction.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const myBids = auctionBids.filter((bid) => bid.bidderEmail === session.email);
  const isWinning =
    myBids.length > 0 &&
    Math.max(...myBids.map((bid) => bid.amount)) >= auction.currentBid;
  const minBid = auction.currentBid + auction.minIncrement;
  const submitBid = (amount) => {
    if (amount < minBid) {
      toast.error(`Minimum next bid is ${formatPrice(minBid)}`);
      return;
    }
    bidMutation.mutate(amount);
  };
  const isLive = auction.status === 'LIVE';
  const isUpcoming = auction.status === 'UPCOMING';
  const isEnded = auction.status === 'ENDED' || auction.status === 'CANCELLED';
  const isAdmin = user?.role === 'admin';
  const isLoggedOut = !user;
  const category = getPrimaryCategory(auction);
  const CategoryIcon =
    category.iconName === 'Tag'
      ? Tag
      : category.iconName === 'Sparkles'
        ? Sparkles
        : category.iconName === 'Zap'
          ? Zap
          : BadgeCheck;
  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 md:pb-16">
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
          <Link to="/auctions" className="transition hover:text-[#d23657]">
            Auctions
          </Link>
          <ChevronRight className="size-3.5 text-gray-400" />
          <span className="max-w-[200px] truncate font-bold text-gray-900 sm:max-w-md">
            {auction.title}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top Navigation & Live Connection Badge */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/auctions"
            data-testid="detail-back-link"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 transition hover:text-[#d23657]"
          >
            <ArrowLeft className="size-4" />
            Back to auctions
          </Link>

          {/* Connection Indicator */}
          <div
            data-testid="connection-indicator"
            className="flex items-center gap-2"
          >
            {socketStatus === 'connected' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                <span className="size-2 animate-ping rounded-full bg-amber-500" />
                Reconnecting…
              </span>
            )}
          </div>
        </div>

        {/* Anti-sniping Flash Banner */}
        {antiSnipeExtended && (
          <div
            data-testid="anti-snipe-banner"
            className="mb-6 flex items-center gap-2.5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900 shadow-sm animate-snipe-flash"
          >
            <Clock3 className="size-4 shrink-0 text-amber-600" />
            <span>
              +2:00 added (Anti-sniping protection extended this auction)
            </span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-12">
          {/* Left Column: Gallery & Inspection */}
          <div>
            <div
              data-testid="auction-gallery"
              className="relative overflow-hidden rounded-3xl bg-gray-100 shadow-sm"
            >
              <img
                data-testid="auction-main-image"
                src={auction.images[imageIndex]}
                alt={auction.title}
                className="aspect-[1.15] w-full object-cover sm:aspect-[1.35]"
              />
              <button
                type="button"
                aria-label="Previous image"
                data-testid="gallery-previous"
                onClick={() =>
                  setImageIndex(
                    (index) =>
                      (index - 1 + auction.images.length) %
                      auction.images.length
                  )
                }
                className="absolute top-1/2 left-4 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition hover:bg-white"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Next image"
                data-testid="gallery-next"
                onClick={() =>
                  setImageIndex((index) => (index + 1) % auction.images.length)
                }
                className="absolute top-1/2 right-4 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition hover:bg-white"
              >
                <ChevronRight className="size-4" />
              </button>
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span
                  data-testid="detail-live-badge"
                  className={`rounded-full px-3 py-1.5 text-xs font-bold text-white ${
                    isLive
                      ? 'bg-[#d23657]'
                      : isUpcoming
                        ? 'bg-amber-600'
                        : 'bg-gray-700'
                  }`}
                >
                  {isLive
                    ? 'Live now'
                    : isUpcoming
                      ? 'Scheduled'
                      : auction.status}
                </span>
                <span
                  data-testid="detail-assured-badge"
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${category.badgeClass}`}
                >
                  <CategoryIcon className="size-3.5" />
                  {category.label}
                </span>
              </div>
            </div>

            <div
              data-testid="gallery-thumbnails"
              className="mt-3 flex gap-3 overflow-x-auto"
            >
              {auction.images.map((image, index) => (
                <button
                  type="button"
                  key={image}
                  aria-label={`Show image ${index + 1}`}
                  data-testid={`gallery-thumbnail-${index + 1}`}
                  onClick={() => setImageIndex(index)}
                  className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    imageIndex === index
                      ? 'border-[#d23657]'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={image} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>

            <div
              data-testid="inspection-summary"
              className="mt-7 rounded-2xl border border-[#a7f3d0] bg-[#ecfdf5] p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    data-testid="inspection-label"
                    className="text-xs font-bold uppercase tracking-wider text-emerald-700"
                  >
                    Inspection summary
                  </p>
                  <p
                    data-testid="inspection-score"
                    className="mt-2 text-2xl font-extrabold text-emerald-900"
                  >
                    {auction.inspectionScore}
                    <span className="ml-1 text-sm font-semibold text-emerald-700">
                      / 10
                    </span>
                  </p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-white text-emerald-600">
                  <ShieldCheck className="size-6" />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  'Engine checked',
                  'Clear RTO title',
                  `${auction.checkpointsPassed}+ checkpoints`,
                  '6-month warranty',
                ].map((item) => (
                  <span
                    key={item}
                    data-testid={`inspection-check-${item
                      .replaceAll(' ', '-')
                      .toLowerCase()}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-800"
                  >
                    <CircleCheck className="size-3.5" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Title, Timer & Bid Panel */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-[#d23657]">
              <Gavel className="size-4" />
              {auction.brand}
            </div>
            <h1
              data-testid="auction-detail-title"
              className="mt-3 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
            >
              {auction.title}
            </h1>
            <p
              data-testid="auction-detail-subtitle"
              className="mt-2 text-gray-500"
            >
              {auction.variant}
            </p>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-500">
              <span
                data-testid="detail-year"
                className="inline-flex items-center gap-1.5"
              >
                <Star className="size-4 text-amber-500" />
                {auction.year}
              </span>
              <span data-testid="detail-km">
                {formatKm(auction.kilometers)}
              </span>
              <span
                data-testid="detail-owner"
                className="inline-flex items-center gap-1.5"
              >
                <UserRound className="size-4" />
                {auction.owner}
              </span>
              <span
                data-testid="detail-location"
                className="inline-flex items-center gap-1.5"
              >
                <MapPin className="size-4 text-[#d23657]" />
                {auction.city}
              </span>
            </div>

            {/* Countdown & Status Panel */}
            <div
              data-testid="detail-countdown-panel"
              className={`mt-7 flex items-center justify-between rounded-2xl p-4 shadow-sm transition-all duration-300 ${
                antiSnipeExtended
                  ? 'border-2 border-amber-400 bg-amber-50/40 animate-snipe-flash'
                  : 'border border-gray-200 bg-white'
              }`}
            >
              <div>
                <p
                  data-testid="countdown-label"
                  className="text-xs font-semibold text-gray-500"
                >
                  {isUpcoming
                    ? 'Auction starts in'
                    : isEnded
                      ? 'Auction status'
                      : 'Auction closes in'}
                </p>
                <div className="mt-2">
                  <Countdown endsAt={auction.endsAt} status={auction.status} />
                </div>
              </div>
              <div className="text-right">
                <p
                  data-testid="bid-count-label"
                  className="text-xs text-gray-500"
                >
                  {bidsQuery.isSuccess ? auctionBids.length : auction.totalBids}{' '}
                  {(bidsQuery.isSuccess
                    ? auctionBids.length
                    : auction.totalBids) === 1
                    ? 'bid'
                    : 'bids'}{' '}
                  so far
                </p>
                <p
                  data-testid="closing-time"
                  className="mt-1 text-xs font-semibold text-gray-700"
                >
                  {isEnded ? 'Closed' : `Closes ${formatTime(auction.endsAt)}`}
                </p>
              </div>
            </div>

            {/* Bid Panel States */}

            {/* State: Ended / Cancelled */}
            {isEnded && (
              <div
                data-testid="auction-ended-panel"
                className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 text-gray-800">
                  <Trophy className="size-5 text-amber-500" />
                  <h3 className="text-base font-extrabold">Auction Ended</h3>
                </div>
                {auctionBids.length > 0 ? (
                  <div className="mt-4 space-y-2 rounded-xl bg-gray-50 p-4 text-sm">
                    <p className="text-gray-600">
                      Winner:{' '}
                      <span
                        data-testid="ended-winner-name"
                        className="font-bold text-gray-900"
                      >
                        {auctionBids[0].bidderName}
                        {auctionBids[0].bidderEmail === session.email
                          ? ' (You)'
                          : ''}
                      </span>
                    </p>
                    <p className="text-gray-600">
                      Final winning price:{' '}
                      <span
                        data-testid="ended-final-price"
                        className="font-extrabold text-[#d23657]"
                      >
                        {formatPrice(auction.currentBid)}
                      </span>
                    </p>

                    {/* Winner Celebration Callout & Payment Trigger */}
                    {auctionBids[0].bidderEmail === session.email && (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-left">
                        <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                          <Sparkles className="size-4 text-emerald-600 shrink-0" />
                          Congratulations! You won the hammer bid.
                        </p>
                        <p className="mt-1 text-[11px] text-gray-600">
                          Complete your purchase or place a 10% refundable deposit to hold this machine for physical hub inspection.
                        </p>
                        <Link
                          to={`/checkout/${auction.id}`}
                          data-testid="proceed-to-payment-btn"
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d23657] py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#b02644]"
                        >
                          <CreditCard className="size-4" />
                          Proceed to Payment & Secure Vehicle
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-gray-500">
                    This auction concluded with no bids placed. Starting price
                    was {formatPrice(auction.startingPrice)}.
                  </p>
                )}
              </div>
            )}

            {/* State: Upcoming */}
            {isUpcoming && (
              <div
                data-testid="auction-upcoming-panel"
                className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm text-center"
              >
                <Clock3 className="mx-auto size-7 text-blue-600" />
                <h3 className="mt-2 text-base font-extrabold text-blue-900">
                  Auction Scheduled
                </h3>
                <p className="mt-1 text-xs text-blue-700">
                  Bidding will open automatically when this auction goes live.
                  Starting price: <b>{formatPrice(auction.startingPrice)}</b>.
                </p>
              </div>
            )}

            {/* State: Live */}
            {isLive && (
              <div
                data-testid="bid-widget"
                className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                {/* Outbid Banner (with one-tap re-bid) */}
                {user && !isAdmin && myBids.length > 0 && !isWinning && (
                  <div
                    data-testid="bid-status-banner"
                    className="mb-4 flex flex-col gap-3 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 text-red-700 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                        <Zap className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-bold">You’ve been outbid</p>
                        <p className="mt-0.5 text-xs opacity-80">
                          Reclaim the lead with next minimum bid.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      data-testid="one-tap-rebid-btn"
                      disabled={bidMutation.isPending}
                      onClick={() => submitBid(minBid)}
                      className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 disabled:opacity-50"
                    >
                      <Gavel className="size-3.5" />
                      Bid {formatPrice(minBid)} now
                    </button>
                  </div>
                )}

                {/* Winning Banner */}
                {user && !isAdmin && isWinning && (
                  <div
                    data-testid="bid-status-banner"
                    className="mb-4 flex items-start gap-3 rounded-2xl border border-[#a7f3d0] bg-[#ecfdf5] p-4 text-emerald-800"
                  >
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <CircleCheck className="size-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">
                        You're the highest bidder
                      </p>
                      <p className="mt-0.5 text-xs opacity-80">
                        Stay close — another buyer could bid before the timer
                        ends.
                      </p>
                    </div>
                  </div>
                )}

                {/* Price Display with CSS-only Price Pop */}
                <div className="flex items-end justify-between">
                  <div>
                    <p
                      data-testid="current-bid-label"
                      className="text-xs font-bold uppercase tracking-wider text-gray-400"
                    >
                      Current highest bid
                    </p>
                    <p
                      data-testid="detail-current-bid"
                      className={`mt-1 text-3xl font-extrabold tracking-tight text-[#111827] transition duration-200 ${pricePopped ? 'animate-price-pop' : ''}`}
                    >
                      {formatPrice(auction.currentBid)}
                    </p>
                  </div>
                  <span
                    data-testid="minimum-increment"
                    className="text-xs font-medium text-gray-500"
                  >
                    Min increment {formatPrice(auction.minIncrement)}
                  </span>
                </div>

                {/* Logged Out State */}
                {isLoggedOut && (
                  <div data-testid="bid-logged-out-section" className="mt-5">
                    <Link
                      to="/login"
                      data-testid="sign-in-to-bid-btn"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d23657] text-sm font-bold text-white shadow-[0_7px_18px_rgba(210,54,87,.18)] transition hover:bg-[#b02644]"
                    >
                      <LogIn className="size-4" />
                      Sign in to bid
                    </Link>
                    <p className="mt-3 text-center text-xs text-gray-500">
                      You must be signed in as a buyer to participate in live
                      auctions.
                    </p>
                  </div>
                )}

                {/* Admin Disabled State */}
                {isAdmin && (
                  <div
                    data-testid="admin-bid-disabled-notice"
                    className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-xs font-semibold text-gray-600"
                  >
                    Admins can't place bids on auctions.
                  </div>
                )}

                {/* Buyer Live Bidding Controls */}
                {!isLoggedOut && !isAdmin && (
                  <>
                    <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                      <button
                        type="button"
                        data-testid="quick-bid-500"
                        disabled={bidMutation.isPending}
                        onClick={() => submitBid(minBid)}
                        className="h-11 rounded-xl border border-[#d23657]/20 bg-[#fdf0f3] text-sm font-bold text-[#b02644] transition hover:bg-[#fbe6eb] disabled:opacity-50"
                      >
                        +{formatPrice(500)}
                      </button>
                      <button
                        type="button"
                        data-testid="quick-bid-1000"
                        disabled={bidMutation.isPending}
                        onClick={() => submitBid(auction.currentBid + 1000)}
                        className="h-11 rounded-xl border border-[#d23657]/20 bg-[#fdf0f3] text-sm font-bold text-[#b02644] transition hover:bg-[#fbe6eb] disabled:opacity-50"
                      >
                        +{formatPrice(1000)}
                      </button>
                      <div className="relative col-span-2 sm:col-span-1">
                        <input
                          type="number"
                          min={minBid}
                          value={customBid}
                          onChange={(event) => setCustomBid(event.target.value)}
                          data-testid="custom-bid-input"
                          aria-label="Custom bid amount"
                          placeholder={`Custom · min ${formatPrice(minBid)}`}
                          className="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none transition focus:border-[#d23657] focus:ring-2 focus:ring-[#d23657]/10"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      data-testid="place-bid-button"
                      disabled={bidMutation.isPending}
                      onClick={() =>
                        submitBid(customBid ? Number(customBid) : minBid)
                      }
                      className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#d23657] text-sm font-bold text-white shadow-[0_7px_18px_rgba(210,54,87,.18)] transition hover:bg-[#b02644] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {bidMutation.isPending ? (
                        'Placing bid…'
                      ) : (
                        <>
                          <Gavel className="size-4" />
                          Place bid at{' '}
                          {formatPrice(customBid ? Number(customBid) : minBid)}
                        </>
                      )}
                    </button>
                    <p
                      data-testid="bid-disclaimer"
                      className="mt-3 text-center text-[11px] text-gray-400"
                    >
                      By bidding, you agree to Vutto’s auction terms. Payments
                      and KYC are handled after winning.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Need help with this auction link */}
            <div className="mt-3 text-center">
              <Link
                to={`/contact?auction=${auction.id}`}
                className="text-xs text-gray-500 transition hover:text-[#d23657] hover:underline"
              >
                Need help with this auction?
              </Link>
            </div>

            {/* Vehicle Details */}
            <div data-testid="auction-specs" className="mt-7">
              <div className="flex items-center justify-between">
                <h2 data-testid="specs-heading" className="text-lg font-bold">
                  Vehicle details
                </h2>
                <span
                  data-testid="specs-warranty"
                  className="text-xs font-semibold text-emerald-600"
                >
                  6-month warranty
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {Object.entries(auction.specs).map(([label, value]) => (
                  <div
                    key={label}
                    data-testid={`spec-${label
                      .toLowerCase()
                      .replaceAll(' ', '-')}`}
                    className="rounded-xl bg-white p-3 ring-1 ring-gray-100"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {label}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-gray-700">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bid History Section */}
        <section
          data-testid="bid-history-section"
          className="mt-10 border-t border-gray-200 pt-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                data-testid="bid-history-eyebrow"
                className="text-xs font-bold uppercase tracking-wider text-[#d23657]"
              >
                Live activity
              </p>
              <h2
                data-testid="bid-history-heading"
                className="mt-1 text-2xl font-extrabold tracking-tight"
              >
                Bid history
              </h2>
            </div>
            <span
              data-testid="live-updates-label"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600"
            >
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
              Updates live
            </span>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-gray-100 bg-gray-50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <span>Bidder</span>
              <span>Time</span>
              <span>Amount</span>
            </div>
            {auctionBids.length ? (
              auctionBids.slice(0, 8).map((bid) => (
                <div
                  key={bid.id}
                  data-testid={`bid-row-${bid.id}`}
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-gray-100 px-4 py-3 last:border-0 animate-bid-slide-in"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span
                      className={`size-7 rounded-full ${
                        bid.bidderEmail === session.email
                          ? 'bg-[#fbe6eb] text-[#d23657]'
                          : 'bg-gray-100 text-gray-500'
                      } flex items-center justify-center text-[10px] font-bold`}
                    >
                      {bid.bidderName.slice(0, 1)}
                    </span>
                    {bid.bidderEmail === session.email ? 'You' : bid.bidderName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(bid.createdAt)}
                  </span>
                  <span
                    data-testid={`bid-amount-${bid.id}`}
                    className="text-sm font-bold text-gray-900"
                  >
                    {formatPrice(bid.amount)}
                  </span>
                </div>
              ))
            ) : (
              <p
                data-testid="bid-history-empty"
                className="px-4 py-10 text-center text-sm text-gray-500"
              >
                No bids yet. Be the first to make a move.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
