export const CATEGORIES = [
  { id: 'all', label: 'All categories' },
  { id: 'assured', label: 'Vutto Assured' },
  { id: 'value', label: 'Value' },
  { id: 'premium', label: 'Premium' },
  { id: 'low-km', label: 'Low KM' },
];
/**
 * Returns all categories an auction qualifies for (used for filtering)
 */
export function getAuctionCategories(auction) {
  const cats = [];
  // Vutto Assured: high inspection score (>= 9.0) or certified checkpoints (>= 200)
  if (auction.inspectionScore >= 9.0 || auction.checkpointsPassed >= 200) {
    cats.push('assured');
  }
  // Value: price <= 65,000, starting price <= 55,000, or commuter models
  if (
    auction.currentBid <= 65000 ||
    auction.startingPrice <= 55000 ||
    ['splendor', 'activa', 'jupiter', 'access'].some((m) =>
      auction.model.toLowerCase().includes(m)
    )
  ) {
    cats.push('value');
  }
  // Premium: 200cc+, currentBid >= 100,000, or premium brands (Royal Enfield, Vespa, etc.)
  if (
    auction.engineCc >= 200 ||
    auction.currentBid >= 100000 ||
    ['royal enfield', 'vespa', 'ktm', 'bmw'].some((b) =>
      auction.brand.toLowerCase().includes(b)
    )
  ) {
    cats.push('premium');
  }
  // Low KM: < 12,000 km
  if (auction.kilometers < 12000) {
    cats.push('low-km');
  }
  if (cats.length === 0) {
    cats.push('assured');
  }
  return cats;
}
/**
 * Determines the primary category badge to display on cards & details
 */
export function getPrimaryCategory(auction) {
  // Budget commuters -> Value
  if (
    auction.currentBid <= 55000 ||
    ['splendor', 'activa', 'jupiter', 'access'].some((m) =>
      auction.model.toLowerCase().includes(m)
    )
  ) {
    return {
      id: 'value',
      label: 'Value',
      badgeClass:
        'bg-emerald-50 text-emerald-700 border border-emerald-200/90 shadow-xs',
      iconName: 'Tag',
    };
  }
  // Cruisers / large displacement -> Premium
  if (
    auction.engineCc >= 250 ||
    auction.currentBid >= 120000 ||
    auction.brand.toLowerCase().includes('royal enfield')
  ) {
    return {
      id: 'premium',
      label: 'Premium',
      badgeClass:
        'bg-purple-50 text-purple-700 border border-purple-200/90 shadow-xs',
      iconName: 'Sparkles',
    };
  }
  // Low KM (< 10,000 km)
  if (auction.kilometers < 10000) {
    return {
      id: 'low-km',
      label: 'Low KM',
      badgeClass:
        'bg-blue-50 text-blue-700 border border-blue-200/90 shadow-xs',
      iconName: 'Zap',
    };
  }
  // Default: Vutto Assured
  return {
    id: 'assured',
    label: 'Vutto Assured',
    badgeClass: 'bg-white/95 text-[#d23657] shadow-xs',
    iconName: 'BadgeCheck',
  };
}
