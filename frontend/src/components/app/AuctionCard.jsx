import { MapPin, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatKm, formatPrice } from '@/lib/format';
import Countdown from './Countdown';
export default function AuctionCard({ auction }) {
  // Title: If model name does not already contain the brand name, show "Brand Model"
  const title = auction.model
    .toLowerCase()
    .includes(auction.brand.toLowerCase())
    ? auction.model
    : `${auction.brand} ${auction.model}`;
  // Location: Clean to "Delhi NCR" or "Jaipur", dropping "Hub"
  const location = auction.city.toLowerCase().includes('jaipur')
    ? 'Jaipur'
    : auction.city.toLowerCase().includes('delhi')
      ? 'Delhi NCR'
      : auction.city.replace(/\s*Hub/gi, '').trim();
  // Owner: written in data in normal case
  const ownerText = auction.owner ? auction.owner.toLowerCase() : '';
  // Pluralisation for bids
  const bidsCountText =
    auction.totalBids === 0
      ? 'No bids yet'
      : auction.totalBids === 1
        ? '1 bid'
        : `${auction.totalBids} bids`;
  const bidLabelText = auction.totalBids > 0 ? 'Current bid' : 'Starting bid';
  const displayPrice =
    auction.totalBids > 0 ? auction.currentBid : auction.startingPrice;
  return (
    <Link
      to={`/auction/${auction.id}`}
      data-testid={`auction-card-${auction.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-2xs transition duration-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d23657] focus-visible:ring-offset-2"
    >
      {/* 4:3 Image with Countdown Pill */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
        <img
          src={auction.images[0]}
          alt={auction.title}
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute right-3 top-3">
          <Countdown
            endsAt={auction.endsAt}
            status={auction.status}
            totalBids={auction.totalBids}
            currentBid={auction.currentBid}
            compact
          />
        </div>
      </div>

      {/* Card Content - Equal Heights */}
      <div className="flex flex-1 flex-col justify-between space-y-3 p-4">
        <div className="space-y-3">
          <div>
            <p
              data-testid={`auction-card-title-${auction.id}`}
              className="truncate text-base font-bold text-[#111827]"
            >
              {title}
            </p>
            <p
              data-testid={`auction-card-variant-${auction.id}`}
              className="mt-0.5 truncate text-xs text-gray-500"
            >
              {auction.variant}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span data-testid={`auction-card-year-${auction.id}`}>
              {auction.year}
            </span>
            <span className="size-1 rounded-full bg-gray-300" />
            <span data-testid={`auction-card-km-${auction.id}`}>
              {formatKm(auction.kilometers)}
            </span>
            <span className="size-1 rounded-full bg-gray-300" />
            <span
              data-testid={`auction-card-owner-${auction.id}`}
              className="inline-flex items-center gap-1"
            >
              <UserRound className="size-3 text-gray-400" />
              {ownerText}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="size-3.5 text-[#d23657]" />
            <span data-testid={`auction-card-city-${auction.id}`}>
              {location}
            </span>
          </div>
        </div>

        {/* Price Block: "Current bid" on left, "3 bids" muted on right (normal case, 13px), price below */}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between text-[13px]">
            <span
              data-testid={`auction-card-bid-label-${auction.id}`}
              className="font-normal text-gray-500"
            >
              {bidLabelText}
            </span>
            <span className="text-gray-400">{bidsCountText}</span>
          </div>
          <p
            data-testid={`auction-card-current-bid-${auction.id}`}
            className="mt-1 text-lg font-bold text-[#111827]"
          >
            {formatPrice(displayPrice)}
          </p>
        </div>
      </div>
    </Link>
  );
}
