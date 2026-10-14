import { joinAuctionRoom, updateSocketAuthToken } from './realtime';
import { toast } from 'sonner';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

const KEYS = {
  accessToken: 'vutto_access_token',
  refreshToken: 'vutto_refresh_token',
};

// In-memory user profile cache for synchronous access
let inMemoryUser = null;

export function getSession() {
  return (
    inMemoryUser || {
      email: '',
      name: 'Guest',
      role: 'buyer',
      city: '',
    }
  );
}

let isRefreshing = false;
let refreshSubscribers = [];

function onTokenRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function clearAuthSession() {
  localStorage.removeItem(KEYS.accessToken);
  localStorage.removeItem(KEYS.refreshToken);
  inMemoryUser = null;
  updateSocketAuthToken('');
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('vutto-auth-unauthorized'));
  }
}

async function fetchWithAuth(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem(KEYS.accessToken);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    const refreshToken = localStorage.getItem(KEYS.refreshToken);
    if (!refreshToken) {
      clearAuthSession();
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register')
      ) {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (!refreshRes.ok) {
          clearAuthSession();
          if (
            typeof window !== 'undefined' &&
            !window.location.pathname.startsWith('/login') &&
            !window.location.pathname.startsWith('/register')
          ) {
            window.location.href = '/login';
          }
          throw new Error('Session expired. Please log in again.');
        }
        const data = await refreshRes.json();
        localStorage.setItem(KEYS.accessToken, data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem(KEYS.refreshToken, data.refreshToken);
        }
        updateSocketAuthToken(data.accessToken);
        onTokenRefreshed(data.accessToken);
      } catch (refreshErr) {
        clearAuthSession();
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')
        ) {
          window.location.href = '/login';
        }
        throw refreshErr;
      } finally {
        isRefreshing = false;
      }
    }

    // Queue this request until the token is refreshed
    await new Promise((resolve) => refreshSubscribers.push(resolve));
    headers.set('Authorization', `Bearer ${localStorage.getItem(KEYS.accessToken)}`);
    const retryResponse = await fetch(url, { ...options, headers });
    if (!retryResponse.ok) {
      if (retryResponse.status === 401) {
        clearAuthSession();
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')
        ) {
          window.location.href = '/login';
        }
        throw new Error('Session expired. Please log in again.');
      }
      if (retryResponse.status === 403) {
        toast.error('Not allowed: You do not have permission for this action.');
        throw new Error('Not allowed: Admin privileges required.');
      }
      const errData = await retryResponse.json().catch(() => ({}));
      throw new Error(
        errData.message || `Request failed with status ${retryResponse.status}`
      );
    }
    return retryResponse.json();
  }

  if (response.status === 403) {
    toast.error('Not allowed: You do not have permission for this action.');
    throw new Error('Not allowed: Admin privileges required.');
  }
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = Array.isArray(errData.message)
      ? errData.message.join(', ')
      : errData.message || `Request failed with status ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return null;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function getMe() {
  const token = localStorage.getItem(KEYS.accessToken);
  if (!token) return null;
  const data = await fetchWithAuth('/auth/me');
  if (data) {
    inMemoryUser = {
      email: data.email,
      name: data.name,
      role: data.role?.toLowerCase() || 'buyer',
      city: data.city || '',
    };
  }
  return data;
}

export async function login(email, password) {
  const data = await fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.accessToken) {
    localStorage.setItem(KEYS.accessToken, data.accessToken);
    updateSocketAuthToken(data.accessToken);
  }
  if (data.refreshToken) {
    localStorage.setItem(KEYS.refreshToken, data.refreshToken);
  }
  return data;
}

export async function register(name, email, password) {
  const data = await fetchWithAuth('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
  if (data.accessToken) {
    localStorage.setItem(KEYS.accessToken, data.accessToken);
    updateSocketAuthToken(data.accessToken);
  }
  if (data.refreshToken) {
    localStorage.setItem(KEYS.refreshToken, data.refreshToken);
  }
  return data;
}

export async function logout() {
  try {
    await fetchWithAuth('/auth/logout', { method: 'POST' });
  } catch {
    // Ignore errors on network failure — session is cleared regardless
  } finally {
    clearAuthSession();
  }
}

// ─── Image Upload ─────────────────────────────────────────────────────────────

export async function uploadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        const MAX_SIZE = 1200;
        let width = img.width;
        let height = img.height;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(reader.result);
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export async function getAdminStats(data) {
  try {
    const res = await fetchWithAuth('/admin/stats');
    if (res && typeof res === 'object') {
      const auctions = data?.auctions || [];
      const bids = data?.bids || [];
      const nowMs = Date.now();
      const endingWithin24h = auctions.filter((a) => {
        if (a.status !== 'LIVE') return false;
        const endMs = new Date(a.endsAt).getTime();
        return endMs > nowMs && endMs <= nowMs + 24 * 3600 * 1000;
      });
      const needsAttention = [];
      auctions.forEach((auc) => {
        if (auc.status === 'LIVE') {
          const diffMs = new Date(auc.endsAt).getTime() - nowMs;
          if (diffMs > 0 && diffMs <= 24 * 3600 * 1000) {
            const hours = Math.floor(diffMs / (3600 * 1000));
            const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
            const timeLeftText = hours > 0 ? `Ends in ${hours}h ${mins}m` : `Ends in ${mins}m`;
            needsAttention.push({ auction: auc, type: 'ending_soon', timeLeftText });
          }
        } else if (auc.status === 'UPCOMING') {
          const startMs = new Date(auc.startAt || auc.endsAt).getTime();
          const diffMs = startMs - nowMs;
          if (diffMs > 0 && diffMs <= 24 * 3600 * 1000) {
            const hours = Math.floor(diffMs / (3600 * 1000));
            const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
            const timeLeftText = hours > 0 ? `Starts in ${hours}h ${mins}m` : `Starts in ${mins}m`;
            needsAttention.push({ auction: auc, type: 'starting_soon', timeLeftText });
          }
        }
      });
      const recentBids = [...bids]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      return {
        ...res,
        endingWithin24h,
        needsAttention,
        recentBids,
      };
    }
  } catch {
    // Fall back to computing from passed-in auctions & bids if non-admin
  }

  const auctions = data?.auctions ?? (await getAuctions());
  const bids = data?.bids ?? (await getBids());
  const liveCount = auctions.filter((a) => a.status === 'LIVE').length;
  const upcomingCount = auctions.filter((a) => a.status === 'UPCOMING').length;
  const endedCount = auctions.filter((a) => a.status === 'ENDED').length;
  const cancelledCount = auctions.filter((a) => a.status === 'CANCELLED').length;
  const now = new Date();
  const nowMs = now.getTime();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const bidsToday = bids.filter(
    (b) => new Date(b.createdAt).getTime() >= startOfToday
  ).length;

  const userEmails = new Set();
  bids.forEach((bid) => {
    if (bid.bidderEmail) userEmails.add(bid.bidderEmail.toLowerCase());
  });
  const registeredUsers = userEmails.size;

  const bidsPerHour = [];
  for (let i = 11; i >= 0; i--) {
    const slotEnd = new Date(nowMs - i * 3600 * 1000);
    const slotStart = new Date(nowMs - (i + 1) * 3600 * 1000);
    const hourLabel = new Intl.DateTimeFormat('en-IN', {
      hour: 'numeric',
      hour12: true,
    }).format(slotEnd);
    const count = bids.filter((b) => {
      const t = new Date(b.createdAt).getTime();
      return t >= slotStart.getTime() && t < slotEnd.getTime();
    }).length;
    bidsPerHour.push({ hour: hourLabel, bids: count });
  }

  const endingWithin24h = auctions.filter((a) => {
    if (a.status !== 'LIVE') return false;
    const endMs = new Date(a.endsAt).getTime();
    return endMs > nowMs && endMs <= nowMs + 24 * 3600 * 1000;
  });

  const needsAttention = [];
  auctions.forEach((auc) => {
    if (auc.status === 'LIVE') {
      const diffMs = new Date(auc.endsAt).getTime() - nowMs;
      if (diffMs > 0 && diffMs <= 24 * 3600 * 1000) {
        const hours = Math.floor(diffMs / (3600 * 1000));
        const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
        const timeLeftText =
          hours > 0 ? `Ends in ${hours}h ${mins}m` : `Ends in ${mins}m`;
        needsAttention.push({ auction: auc, type: 'ending_soon', timeLeftText });
      }
    } else if (auc.status === 'UPCOMING') {
      const startMs = new Date(auc.startAt || auc.endsAt).getTime();
      const diffMs = startMs - nowMs;
      if (diffMs > 0 && diffMs <= 24 * 3600 * 1000) {
        const hours = Math.floor(diffMs / (3600 * 1000));
        const mins = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));
        const timeLeftText =
          hours > 0 ? `Starts in ${hours}h ${mins}m` : `Starts in ${mins}m`;
        needsAttention.push({ auction: auc, type: 'starting_soon', timeLeftText });
      }
    }
  });

  const recentBids = [...bids]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    liveCount,
    upcomingCount,
    endedCount,
    cancelledCount,
    bidsToday,
    registeredUsers,
    bidsPerHour,
    endingWithin24h,
    needsAttention,
    recentBids,
  };
}

// ─── Auctions ─────────────────────────────────────────────────────────────────

export async function getAuctions() {
  const res = await fetchWithAuth('/auctions?limit=100');
  if (Array.isArray(res)) return res;
  if (res?.data && Array.isArray(res.data)) return res.data;
  return [];
}

export async function getAuction(auctionId) {
  const res = await fetchWithAuth(`/auctions/${auctionId}`);
  joinAuctionRoom(auctionId);
  return res;
}

// ─── Bikes ────────────────────────────────────────────────────────────────────

export async function getBikes() {
  const res = await fetchWithAuth('/bikes');
  return Array.isArray(res) ? res : [];
}

// ─── Bids ─────────────────────────────────────────────────────────────────────

export async function getBids() {
  const res = await fetchWithAuth('/bids');
  return Array.isArray(res) ? res : [];
}

export async function placeBid(auctionId, amount) {
  const idempotencyKey = crypto.randomUUID();
  return await fetchWithAuth(`/auctions/${auctionId}/bids`, {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ amount, idempotencyKey }),
  });
}

// ─── Admin: Bikes ─────────────────────────────────────────────────────────────

export async function saveBike(input, bikeId) {
  const endpoint = bikeId ? `/admin/bikes/${bikeId}` : '/admin/bikes';
  const method = bikeId ? 'PUT' : 'POST';
  return await fetchWithAuth(endpoint, { method, body: JSON.stringify(input) });
}

export async function deleteBike(bikeId) {
  return await fetchWithAuth(`/admin/bikes/${bikeId}`, { method: 'DELETE' });
}

// ─── Admin: Auctions ──────────────────────────────────────────────────────────

export async function saveAuction(input, auctionId) {
  if (auctionId) {
    return await fetchWithAuth(`/admin/auctions/${auctionId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: input.title,
        startingPrice: input.startingPrice,
        minIncrement: input.minIncrement,
        endsAt: input.endsAt,
        status: input.status,
      }),
    });
  }
  return await fetchWithAuth('/admin/auctions', {
    method: 'POST',
    body: JSON.stringify({
      bikeId: input.bikeId,
      title: input.title,
      startingPrice: input.startingPrice,
      minIncrement: input.minIncrement,
      startsAt: new Date().toISOString(),
      endsAt: input.endsAt,
      status: input.status || 'UPCOMING',
    }),
  });
}

export async function closeAuction(auctionId) {
  return await fetchWithAuth(`/admin/auctions/${auctionId}/close`, { method: 'POST' });
}

export async function cancelAuction(auctionId) {
  return await fetchWithAuth(`/admin/auctions/${auctionId}/cancel`, { method: 'POST' });
}

// ─── Contact ──────────────────────────────────────────────────────────────────

export async function submitContact(_input) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    success: true,
    messageId: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };
}
