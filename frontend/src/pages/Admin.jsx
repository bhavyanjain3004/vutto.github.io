import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Ban,
  Bike as BikeIcon,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  LayoutDashboard,
  Pencil,
  Play,
  Plus,
  Search,
  Star,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  cancelAuction,
  closeAuction,
  deleteBike,
  getAdminStats,
  getAuctions,
  getBikes,
  getBids,
  saveAuction,
  saveBike,
  uploadImage,
} from '@/lib/api';
import { formatKm, formatPrice, formatTime } from '@/lib/format';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from '@/lib/recharts';
import { toast } from 'sonner';
// Format time with seconds for bid logs
function formatTimeWithSeconds(iso) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
// Format score with one decimal: e.g. 9.0
function formatScore(score) {
  if (score === undefined || score === null || Number.isNaN(score))
    return '9.0';
  return score.toFixed(1);
}
// Accessible Focus Trap hook for modals and dialogs
function useFocusTrap(isOpen, onClose) {
  const containerRef = useRef(null);
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && containerRef.current) {
        const focusable = containerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);
  return containerRef;
}
export default function Admin() {
  const [section, setSection] = useState('dashboard');
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['admin-data'],
    queryFn: async () => {
      const [auctions, bikes, bids] = await Promise.all([
        getAuctions(),
        getBikes(),
        getBids(),
      ]);
      const stats = await getAdminStats({ auctions, bikes, bids });
      return { auctions, bikes, bids, stats };
    },
  });
  const auctions = query.data?.auctions ?? [];
  const bikes = query.data?.bikes ?? [];
  const bids = query.data?.bids ?? [];
  const stats = query.data?.stats;
  const refresh = () =>
    void client.invalidateQueries({ queryKey: ['admin-data'] });
  const nav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bikes', label: 'Bikes', icon: BikeIcon },
    { id: 'auctions', label: 'Auctions', icon: CalendarClock },
    { id: 'logs', label: 'Bid logs', icon: Activity },
  ];
  return (
    <div className="min-h-screen bg-[#fafafa] pb-16">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8">
        {/* Sidebar: Just the navigation */}
        <aside data-testid="admin-sidebar" className="lg:w-48 lg:shrink-0">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {nav.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                data-testid={`admin-nav-${id}`}
                onClick={() => setSection(id)}
                className={`flex min-w-max items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition ${
                  section === id
                    ? 'bg-[#fdf0f3] text-[#b02644] font-semibold'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
              >
                <Icon className="size-4" />
                <span>{label}</span>
                <ChevronRight
                  className={`ml-auto hidden size-3 lg:block ${section === id ? 'text-[#b02644]' : 'opacity-0'}`}
                />
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1">
          {section === 'dashboard' && (
            <Dashboard stats={stats} auctions={auctions} bids={bids} />
          )}

          {section === 'bikes' && (
            <BikeInventory
              bikes={bikes}
              auctions={auctions}
              onRefresh={refresh}
            />
          )}

          {section === 'auctions' && (
            <AuctionManager
              auctions={auctions}
              bikes={bikes}
              onRefresh={refresh}
            />
          )}

          {section === 'logs' && <BidLogs bids={bids} auctions={auctions} />}
        </main>
      </div>
    </div>
  );
}
/* =========================================================================
   3. DASHBOARD
   ========================================================================= */
function Dashboard({ stats, auctions, bids }) {
  const liveCount =
    stats?.liveCount ?? auctions.filter((a) => a.status === 'LIVE').length;
  const upcomingCount =
    stats?.upcomingCount ??
    auctions.filter((a) => a.status === 'UPCOMING').length;
  const bidsToday = stats?.bidsToday ?? 0;
  const registeredUsers = stats?.registeredUsers ?? 0;
  const chartData = stats?.bidsPerHour ?? [];
  const needsAttention = stats?.needsAttention ?? [];
  const recentBids = stats?.recentBids ?? bids.slice(0, 5);
  const kpis = [
    { label: 'Live auctions', value: liveCount },
    { label: 'Upcoming auctions', value: upcomingCount },
    { label: 'Bids today', value: bidsToday },
    { label: 'Registered users', value: registeredUsers },
  ];
  return (
    <div data-testid="admin-dashboard-content">
      {/* Page Header: only an H1 */}
      <div className="mb-5">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Dashboard
        </h1>
      </div>

      {/* Four KPI cards, no icons, delta only if computed from data */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value }) => (
          <div
            key={label}
            data-testid={`admin-kpi-${label.toLowerCase().replaceAll(' ', '-')}`}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-2xs"
          >
            <p className="text-2xl font-bold tracking-tight text-gray-900">
              {value}
            </p>
            <p className="mt-1 text-[13px] font-medium text-gray-500">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.8fr]">
        {/* Chart: Bids per hour, last 12 hours */}
        <div
          data-testid="bids-over-time-chart"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xs"
        >
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Bids per hour, last 12 hours
            </h2>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="hour"
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                />
                <Tooltip
                  cursor={{ fill: '#fdf0f3' }}
                  formatter={(val) => [
                    `${val ?? 0} ${val === 1 ? 'bid' : 'bids'}`,
                    'Bids',
                  ]}
                  labelStyle={{
                    color: '#111827',
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#f3d7de',
                    borderRadius: 8,
                    fontSize: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                />
                <Bar
                  dataKey="bids"
                  fill="#d23657"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Needs attention section */}
        <div
          data-testid="admin-needs-attention"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-2xs flex flex-col"
        >
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-gray-900">
              Needs attention
            </h2>
          </div>

          {needsAttention.length === 0 ? (
            <div className="my-auto py-8 text-center text-sm text-gray-500">
              Nothing needs attention.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 overflow-y-auto max-h-64 space-y-2">
              {needsAttention.map(({ auction, type, timeLeftText }) => (
                <div
                  key={auction.id}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/auction/${auction.id}`}
                      className="text-xs font-semibold text-gray-900 hover:text-[#d23657] truncate block"
                    >
                      {auction.title}
                    </Link>
                    <p className="text-[11px] text-gray-500">
                      {timeLeftText} · {formatPrice(auction.currentBid)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      type === 'ending_soon'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {type === 'ending_soon' ? 'Live' : 'Upcoming'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent bids table */}
      <div className="mt-5 rounded-xl border border-gray-200 bg-white p-5 shadow-2xs">
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Recent bids</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-100 bg-gray-50/70 text-[13px] font-medium text-gray-500 tracking-normal">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Bidder
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Auction
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Amount
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentBids.map((bid) => {
                const auc = auctions.find((a) => a.id === bid.auctionId);
                return (
                  <tr key={bid.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2.5 font-medium text-gray-900">
                      <div>{bid.bidderName}</div>
                      <div className="text-[11px] text-gray-400">
                        {bid.bidderEmail}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700 max-w-[280px]">
                      {auc ? (
                        <Link
                          to={`/auction/${auc.id}`}
                          className="hover:text-[#d23657] font-medium"
                        >
                          {auc.title}
                        </Link>
                      ) : (
                        'Auction'
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-gray-900">
                      {formatPrice(bid.amount)}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500">
                      {formatTime(bid.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
const emptyBikeFormState = {
  brand: '',
  model: '',
  variant: '',
  year: '',
  city: '',
  fuel: 'Petrol',
  kilometers: '',
  engineCc: '',
  power: '',
  mileage: '',
  batteryHealth: '',
  owner: '1st owner',
  insuranceValidTill: '',
  inspectionScore: '',
  checkpointsPassed: '',
  certified: true,
  images: [],
};
function BikeInventory({ bikes, auctions, onRefresh }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingBikeId, setEditingBikeId] = useState();
  const [form, setForm] = useState(emptyBikeFormState);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  // Focus trap for form dialog
  const formDialogRef = useFocusTrap(formOpen, () => setFormOpen(false));
  // Count active in auction vs ready to list
  const activeAuctionByBikeId = useMemo(() => {
    const map = new Map();
    auctions.forEach((auc) => {
      if (auc.status === 'LIVE' || auc.status === 'UPCOMING') {
        map.set(auc.bikeId, auc);
      }
    });
    return map;
  }, [auctions]);
  // Any auction linked to bike (including ended/cancelled) to block delete
  const allAuctionsByBikeId = useMemo(() => {
    const map = new Map();
    auctions.forEach((auc) => {
      const list = map.get(auc.bikeId) || [];
      list.push(auc);
      map.set(auc.bikeId, list);
    });
    return map;
  }, [auctions]);
  const bikesInAuction = bikes.filter((b) =>
    activeAuctionByBikeId.has(b.id)
  ).length;
  const bikesReady = bikes.length - bikesInAuction;
  const openAddForm = () => {
    setEditingBikeId(undefined);
    setForm(emptyBikeFormState);
    setFormOpen(true);
  };
  const openEditForm = (bike) => {
    setEditingBikeId(bike.id);
    const specs = bike.specs || {};
    const gallery =
      Array.isArray(specs.images) && specs.images.length > 0
        ? specs.images
        : bike.image
          ? [bike.image]
          : [];
    // Parse power and mileage numbers from string suffixes if needed
    const powerNum =
      typeof specs.Power === 'string'
        ? parseFloat(specs.Power) || ''
        : specs.Power || '';
    const mileageNum =
      typeof specs.Mileage === 'string'
        ? parseFloat(specs.Mileage) || ''
        : specs.Mileage || '';
    const batteryNum =
      typeof specs['Battery health'] === 'string'
        ? parseFloat(specs['Battery health']) || ''
        : specs['Battery health'] || '';
    setForm({
      brand: bike.brand || '',
      model: bike.model || '',
      variant: bike.variant || '',
      year: bike.year || '',
      city: bike.city || '',
      fuel: bike.fuel || 'Petrol',
      kilometers: bike.kilometers || '',
      engineCc: bike.engineCc || '',
      power: powerNum,
      mileage: mileageNum,
      batteryHealth: batteryNum,
      owner: bike.owner || '1st owner',
      insuranceValidTill: specs.Insurance || '',
      inspectionScore: bike.inspectionScore ?? 9.0,
      checkpointsPassed: bike.checkpointsPassed ?? 200,
      certified: bike.certified ?? true,
      images: gallery,
    });
    setFormOpen(true);
  };
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (form.images.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed per bike.');
      return;
    }
    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) => uploadImage(file));
      const urls = await Promise.all(uploadPromises);
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...urls].slice(0, 5),
      }));
      toast.success(
        `${urls.length} ${urls.length === 1 ? 'photo' : 'photos'} uploaded.`
      );
    } catch {
      toast.error('Failed to process image file.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  const setCoverPhoto = (index) => {
    if (index === 0) return;
    setForm((prev) => {
      const copy = [...prev.images];
      const [selected] = copy.splice(index, 1);
      return { ...prev, images: [selected, ...copy] };
    });
  };
  const removePhoto = (index) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== index),
    }));
  };
  const saveMutation = useMutation({
    mutationFn: () => {
      const cover = form.images[0] || '/images/hunter.jpg';
      const payload = {
        brand: form.brand.trim(),
        model: form.model.trim(),
        variant: form.variant.trim(),
        year: Number(form.year) || new Date().getFullYear(),
        kilometers: Number(form.kilometers) || 0,
        fuel: form.fuel || 'Petrol',
        engineCc: Number(form.engineCc) || 0,
        city: form.city.trim(),
        image: cover,
        certified: Boolean(form.certified),
        owner: form.owner || '1st owner',
        inspectionScore: Number(form.inspectionScore) || 9.0,
        checkpointsPassed: Number(form.checkpointsPassed) || 200,
        specs: {
          Power: form.power ? `${form.power} bhp` : '',
          Mileage: form.mileage ? `${form.mileage} kmpl` : '',
          Insurance: form.insuranceValidTill || '',
          ...(form.fuel === 'Electric' && form.batteryHealth
            ? { 'Battery health': `${form.batteryHealth}%` }
            : {}),
          images: form.images,
        },
      };
      return saveBike(payload, editingBikeId);
    },
    onSuccess: () => {
      toast.success(editingBikeId ? 'Bike updated' : 'Bike added to inventory');
      setFormOpen(false);
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteBike(id),
    onSuccess: () => {
      toast.success('Bike deleted');
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });
  const handleDeleteBike = (bike) => {
    const linkedAuctions = allAuctionsByBikeId.get(bike.id) || [];
    if (linkedAuctions.length > 0) {
      toast.error(
        `Cannot delete ${bike.brand} ${bike.model}: this bike is linked to ${linkedAuctions.length} ${linkedAuctions.length === 1 ? 'auction' : 'auctions'}.`
      );
      return;
    }
    if (
      window.confirm(
        `Are you sure you want to delete ${bike.brand} ${bike.model} from inventory?`
      )
    ) {
      deleteMutation.mutate(bike.id);
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.brand || !form.model || !form.year) {
      toast.error('Please fill in required fields.');
      return;
    }
    saveMutation.mutate();
  };
  return (
    <div data-testid="admin-bikes-content">
      {/* Page Header: only an H1 */}
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Bikes
          </h1>
          <p className="mt-1 text-[13px] text-gray-500">
            {bikes.length} bikes · {bikesInAuction} in auction · {bikesReady}{' '}
            ready to list
          </p>
        </div>
        <button
          type="button"
          data-testid="admin-add-bike-button"
          onClick={openAddForm}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#d23657] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#b02644] sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>Add bike</span>
        </button>
      </div>

      {/* Add / Edit Form Modal */}
      {formOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="bike-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <div
            ref={formDialogRef}
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2
                id="bike-modal-title"
                className="text-base font-semibold text-gray-900"
              >
                {editingBikeId ? 'Edit bike' : 'Add bike'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Close form"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-6">
              {/* Group 1: Basics */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2.5">
                  Basics
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Brand *
                    </label>
                    <input
                      required
                      value={form.brand}
                      onChange={(e) =>
                        setForm({ ...form, brand: e.target.value })
                      }
                      placeholder="e.g. Royal Enfield"
                      className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#d23657]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Model *
                    </label>
                    <input
                      required
                      value={form.model}
                      onChange={(e) =>
                        setForm({ ...form, model: e.target.value })
                      }
                      placeholder="e.g. Hunter 350"
                      className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#d23657]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Variant
                    </label>
                    <input
                      value={form.variant}
                      onChange={(e) =>
                        setForm({ ...form, variant: e.target.value })
                      }
                      placeholder="e.g. Dapper Ash"
                      className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#d23657]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Year *
                    </label>
                    <input
                      required
                      type="number"
                      min={1990}
                      max={2030}
                      value={form.year}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          year: e.target.value ? Number(e.target.value) : '',
                        })
                      }
                      placeholder="e.g. 2023"
                      className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#d23657]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Hub / City *
                    </label>
                    <input
                      required
                      value={form.city}
                      onChange={(e) =>
                        setForm({ ...form, city: e.target.value })
                      }
                      placeholder="e.g. Delhi NCR or Jaipur"
                      className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#d23657]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Fuel type
                    </label>
                    <select
                      value={form.fuel}
                      onChange={(e) =>
                        setForm({ ...form, fuel: e.target.value })
                      }
                      className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-[#d23657]"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Group 2: Specs */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2.5">
                  Specs
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Kilometres
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.kilometers}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          kilometers: e.target.value
                            ? Number(e.target.value)
                            : '',
                        })
                      }
                      placeholder="e.g. 8500"
                      className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#d23657]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Engine cc
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.engineCc}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          engineCc: e.target.value
                            ? Number(e.target.value)
                            : '',
                        })
                      }
                      placeholder="e.g. 349"
                      className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#d23657]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Power (bhp)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={form.power}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            power: e.target.value ? Number(e.target.value) : '',
                          })
                        }
                        placeholder="e.g. 20.2"
                        className="h-8.5 w-full rounded-lg border border-gray-200 bg-white pl-2.5 pr-10 text-xs outline-none focus:border-[#d23657]"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-2 text-[11px] text-gray-400">
                        bhp
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Mileage (kmpl)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min={0}
                        value={form.mileage}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            mileage: e.target.value
                              ? Number(e.target.value)
                              : '',
                          })
                        }
                        placeholder="e.g. 36"
                        className="h-8.5 w-full rounded-lg border border-gray-200 bg-white pl-2.5 pr-12 text-xs outline-none focus:border-[#d23657]"
                      />
                      <span className="pointer-events-none absolute right-2.5 top-2 text-[11px] text-gray-400">
                        kmpl
                      </span>
                    </div>
                  </div>
                  {form.fuel === 'Electric' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Battery health (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={form.batteryHealth ?? ''}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              batteryHealth: e.target.value
                                ? Number(e.target.value)
                                : '',
                            })
                          }
                          placeholder="e.g. 95"
                          className="h-8.5 w-full rounded-lg border border-gray-200 bg-white pl-2.5 pr-8 text-xs outline-none focus:border-[#d23657]"
                        />
                        <span className="pointer-events-none absolute right-2.5 top-2 text-[11px] text-gray-400">
                          %
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Group 3: Ownership and inspection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2.5">
                  Ownership and inspection
                </h3>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Owner
                    </label>
                    <select
                      value={form.owner}
                      onChange={(e) =>
                        setForm({ ...form, owner: e.target.value })
                      }
                      className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-[#d23657]"
                    >
                      <option value="1st owner">1st owner</option>
                      <option value="2nd owner">2nd owner</option>
                      <option value="3rd owner">3rd owner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Insurance valid till
                    </label>
                    <input
                      type="month"
                      value={form.insuranceValidTill}
                      onChange={(e) =>
                        setForm({ ...form, insuranceValidTill: e.target.value })
                      }
                      className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-[#d23657]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Inspection score (0 to 10)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={10}
                      value={form.inspectionScore}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          inspectionScore: e.target.value
                            ? Number(e.target.value)
                            : '',
                        })
                      }
                      placeholder="e.g. 9.4"
                      className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#d23657]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Checkpoints passed
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={210}
                      value={form.checkpointsPassed}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          checkpointsPassed: e.target.value
                            ? Number(e.target.value)
                            : '',
                        })
                      }
                      placeholder="e.g. 204"
                      className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#d23657]"
                    />
                  </div>
                </div>

                {/* Neutral Certification Checkbox */}
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="certified-checkbox"
                    checked={form.certified}
                    onChange={(e) =>
                      setForm({ ...form, certified: e.target.checked })
                    }
                    className="size-4 rounded border-gray-300 accent-[#d23657]"
                  />
                  <label
                    htmlFor="certified-checkbox"
                    className="text-xs font-medium text-gray-800 cursor-pointer"
                  >
                    Certified (inspection and RTO title verified)
                  </label>
                </div>
              </div>

              {/* Photos upload section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Photos
                  </h3>
                  <span className="text-xs text-gray-500">
                    {form.images.length}/5 uploaded
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  {form.images.length < 5 && (
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-20 w-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#d23657] hover:text-[#d23657] transition disabled:opacity-50"
                    >
                      <UploadCloud className="size-5" />
                      <span className="mt-1 text-[11px] font-medium">
                        {isUploading ? 'Uploading...' : 'Upload photo'}
                      </span>
                    </button>
                  )}

                  {form.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative h-20 w-24 overflow-hidden rounded-lg border border-gray-200 group bg-gray-50"
                    >
                      <img
                        src={img}
                        alt=""
                        className="size-full object-cover"
                      />
                      {idx === 0 ? (
                        <span className="absolute bottom-1 left-1 rounded bg-[#d23657] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-xs">
                          Cover
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setCoverPhoto(idx)}
                          className="absolute bottom-1 left-1 hidden rounded bg-black/70 px-1 py-0.5 text-[9px] font-semibold text-white group-hover:block"
                        >
                          Make cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removePhoto(idx)}
                        aria-label="Remove photo"
                        className="absolute top-1 right-1 hidden size-5 items-center justify-center rounded-full bg-red-600 text-white group-hover:flex"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded-lg bg-[#d23657] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#b02644] disabled:opacity-50"
                >
                  {saveMutation.isPending
                    ? 'Saving...'
                    : editingBikeId
                      ? 'Save changes'
                      : 'Add bike'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bikes Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="border-b border-gray-100 bg-gray-50/70 text-[13px] font-medium text-gray-500 tracking-normal">
              <tr>
                <th scope="col" className="px-3.5 py-2.5 font-medium">
                  Bike
                </th>
                <th scope="col" className="px-3.5 py-2.5 font-medium">
                  Specs and km
                </th>
                <th scope="col" className="px-3.5 py-2.5 font-medium">
                  Hub and owner
                </th>
                <th scope="col" className="px-3.5 py-2.5 font-medium">
                  Score
                </th>
                <th scope="col" className="px-3.5 py-2.5 font-medium">
                  Status
                </th>
                <th
                  scope="col"
                  className="px-3.5 py-2.5 font-medium text-right"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bikes.map((bike) => {
                const activeAuction = activeAuctionByBikeId.get(bike.id);
                const hasAnyAuction =
                  (allAuctionsByBikeId.get(bike.id) || []).length > 0;
                return (
                  <tr key={bike.id} className="hover:bg-gray-50/50">
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-10 shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-100">
                          {bike.image ? (
                            <img
                              src={bike.image}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-gray-400">
                              <BikeIcon className="size-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 leading-tight">
                            {bike.year} {bike.brand} {bike.model}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {bike.variant}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-3.5 py-2.5 text-[11px]">
                      <span className="font-medium text-gray-800">
                        {bike.engineCc ? `${bike.engineCc} cc · ` : ''}
                        {bike.fuel}
                      </span>
                      <p className="text-gray-500">
                        {formatKm(bike.kilometers)}
                      </p>
                    </td>

                    <td className="px-3.5 py-2.5 text-[11px]">
                      <span className="font-medium text-gray-800">
                        {bike.city}
                      </span>
                      <p className="text-gray-500">
                        {bike.owner || '1st owner'}
                      </p>
                    </td>

                    <td className="px-3.5 py-2.5 text-[11px]">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">
                        <Star className="size-3 fill-emerald-600 text-emerald-600" />
                        {formatScore(bike.inspectionScore)}
                      </span>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {bike.checkpointsPassed ?? 200}/205
                      </p>
                    </td>

                    <td className="px-3.5 py-2.5 text-[11px]">
                      {activeAuction ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            activeAuction.status === 'LIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          <span className="size-1 rounded-full bg-current" />
                          {activeAuction.status === 'LIVE'
                            ? 'Live'
                            : 'Upcoming'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                          Ready
                        </span>
                      )}
                    </td>

                    <td className="px-3.5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditForm(bike)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 px-2 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="size-2.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          disabled={hasAnyAuction}
                          onClick={() => handleDeleteBike(bike)}
                          aria-label={`Delete ${bike.brand} ${bike.model}`}
                          title={
                            hasAnyAuction
                              ? 'Cannot delete bike: bike has an existing auction'
                              : 'Delete bike'
                          }
                          className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {bikes.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">
            No bikes found in inventory.
          </div>
        )}
      </div>
    </div>
  );
}
const emptyAuctionFormState = {
  bikeId: '',
  startingPrice: '',
  minIncrement: 500,
  startsAt: '',
  endsAt: '',
};
function AuctionManager({ auctions, bikes, onRefresh }) {
  const [tab, setTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingAuctionId, setEditingAuctionId] = useState();
  const [form, setForm] = useState(emptyAuctionFormState);
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });
  const confirmDialogRef = useFocusTrap(confirmDialog.open, () =>
    setConfirmDialog((prev) => ({ ...prev, open: false }))
  );
  const formDialogRef = useFocusTrap(formOpen, () => setFormOpen(false));
  const bikesMap = useMemo(() => {
    const map = new Map();
    bikes.forEach((b) => map.set(b.id, b));
    return map;
  }, [bikes]);
  // Tab counts
  const liveCount = auctions.filter((a) => a.status === 'LIVE').length;
  const upcomingCount = auctions.filter((a) => a.status === 'UPCOMING').length;
  const endedCount = auctions.filter((a) => a.status === 'ENDED').length;
  const cancelledCount = auctions.filter(
    (a) => a.status === 'CANCELLED'
  ).length;
  const tabs = [
    { id: 'ALL', label: 'All', count: auctions.length },
    { id: 'LIVE', label: 'Live', count: liveCount },
    { id: 'UPCOMING', label: 'Upcoming', count: upcomingCount },
    { id: 'ENDED', label: 'Ended', count: endedCount },
    { id: 'CANCELLED', label: 'Cancelled', count: cancelledCount },
  ];
  const filteredAuctions = useMemo(() => {
    return auctions.filter((auc) => {
      if (tab !== 'ALL' && auc.status !== tab) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          auc.title.toLowerCase().includes(q) ||
          auc.brand.toLowerCase().includes(q) ||
          auc.model.toLowerCase().includes(q) ||
          auc.city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [auctions, tab, search]);
  const openCreateForm = (preselectBikeId) => {
    setEditingAuctionId(undefined);
    const bike = preselectBikeId ? bikesMap.get(preselectBikeId) : bikes[0];
    const now = new Date();
    const end = new Date(now.getTime() + 48 * 3600 * 1000);
    setForm({
      bikeId: bike?.id || '',
      startingPrice: bike
        ? Math.max(30000, Math.round((bike.engineCc * 250) / 1000) * 1000)
        : 50000,
      minIncrement: 500,
      startsAt: now.toISOString().slice(0, 16),
      endsAt: end.toISOString().slice(0, 16),
    });
    setFormOpen(true);
  };
  const openEditForm = (auc) => {
    setEditingAuctionId(auc.id);
    setForm({
      bikeId: auc.bikeId,
      startingPrice: auc.startingPrice,
      minIncrement: auc.minIncrement,
      startsAt: auc.startAt
        ? new Date(auc.startAt).toISOString().slice(0, 16)
        : '',
      endsAt: auc.endsAt ? new Date(auc.endsAt).toISOString().slice(0, 16) : '',
    });
    setFormOpen(true);
  };
  const handleBikeChange = (bikeId) => {
    const bike = bikesMap.get(bikeId);
    setForm((prev) => ({
      ...prev,
      bikeId,
      startingPrice: bike
        ? Math.max(30000, Math.round((bike.engineCc * 250) / 1000) * 1000)
        : prev.startingPrice,
    }));
  };
  const saveMutation = useMutation({
    mutationFn: () => {
      const bike = bikesMap.get(form.bikeId);
      const title = bike
        ? `${bike.year} ${bike.brand} ${bike.model}`
        : 'Auction';
      const startsAtIso = form.startsAt
        ? new Date(form.startsAt).toISOString()
        : new Date().toISOString();
      const endsAtIso = new Date(form.endsAt).toISOString();
      return saveAuction(
        {
          bikeId: form.bikeId,
          title,
          startingPrice: Number(form.startingPrice),
          minIncrement: Number(form.minIncrement),
          endsAt: endsAtIso,
          status:
            new Date(startsAtIso).getTime() <= Date.now() ? 'LIVE' : 'UPCOMING',
          currentBid: Number(form.startingPrice),
          totalBids: 0,
        },
        editingAuctionId
      );
    },
    onSuccess: () => {
      toast.success(editingAuctionId ? 'Auction updated' : 'Auction created');
      setFormOpen(false);
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!form.bikeId) {
      toast.error('Please select a bike.');
      return;
    }
    if (!form.startingPrice || Number(form.startingPrice) <= 0) {
      toast.error('Starting price must be a positive number.');
      return;
    }
    if (!form.minIncrement || Number(form.minIncrement) <= 0) {
      toast.error('Minimum increment must be a positive number.');
      return;
    }
    if (!form.startsAt || !form.endsAt) {
      toast.error('Please enter both start time and end time.');
      return;
    }
    if (new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()) {
      toast.error('End time must be after start time.');
      return;
    }
    saveMutation.mutate();
  };
  // Actions
  const extendMutation = useMutation({
    mutationFn: (auc) => {
      const currentEnd = new Date(auc.endsAt).getTime();
      const base = Math.max(Date.now(), currentEnd);
      const newEnd = new Date(base + 15 * 60 * 1000).toISOString();
      return saveAuction({ ...auc, endsAt: newEnd }, auc.id);
    },
    onSuccess: () => {
      toast.success('Auction extended by 15 minutes');
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });
  const closeMutation = useMutation({
    mutationFn: (aucId) => closeAuction(aucId),
    onSuccess: () => {
      toast.success('Auction closed');
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });
  const startNowMutation = useMutation({
    mutationFn: (auc) => {
      return saveAuction(
        {
          ...auc,
          status: 'LIVE',
          endsAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        },
        auc.id
      );
    },
    onSuccess: () => {
      toast.success('Auction started and is now Live');
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });
  const cancelMutation = useMutation({
    mutationFn: (aucId) => cancelAuction(aucId),
    onSuccess: () => {
      toast.success('Auction cancelled');
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });
  return (
    <div data-testid="admin-auctions-content">
      {/* Page Header: only an H1 */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Auctions
        </h1>
        <button
          type="button"
          data-testid="admin-create-auction-button"
          onClick={() => openCreateForm()}
          className="inline-flex items-center gap-1.5 self-start rounded-lg bg-[#d23657] px-3.5 py-2 text-xs font-semibold text-white shadow-2xs transition hover:bg-[#b02644] sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>Create auction</span>
        </button>
      </div>

      {/* Tabs and Search Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Sentence Case Status Tabs */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                tab === t.id
                  ? 'bg-gray-900 text-white font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search auctions..."
            className="h-8.5 w-48 rounded-lg border border-gray-200 bg-white pl-8 pr-2.5 text-xs outline-none focus:border-[#d23657]"
          />
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <div
            ref={confirmDialogRef}
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl"
          >
            <h3
              id="confirm-dialog-title"
              className="text-base font-semibold text-gray-900"
            >
              {confirmDialog.title}
            </h3>
            <p className="mt-2 text-xs text-gray-600 leading-relaxed">
              {confirmDialog.description}
            </p>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setConfirmDialog((prev) => ({ ...prev, open: false }))
                }
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog((prev) => ({ ...prev, open: false }));
                }}
                className="rounded-lg bg-[#d23657] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#b02644]"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Auction Modal */}
      {formOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auction-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
        >
          <div
            ref={formDialogRef}
            className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h2
                id="auction-modal-title"
                className="text-base font-semibold text-gray-900"
              >
                {editingAuctionId ? 'Edit auction' : 'Create auction'}
              </h2>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                aria-label="Close form"
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select bike from inventory *
                </label>
                <select
                  required
                  value={form.bikeId}
                  onChange={(e) => handleBikeChange(e.target.value)}
                  className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#d23657]"
                >
                  <option value="">Choose a bike...</option>
                  {bikes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.year} {b.brand} {b.model} {b.variant} ({b.city})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start price (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={form.startingPrice}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        startingPrice: e.target.value
                          ? Number(e.target.value)
                          : '',
                      })
                    }
                    placeholder="e.g. 50000"
                    className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#d23657]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Min increment (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    min={1}
                    value={form.minIncrement}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        minIncrement: e.target.value
                          ? Number(e.target.value)
                          : '',
                      })
                    }
                    placeholder="e.g. 500"
                    className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#d23657]"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start time *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) =>
                      setForm({ ...form, startsAt: e.target.value })
                    }
                    className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-[#d23657]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End time *
                  </label>
                  <input
                    required
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) =>
                      setForm({ ...form, endsAt: e.target.value })
                    }
                    className="h-8.5 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-[#d23657]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded-lg bg-[#d23657] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#b02644] disabled:opacity-50"
                >
                  {saveMutation.isPending
                    ? 'Saving...'
                    : editingAuctionId
                      ? 'Save changes'
                      : 'Create auction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auctions Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[760px]">
            <thead className="border-b border-gray-100 bg-gray-50/70 text-[13px] font-medium text-gray-500 tracking-normal">
              <tr>
                <th scope="col" className="px-3.5 py-2.5 font-medium">
                  Auction and vehicle
                </th>
                <th scope="col" className="px-3.5 py-2.5 font-medium">
                  Pricing
                </th>
                <th scope="col" className="px-3.5 py-2.5 font-medium">
                  Activity
                </th>
                <th scope="col" className="px-3.5 py-2.5 font-medium">
                  Timing and status
                </th>
                <th
                  scope="col"
                  className="px-3.5 py-2.5 font-medium text-right"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAuctions.map((auc) => {
                const bike = bikesMap.get(auc.bikeId);
                const img = auc.images?.[0] || bike?.image || '';
                // Vocabulary status display
                const statusLabel =
                  auc.status === 'LIVE'
                    ? 'Live'
                    : auc.status === 'UPCOMING'
                      ? 'Upcoming'
                      : auc.status === 'ENDED'
                        ? 'Ended'
                        : 'Cancelled';
                return (
                  <tr key={auc.id} className="hover:bg-gray-50/50">
                    {/* Auction and vehicle: 2 lines without truncation */}
                    <td className="px-3.5 py-2.5 max-w-[280px]">
                      <div className="flex items-start gap-2.5">
                        <div className="size-10 shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-100 mt-0.5">
                          {img ? (
                            <img
                              src={img}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-gray-400">
                              <BikeIcon className="size-4" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-gray-900 break-words">
                              {auc.year} {auc.brand} {auc.model}
                            </span>
                            <Link
                              to={`/auction/${auc.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-[#d23657]"
                              title="View auction page"
                            >
                              <ExternalLink className="size-3" />
                            </Link>
                          </div>
                          <p className="text-[11px] text-gray-500 break-words mt-0.5">
                            {auc.variant} · {auc.engineCc} cc · {auc.city}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Pricing column: 2 lines */}
                    <td className="px-3.5 py-2.5 text-[11px]">
                      <div className="font-semibold text-gray-900">
                        Current bid {formatPrice(auc.currentBid)}
                      </div>
                      <div className="text-gray-500 text-[10px] mt-0.5">
                        Start price {formatPrice(auc.startingPrice)} · min
                        increment +₹{auc.minIncrement.toLocaleString('en-IN')}
                      </div>
                    </td>

                    {/* Activity */}
                    <td className="px-3.5 py-2.5 text-[11px]">
                      <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 font-medium text-gray-700">
                        {auc.totalBids} {auc.totalBids === 1 ? 'bid' : 'bids'}
                      </span>
                    </td>

                    {/* Timing & Status */}
                    <td className="px-3.5 py-2.5 text-[11px]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            auc.status === 'LIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : auc.status === 'UPCOMING'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : auc.status === 'ENDED'
                                  ? 'bg-gray-100 text-gray-700 border border-gray-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                          }`}
                        >
                          <span className="size-1 rounded-full bg-current" />
                          {statusLabel}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {auc.status === 'UPCOMING'
                          ? `Starts ${formatTime(auc.startAt || auc.endsAt)}`
                          : `Ends ${formatTime(auc.endsAt)}`}
                      </div>
                    </td>

                    {/* Controls */}
                    <td className="px-3.5 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Live actions: Extend 15 min, Close */}
                        {auc.status === 'LIVE' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDialog({
                                  open: true,
                                  title: 'Extend auction countdown',
                                  description: `Are you sure you want to add 15 minutes to the timer for ${auc.year} ${auc.brand} ${auc.model}? This will give active bidders extra time on the floor.`,
                                  onConfirm: () => extendMutation.mutate(auc),
                                })
                              }
                              className="inline-flex h-7 items-center rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Extend 15 min
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDialog({
                                  open: true,
                                  title: 'Close auction early',
                                  description: `Are you sure you want to close ${auc.year} ${auc.brand} ${auc.model} now? Bidding will end immediately and the highest bidder will win.`,
                                  onConfirm: () => closeMutation.mutate(auc.id),
                                })
                              }
                              className="inline-flex h-7 items-center rounded-md bg-red-50 px-2 text-[11px] font-medium text-red-600 hover:bg-red-100"
                            >
                              Close
                            </button>
                          </>
                        )}

                        {/* Upcoming actions: Start now, icon-only Cancel */}
                        {auc.status === 'UPCOMING' && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDialog({
                                  open: true,
                                  title: 'Start auction now',
                                  description: `Are you sure you want to start ${auc.year} ${auc.brand} ${auc.model} now? This will immediately make it Live on the bidding floor.`,
                                  onConfirm: () => startNowMutation.mutate(auc),
                                })
                              }
                              className="inline-flex h-7 items-center gap-1 rounded-md bg-emerald-50 px-2 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100"
                            >
                              <Play className="size-2.5 fill-current" />
                              <span>Start now</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDialog({
                                  open: true,
                                  title: 'Cancel scheduled auction',
                                  description: `Are you sure you want to cancel the upcoming auction for ${auc.year} ${auc.brand} ${auc.model}?`,
                                  onConfirm: () =>
                                    cancelMutation.mutate(auc.id),
                                })
                              }
                              aria-label="Cancel auction"
                              title="Cancel auction"
                              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Ban className="size-3.5" />
                            </button>
                          </>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => openEditForm(auc)}
                          className="inline-flex h-7 items-center gap-1 rounded-md border border-gray-200 px-2 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil className="size-2.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredAuctions.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">
            No auctions found.
          </div>
        )}
      </div>
    </div>
  );
}
/* =========================================================================
   6. BID LOGS
   ========================================================================= */
