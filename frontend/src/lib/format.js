export const formatPrice = (amount) => `₹${amount.toLocaleString('en-IN')}`;
export const formatKm = (amount) => `${amount.toLocaleString('en-IN')} km`;
export const formatTime = (iso) =>
  new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));
