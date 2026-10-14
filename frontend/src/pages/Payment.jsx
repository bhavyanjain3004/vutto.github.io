import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CreditCard,
  QrCode,
  Building2,
  ShieldCheck,
  Truck,
  MapPin,
  Lock,
  Sparkles,
  Download,
  Copy,
  Calendar,
} from 'lucide-react';
import { getAuctions } from '@/lib/api';
import { formatPrice } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { CONTACT_DETAILS } from '@/data/contact';

export default function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Payment Options State
  const [paymentType, setPaymentType] = useState('token'); // 'token' (10%) or 'full'
  const [deliveryMethod, setDeliveryMethod] = useState('hub'); // 'hub' or 'doorstep'
  const [selectedHub, setSelectedHub] = useState('Gurugram Hub');
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi', 'card', 'netbanking', 'emi'

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState(user?.name || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UPI State
  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Netbanking State
  const [selectedBank, setSelectedBank] = useState('hdfc');

  // Checkout Simulation State
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');

  // Fetch auction details
  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['auctions'],
    queryFn: getAuctions,
  });

  const auction = auctions.find((a) => a.id === id) || auctions[0];

  if (isLoading || !auction) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-spin rounded-full border-4 border-[#d23657] border-t-transparent" />
          <p className="text-sm font-semibold text-gray-600">Loading checkout details...</p>
        </div>
      </div>
    );
  }

  // Cost calculations
  const winningBid = auction.currentBid || auction.startingPrice;
  const tokenAmount = Math.round(winningBid * 0.1); // 10% refundable deposit
  const inspectionFee = 1499; // 200-point physical certification
  const rtoTransferFee = 2500; // RC title transfer fee
  const deliveryFee = deliveryMethod === 'doorstep' ? 1500 : 0;

  const fullTotal = winningBid + inspectionFee + rtoTransferFee + deliveryFee;
  const payableAmount = paymentType === 'token' ? tokenAmount : fullTotal;

  const handlePay = (e) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setTransactionId(`VUTTO-TXN-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsSuccess(true);
    }, 1800);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('vutto.auctions@icici');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24 pt-6">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="size-3.5" /> Back to Auction
          </button>
          <span className="text-gray-300">/</span>
          <span className="text-xs font-semibold text-gray-500">Checkout & Payment</span>
        </div>

        {/* If Payment Successful */}
        {isSuccess ? (
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 sm:p-12 shadow-sm text-center max-w-2xl mx-auto">
            <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="size-10" />
            </div>

            <span className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              <Sparkles className="size-3.5" /> Payment Successful
            </span>

            <h1 className="mt-3 text-2xl font-extrabold text-gray-900 sm:text-3xl">
              Machine Secured in Your Garage!
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Your transaction has been securely confirmed. A token receipt and vehicle reservation confirmation have been issued.
            </p>

            {/* Receipt Summary Card */}
            <div className="mt-8 rounded-2xl border border-gray-100 bg-[#fbfbfb] p-6 text-left">
              <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Transaction Reference</p>
                  <p className="text-base font-extrabold text-gray-900 font-mono mt-0.5">{transactionId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Amount Paid</p>
                  <p className="text-lg font-extrabold text-[#d23657] mt-0.5">{formatPrice(payableAmount)}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-500">Vehicle</p>
                  <p className="font-bold text-gray-800">{auction.title}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pickup / Delivery</p>
                  <p className="font-bold text-gray-800">
                    {deliveryMethod === 'doorstep' ? 'Doorstep Flatbed Delivery' : selectedHub}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Date & Time</p>
                  <p className="font-bold text-gray-800">{new Date().toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Buyer Name</p>
                  <p className="font-bold text-gray-800">{user?.name || 'Valued Buyer'}</p>
                </div>
              </div>
            </div>

            {/* Next Steps Timeline */}
            <div className="mt-8 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">What Happens Next</h3>
              <div className="mt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">1</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Vehicle Hold for 48 Hours</p>
                    <p className="text-xs text-gray-600">The machine is reserved exclusively for you at the inspection hub.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold">2</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Physical Inspection & Test Ride</p>
                    <p className="text-xs text-gray-600">Visit our hub technician to review the 200-point inspection in person.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">3</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Hassle-Free RTO Title Transfer</p>
                    <p className="text-xs text-gray-600">Our RTO desk handles your registration papers and title smart card directly to your name.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/my-bids"
                className="inline-flex items-center justify-center rounded-xl bg-[#d23657] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#b02644]"
              >
                Go to My Garage (My Bids)
              </Link>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                <Download className="size-4" /> Download Receipt
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form View */
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left 7 Columns: Checkout Steps */}
            <div className="space-y-6 lg:col-span-7">
              {/* Step 1: Payment Type Option */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-gray-900">1. Payment Option</h2>
                  <span className="text-xs text-gray-500">100% Refundable Token Policy</span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {/* Token Booking (Recommended) */}
                  <label
                    className={`relative flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                      paymentType === 'token'
                        ? 'border-[#d23657] bg-[#fdf0f3]/40 ring-1 ring-[#d23657]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentType"
                          value="token"
                          checked={paymentType === 'token'}
                          onChange={() => setPaymentType('token')}
                          className="accent-[#d23657]"
                        />
                        <span className="text-sm font-extrabold text-gray-900">Token Deposit (10%)</span>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                        Recommended
                      </span>
                    </div>
                    <p className="mt-2 text-lg font-extrabold text-[#d23657]">{formatPrice(tokenAmount)}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Reserve this machine for 48 hours. Pay the balance after physical inspection.
                    </p>
                  </label>

                  {/* Full Payment */}
                  <label
                    className={`relative flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                      paymentType === 'full'
                        ? 'border-[#d23657] bg-[#fdf0f3]/40 ring-1 ring-[#d23657]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentType"
                        value="full"
                        checked={paymentType === 'full'}
                        onChange={() => setPaymentType('full')}
                        className="accent-[#d23657]"
                      />
                      <span className="text-sm font-extrabold text-gray-900">Full Purchase</span>
                    </div>
                    <p className="mt-2 text-lg font-extrabold text-gray-900">{formatPrice(fullTotal)}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Includes winning bid, RTO transfer, and 200-point certification fees.
                    </p>
                  </label>
                </div>
              </div>

              {/* Step 2: Hub Pickup & Delivery */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-base font-extrabold text-gray-900">2. Delivery or Hub Pickup</h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('hub')}
                    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                      deliveryMethod === 'hub'
                        ? 'border-[#d23657] bg-[#fdf0f3]/40 ring-1 ring-[#d23657]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <MapPin className={`size-5 shrink-0 mt-0.5 ${deliveryMethod === 'hub' ? 'text-[#d23657]' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-bold text-gray-900">Physical Hub Pickup</p>
                      <p className="text-xs text-gray-500 mt-0.5">Free technician walkthrough</p>
                      <span className="mt-2 inline-block font-extrabold text-xs text-emerald-600">FREE</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('doorstep')}
                    className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                      deliveryMethod === 'doorstep'
                        ? 'border-[#d23657] bg-[#fdf0f3]/40 ring-1 ring-[#d23657]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Truck className={`size-5 shrink-0 mt-0.5 ${deliveryMethod === 'doorstep' ? 'text-[#d23657]' : 'text-gray-400'}`} />
                    <div>
                      <p className="text-sm font-bold text-gray-900">Doorstep Flatbed Delivery</p>
                      <p className="text-xs text-gray-500 mt-0.5">Safe enclosed vehicle dispatch</p>
                      <span className="mt-2 inline-block font-extrabold text-xs text-gray-700">+₹1,500</span>
                    </div>
                  </button>
                </div>

                {deliveryMethod === 'hub' && (
                  <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3.5">
                    <label className="block text-xs font-semibold text-gray-700">Select Inspection Hub</label>
                    <select
                      value={selectedHub}
                      onChange={(e) => setSelectedHub(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#d23657]"
                    >
                      <option value="Gurugram Hub">{CONTACT_DETAILS.hubs[0].name} Hub ({CONTACT_DETAILS.hubs[0].address})</option>
                      <option value="Jaipur Hub">{CONTACT_DETAILS.hubs[1].name} Hub ({CONTACT_DETAILS.hubs[1].address})</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Step 3: Payment Gateway Selector */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-extrabold text-gray-900">3. Select Payment Method</h2>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
                    <Lock className="size-3 text-emerald-600" /> 256-Bit Encrypted
                  </div>
                </div>

                {/* Tabs */}
                <div className="mt-4 grid grid-cols-4 gap-2 border-b border-gray-200 pb-3">
                  {[
                    { id: 'upi', label: 'UPI / QR', icon: QrCode },
                    { id: 'card', label: 'Cards', icon: CreditCard },
                    { id: 'netbanking', label: 'Net Banking', icon: Building2 },
                    { id: 'emi', label: 'EMI', icon: Calendar },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setPaymentMethod(tab.id)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition ${
                          paymentMethod === tab.id
                            ? 'bg-[#d23657] text-white shadow-sm'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="size-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tab Content: UPI */}
                {paymentMethod === 'upi' && (
                  <div className="mt-6 space-y-5">
                    <div className="flex flex-col sm:flex-row items-center gap-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-5">
                      {/* Simulated QR Code */}
                      <div className="flex flex-col items-center justify-center rounded-xl bg-white p-3 shadow-sm border border-gray-200">
                        <svg className="size-32 text-gray-900" viewBox="0 0 100 100" fill="currentColor">
                          <path d="M10 10h30v30H10zm5 5v20h20V15zm45-5h30v30H60zm5 5v20h20V15zM10 60h30v30H10zm5 5v20h20V65zm45 0h10v10H60zm15 0h15v15H75zm-15 15h15v15H60zm15 5h15v10H75zm-30-30h10v10H45zm5-15h10v10H50zm-5-15h10v10H45zm0 45h10v10H45z" />
                        </svg>
                        <span className="mt-2 text-[10px] font-bold text-gray-500 uppercase">Scan to Pay</span>
                      </div>

                      <div className="space-y-2 text-center sm:text-left flex-1">
                        <p className="text-sm font-extrabold text-gray-900">Scan with any UPI App</p>
                        <p className="text-xs text-gray-500">Google Pay, PhonePe, Paytm, or BHIM</p>
                        
                        <div className="mt-3 flex items-center gap-2 justify-center sm:justify-start">
                          <code className="rounded bg-gray-200/80 px-2.5 py-1 text-xs font-mono font-bold text-gray-800">
                            vutto.auctions@icici
                          </code>
                          <button
                            type="button"
                            onClick={handleCopyUpi}
                            className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs font-semibold text-gray-700 border border-gray-300 hover:bg-gray-50"
                          >
                            {copiedUpi ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
                            {copiedUpi ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700">Or Enter Your Virtual Payment Address (UPI ID)</label>
                      <div className="mt-1.5 flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. mobile@upi or name@okaxis"
                          value={upiId}
                          onChange={(e) => {
                            setUpiId(e.target.value);
                            setUpiVerified(false);
                          }}
                          className="flex-1 rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#d23657]"
                        />
                        <button
                          type="button"
                          onClick={() => setUpiVerified(Boolean(upiId.includes('@')))}
                          className={`rounded-xl px-4 text-xs font-bold transition ${
                            upiVerified
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                          }`}
                        >
                          {upiVerified ? 'Verified ✓' : 'Verify'}
                        </button>
                      </div>
                      {upiVerified && (
                        <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">UPI ID verified for {user?.name || 'Verified Account'}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab Content: Card */}
                {paymentMethod === 'card' && (
                  <form onSubmit={handlePay} className="mt-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700">Card Number</label>
                      <input
                        type="text"
                        maxLength="19"
                        placeholder="4532 •••• •••• 8910"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#d23657]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="Name on card"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#d23657]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-700">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          maxLength="5"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#d23657]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700">CVV</label>
                        <input
                          type="password"
                          maxLength="4"
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="mt-1 w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#d23657]"
                        />
                      </div>
                    </div>
                  </form>
                )}

                {/* Tab Content: Net Banking */}
                {paymentMethod === 'netbanking' && (
                  <div className="mt-6 space-y-4">
                    <p className="text-xs font-bold text-gray-700">Popular Banks</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { id: 'hdfc', name: 'HDFC Bank' },
                        { id: 'icici', name: 'ICICI Bank' },
                        { id: 'sbi', name: 'State Bank of India' },
                        { id: 'axis', name: 'Axis Bank' },
                        { id: 'kotak', name: 'Kotak Mahindra' },
                        { id: 'pnb', name: 'Punjab National Bank' },
                      ].map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedBank(bank.id)}
                          className={`rounded-xl border p-3 text-center text-xs font-bold transition ${
                            selectedBank === bank.id
                              ? 'border-[#d23657] bg-[#fdf0f3] text-[#b02644]'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {bank.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tab Content: EMI */}
                {paymentMethod === 'emi' && (
                  <div className="mt-6 space-y-3">
                    <p className="text-xs font-bold text-gray-700">Select EMI Duration</p>
                    {[
                      { months: 3, interest: '12% p.a.', perMonth: Math.round(payableAmount / 3) },
                      { months: 6, interest: '13% p.a.', perMonth: Math.round(payableAmount / 6) },
                      { months: 12, interest: '14.5% p.a.', perMonth: Math.round(payableAmount / 12) },
                    ].map((emi) => (
                      <div
                        key={emi.months}
                        className="flex items-center justify-between rounded-xl border border-gray-200 p-3.5 bg-gray-50/50"
                      >
                        <div>
                          <p className="text-xs font-extrabold text-gray-900">{emi.months} Months Plan</p>
                          <p className="text-[11px] text-gray-500">{emi.interest}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-[#d23657]">₹{emi.perMonth.toLocaleString('en-IN')}/mo</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 5 Columns: Vehicle & Invoice Summary */}
            <div className="space-y-6 lg:col-span-5">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sticky top-6">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-500">Order Summary</h3>

                {/* Vehicle Mini Card */}
                <div className="mt-4 flex gap-4 border-b border-gray-200 pb-5">
                  <img
                    src={auction.images[0]}
                    alt={auction.title}
                    className="size-20 rounded-xl object-cover border border-gray-200"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-gray-900">{auction.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {auction.year} · {auction.kilometers?.toLocaleString('en-IN')} km · {auction.city}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        ★ {auction.inspectionScore || '9.4'} Inspected
                      </span>
                      <span className="text-[10px] text-gray-500">200+ checks</span>
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="mt-5 space-y-2.5 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Winning Hammer Bid</span>
                    <span className="font-bold text-gray-900">{formatPrice(winningBid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>200-Point Inspection & Certification</span>
                    <span className="font-bold text-gray-900">{formatPrice(inspectionFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RTO Ownership Transfer & RC Smart Card</span>
                    <span className="font-bold text-gray-900">{formatPrice(rtoTransferFee)}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>Doorstep Enclosed Flatbed</span>
                      <span className="font-bold text-gray-900">+{formatPrice(deliveryFee)}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                    <span className="font-bold text-gray-900">Total Purchase Value</span>
                    <span className="font-extrabold text-gray-900">{formatPrice(fullTotal)}</span>
                  </div>

                  {paymentType === 'token' && (
                    <div className="rounded-xl bg-[#fdf0f3] p-3 text-xs text-[#b02644] mt-2">
                      <div className="flex justify-between font-extrabold">
                        <span>Payable Today (10% Token)</span>
                        <span className="text-sm font-extrabold">{formatPrice(tokenAmount)}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-gray-600">
                        Remaining balance of {formatPrice(fullTotal - tokenAmount)} payable at hub handover.
                      </p>
                    </div>
                  )}
                </div>

                {/* Security Guarantee Pill */}
                <div className="mt-6 flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
                  <ShieldCheck className="size-4 text-[#d23657] shrink-0" />
                  <span>Physical inspection money-back guarantee if machine does not match report.</span>
                </div>

                {/* Submit Payment CTA */}
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={isProcessing}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d23657] py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-[#b02644] disabled:opacity-75"
                >
                  {isProcessing ? (
                    <>
                      <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing Secure Payment...
                    </>
                  ) : (
                    <>
                      <Lock className="size-4" />
                      Pay {formatPrice(payableAmount)} & Reserve
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[10px] text-gray-400">
                  By clicking Pay, you agree to Vutto's auction terms and vehicle pickup policy.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