const LOGS_PAGE_SIZE = 20;
function BidLogs({ bids, auctions }) {
  const [selectedAuctionId, setSelectedAuctionId] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const auctionsMap = useMemo(() => {
    const map = new Map();
    auctions.forEach((a) => map.set(a.id, a));
    return map;
  }, [auctions]);
  // Highest bid on each auction for Status resolution (Leading / Won / Outbid)
  const highestBidByAuction = useMemo(() => {
    const map = new Map(); // auctionId -> bidId
    const highestAmounts = new Map();
    bids.forEach((b) => {
      const currentHighest = highestAmounts.get(b.auctionId) ?? -1;
      if (b.amount > currentHighest) {
        highestAmounts.set(b.auctionId, b.amount);
        map.set(b.auctionId, b.id);
      }
    });
    return map;
  }, [bids]);
  // Filtering
  const filteredBids = useMemo(() => {
    return bids
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .filter((bid) => {
        if (
          selectedAuctionId !== 'all' &&
          bid.auctionId !== selectedAuctionId
        ) {
          return false;
        }
        if (startDate) {
          const startMs = new Date(startDate).getTime();
          if (new Date(bid.createdAt).getTime() < startMs) return false;
        }
        if (endDate) {
          // Include full end date day
          const endMs = new Date(endDate).getTime() + 24 * 3600 * 1000;
          if (new Date(bid.createdAt).getTime() > endMs) return false;
        }
        return true;
      });
  }, [bids, selectedAuctionId, startDate, endDate]);
  const totalPages = Math.max(
    1,
    Math.ceil(filteredBids.length / LOGS_PAGE_SIZE)
  );
  const pageBids = filteredBids.slice(
    (currentPage - 1) * LOGS_PAGE_SIZE,
    currentPage * LOGS_PAGE_SIZE
  );
  return (
    <div data-testid="admin-logs-content">
      {/* Page Header: only an H1 */}
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Bid logs
        </h1>
      </div>

      {/* Filters: Auction select & Date range */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <select
            value={selectedAuctionId}
            onChange={(e) => {
              setSelectedAuctionId(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8.5 rounded-lg border border-gray-200 bg-white px-2.5 text-xs outline-none focus:border-[#d23657]"
          >
            <option value="all">All auctions ({auctions.length})</option>
            {auctions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8.5 rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-[#d23657]"
            title="From date"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8.5 rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none focus:border-[#d23657]"
            title="To date"
          />
          {(selectedAuctionId !== 'all' || startDate || endDate) && (
            <button
              type="button"
              onClick={() => {
                setSelectedAuctionId('all');
                setStartDate('');
                setEndDate('');
                setCurrentPage(1);
              }}
              className="text-xs text-[#d23657] hover:underline ml-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="border-b border-gray-100 bg-gray-50/70 text-[13px] font-medium text-gray-500 tracking-normal">
              <tr>
                <th scope="col" className="px-3.5 py-2.5 font-medium">
                  Bidder
                </th>
                <th scope="col" className="px-3.5 py-2.5 font-medium">
                  Auction
                </th>
                <th scope="col" className="px-3.5 py-2.5 font-medium">
                  Amount
                </th>
                <th scope="col" className="px-3.5 py-2.5 font-medium">
                  Status
                </th>
                <th scope="col" className="px-3.5 py-2.5 font-medium">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageBids.map((bid) => {
                const auc = auctionsMap.get(bid.auctionId);
                const isHighest =
                  highestBidByAuction.get(bid.auctionId) === bid.id;
                let statusText = 'Outbid';
                let statusClass = 'bg-gray-100 text-gray-600';
                if (auc?.status === 'ENDED') {
                  if (isHighest) {
                    statusText = 'Won';
                    statusClass =
                      'bg-emerald-50 text-emerald-700 border border-emerald-200';
                  }
                } else {
                  if (isHighest) {
                    statusText = 'Leading';
                    statusClass =
                      'bg-[#fdf0f3] text-[#b02644] border border-[#f3d7de]';
                  }
                }
                return (
                  <tr key={bid.id} className="hover:bg-gray-50/50">
                    <td className="px-3.5 py-2.5">
                      <div className="font-semibold text-gray-900">
                        {bid.bidderName}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        {bid.bidderEmail}
                      </div>
                    </td>

                    <td className="px-3.5 py-2.5 text-gray-700 max-w-[260px]">
                      {auc ? (
                        <Link
                          to={`/auction/${auc.id}`}
                          className="hover:text-[#d23657] font-medium"
                        >
                          {auc.title}
                        </Link>
                      ) : (
                        'Auction'
                      )}
                    </td>

                    <td className="px-3.5 py-2.5 font-bold text-gray-900">
                      {formatPrice(bid.amount)}
                    </td>

                    <td className="px-3.5 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass}`}
                      >
                        {statusText}
                      </span>
                    </td>

                    <td className="px-3.5 py-2.5 text-gray-500 text-[11px]">
                      {formatTimeWithSeconds(bid.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredBids.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">
            No bid logs found matching your filters.
          </div>
        ) : (
          /* Pagination */
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-600">
            <div>
              Showing {(currentPage - 1) * LOGS_PAGE_SIZE + 1} to{' '}
              {Math.min(currentPage * LOGS_PAGE_SIZE, filteredBids.length)} of{' '}
              {filteredBids.length} bids
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="size-3.5" />
                <span>Previous</span>
              </button>
              <span className="px-2 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                <span>Next</span>
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
