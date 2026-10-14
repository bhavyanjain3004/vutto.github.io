import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ChevronDown,
  Eye,
  HeartHandshake,
  Target,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAuctions } from '@/lib/api';
import AuctionCard from '@/components/app/AuctionCard';
import { useLocationFilter } from '@/context/LocationContext';
function RoyalEnfieldLogo({ className = 'size-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l2.3 3.5 4.2-.6-1.5 3.9 3.5 2.3-3.6 2 .3 4.2-3.9-1.6L12 19l-1.3-3.3-3.9 1.6.3-4.2-3.6-2 3.5-2.3-1.5-3.9 4.2.6L12 2z" />
    </svg>
  );
}
function VespaLogo({ className = 'size-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="6.5" cy="17" r="2.5" />
      <circle cx="17.5" cy="17" r="2.5" />
      <path d="M6.5 17c1.5-5 4-8.5 7.5-9.5l3.5 2" />
      <path d="M13 10.5L10 17h7.5" />
      <path d="M17 9.5h2" />
    </svg>
  );
}
function DucatiLogo({ className = 'size-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2.5L4 6.2v7.5c0 4.8 4.2 7.2 8 7.8 3.8-.6 8-3 8-7.8V6.2L12 2.5z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 13.5C8 9.5 11.8 7.2 17.5 6.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function KtmLogo({ className = 'size-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M2 8h3.2v2.2L7.6 8H11l-3.3 3.3L11.2 15H7.7l-2.5-2.7V15H2V8zm9.5 0h5.6v2.2h-1.6V15h-2.4v-4.8h-1.6V8zm6.2 0h2.2l1.6 3.8 1.6-3.8h2.2v7h-2.2v-3.7l-1.6 3.7h-.4l-1.6-3.7V15h-1.8V8z" />
    </svg>
  );
}
function YamahaLogo({ className = 'size-5' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
    >
      <circle cx="12" cy="12" r="9.5" />
      <path
        d="M12 2.5V12M12 12L4 16.5M12 12L20 16.5"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M9.5 6.5h5M5.5 13l2.5 3M18.5 13l-2.5 3" strokeLinecap="round" />
    </svg>
  );
}
function HondaLogo({ className = 'size-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M2.5 16.5c3.2-3.8 8.8-7 18.5-8-5.2 2-9 4.8-12 8.5-2.4 3-4.5 3.5-6.5-.5z" />
      <path
        d="M6 16.8c3-3 7.8-5.3 15-6-4.5 1.7-7.8 4-10.2 7-1.8 2.2-3.4 2.5-4.8-1z"
        opacity="0.8"
      />
      <path
        d="M10.5 17c2.5-2 6-3.8 10.5-4.5-3.5 1.3-5.8 3-7.5 5.2-1.3 1.5-2.2 1.6-3-.7z"
        opacity="0.6"
      />
    </svg>
  );
}
const TOP_BRANDS = [
  { name: 'Royal Enfield', logo: RoyalEnfieldLogo },
  { name: 'Vespa', logo: VespaLogo },
  { name: 'Ducati', logo: DucatiLogo },
  { name: 'KTM', logo: KtmLogo },
  { name: 'Yamaha', logo: YamahaLogo },
  { name: 'Honda', logo: HondaLogo },
];
const faqs = [
  {
    question: 'How does live bidding work?',
    answer:
      'Registered buyers place bids in real time with transparent minimum increments. Every bid appears immediately on the live floor with real-time countdown updates. If someone outbids you, you receive an instant alert so you can place a counter-bid before time runs out.',
  },
  {
    question: 'How does anti-sniping protection work?',
    answer:
      'To ensure a fair auction for all bidders, any bid placed during the final 60 seconds of an auction automatically extends the countdown timer by 2 minutes. This eliminates last-second sniping software and gives all genuine buyers adequate time to react.',
  },
  {
    question: 'Are all bikes physically inspected?',
    answer:
      'Yes, every single vehicle is physically examined across 200+ checkpoints by experienced mechanics at our Delhi NCR and Jaipur hubs. The comprehensive inspection report detailing engine performance, tire wear, frame alignment, and electrical systems is published on each listing.',
  },
  {
    question: 'How do winning and payment work?',
    answer:
      'The highest bidder when the timer expires wins the auction at their final bid price with no hidden surcharges. The winning bidder receives a secure checkout link to complete the payment via bank transfer, card, or UPI. Once verified, you can collect the bike from our hub or request delivery.',
  },
  {
    question: 'How can I contact customer support?',
    answer:
      'Our support team is available Monday through Saturday from 9:00 AM to 7:00 PM. You can reach out by phone at +91 00000 00000, email us at support@example.com, or submit a message through our Contact Us page.',
  },
];
export default function Home() {
  const { selectedCity } = useLocationFilter();
  const [activeTab, setActiveTab] = useState('live');
  const [openFaq, setOpenFaq] = useState(null);
  const [now] = useState(() => Date.now());
  const auctionsQuery = useQuery({
    queryKey: ['auctions'],
    queryFn: getAuctions,
    refetchInterval: 15000,
  });
  const allAuctions = auctionsQuery.data ?? [];
  const auctions = allAuctions.filter(
    (auction) => selectedCity === 'all' || auction.city.includes(selectedCity)
  );
  const liveAuctions = auctions.filter((auction) => auction.status === 'LIVE');
  const endingAuctions = liveAuctions
    .filter((auction) => {
      const remainingMs = Date.parse(auction.endsAt) - now;
      return remainingMs > 0 && remainingMs <= 24 * 60 * 60 * 1000;
    })
    .sort((a, b) => Date.parse(a.endsAt) - Date.parse(b.endsAt))
    .slice(0, 4);
  const upcomingAuctions = auctions.filter(
    (auction) => auction.status === 'UPCOMING'
  );
  const currentTabAuctions =
    activeTab === 'live'
      ? liveAuctions
      : activeTab === 'ending'
        ? endingAuctions
        : upcomingAuctions;
  // Smooth scroll handler with sticky header offset and prefers-reduced-motion fallback
  const scrollToTarget = (elementId, onBeforeScroll) => {
    if (onBeforeScroll) onBeforeScroll();
    const targetId = elementId === 'faq' ? 'faqs' : elementId;
    const el = document.getElementById(targetId);
    if (el) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const headerOffset = 84;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
      window.history.pushState(null, '', `#${elementId}`);
    }
  };
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      const timer = window.setTimeout(() => {
        scrollToTarget(id);
      }, 150);
      return () => window.clearTimeout(timer);
    }
  }, []);
  return (
    <div className="min-h-screen bg-white text-[#111827]">
      <main>
        {/* Hero Section with Light Pink Tint */}
        <section
          data-testid="hero-section"
          className="relative overflow-hidden border-b border-[#fbe6eb] bg-[#fdf0f3] px-4 pt-12 pb-14 sm:pt-16 sm:pb-16 text-[#111827]"
        >
          {/* Subtle Ambient Radial Glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 35%, rgba(255, 255, 255, 0.9) 0%, rgba(253, 240, 243, 0.6) 60%, transparent 100%)',
            }}
          />

          <div className="relative mx-auto max-w-[1200px] text-center">
            {/* H1 Heading */}
            <h1
              data-testid="hero-heading"
              className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-[#111827] sm:text-4xl lg:text-[44px] leading-tight"
            >
              Bid on certified used bikes and scooters
            </h1>

            {/* Subhead */}
            <p
              data-testid="hero-description"
              className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-gray-600 leading-relaxed"
            >
              Live auctions in Delhi NCR and Jaipur. Every bike has a 200+ point
              inspection.
            </p>

            {/* Spec Showcase with Static 3D Motorcycle, Dotted Halo Arc & Precision Nodes */}
            <div className="relative mx-auto mt-8 sm:mt-12 max-w-4xl px-2 sm:px-6 flex flex-col items-center">
              {/* Studio Stage: Center Motorcycle & Semicircle Halo Arc */}
              <div className="relative w-full min-h-[250px] sm:min-h-[300px] lg:min-h-[340px] flex items-center justify-center">
                {/* Single Halo Arc SVG (Precision Spec-Showcase Dotted Arcs & Rings) */}
                <svg
                  className="absolute inset-0 size-full pointer-events-none z-0"
                  viewBox="0 0 1000 420"
                  fill="none"
                  preserveAspectRatio="xMidYMid meet"
                  aria-hidden="true"
                >
                  <defs>
                    {/* Soft Radial Blush Glow for Depth */}
                    <radialGradient id="blushGlow" cx="50%" cy="50%" r="50%">
                      <stop
                        offset="0%"
                        stopColor="#d23657"
                        stopOpacity="0.14"
                      />
                      <stop
                        offset="60%"
                        stopColor="#d23657"
                        stopOpacity="0.04"
                      />
                      <stop offset="100%" stopColor="#d23657" stopOpacity="0" />
                    </radialGradient>

                    {/* Soft Crimson Glow for Active Position Dot */}
                    <filter
                      id="accentGlow"
                      x="-60%"
                      y="-60%"
                      width="220%"
                      height="220%"
                    >
                      <feGaussianBlur
                        in="SourceGraphic"
                        stdDeviation="3.5"
                        result="blur"
                      />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Soft Centered Radial Blush Glow behind the motorcycle */}
                  <ellipse
                    cx="500"
                    cy="220"
                    rx="320"
                    ry="150"
                    fill="url(#blushGlow)"
                  />

                  {/* Primary Thin Dotted Semicircle Arc (Wrapping over motorcycle like a halo) */}
                  <path
                    d="M 160 360 A 340 340 0 0 1 840 360"
                    stroke="#d23657"
                    strokeOpacity="0.32"
                    strokeWidth="1.5"
                    strokeDasharray="2 6"
                  />

                  {/* Second Fainter Inner Arc for Depth */}
                  <path
                    d="M 210 360 A 290 290 0 0 1 790 360"
                    stroke="#d23657"
                    strokeOpacity="0.14"
                    strokeWidth="1"
                    strokeDasharray="2 8"
                  />
                </svg>

                {/* Desktop Feature Node 1 (Left): Live auctions */}
                <button
                  type="button"
                  onClick={() => {
                    scrollToTarget('auctions', () => setActiveTab('live'));
                  }}
                  data-testid="hero-browse-auctions"
                  aria-label="Direct to Live auctions"
                  className="group hidden sm:flex absolute left-[16%] top-[85.7%] -translate-y-1/2 -translate-x-[calc(100%-9px)] items-center z-20 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d23657] focus-visible:ring-offset-2 rounded-lg"
                >
                  <div className="mr-3 flex flex-col items-end text-right transition group-hover:-translate-x-0.5">
                    <span className="text-[13px] font-bold tracking-tight text-gray-900 transition group-hover:text-[#d23657]">
                      Live auctions
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">
                      {liveAuctions.length} live now
                    </span>
                  </div>
                  <div className="relative flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 border-[#d23657] bg-white shadow-xs transition duration-200 group-hover:scale-125 group-hover:shadow-[0_0_10px_rgba(210,54,87,0.35)]">
                    <span className="size-2 rounded-full bg-[#d23657] shadow-[0_0_6px_#d23657]" />
                  </div>
                </button>

                {/* Desktop Feature Node 2 (Top Left): About Vutto */}
                <button
                  type="button"
                  onClick={() => scrollToTarget('about')}
                  data-testid="hero-about-node"
                  aria-label="Direct to About Vutto"
                  className="group hidden sm:flex absolute left-[27%] top-[29%] -translate-x-1/2 -translate-y-[calc(100%-9px)] flex-col items-center z-20 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d23657] focus-visible:ring-offset-2 rounded-lg"
                >
                  <div className="mb-2 flex flex-col items-center text-center transition group-hover:-translate-y-0.5">
                    <span className="text-[13px] font-bold tracking-tight text-gray-900 transition group-hover:text-[#d23657]">
                      About Vutto
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">
                      Confidence standard
                    </span>
                  </div>
                  <div className="relative flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 border-[#d23657] bg-white shadow-xs transition duration-200 group-hover:scale-125 group-hover:shadow-[0_0_10px_rgba(210,54,87,0.35)]">
                    <span className="size-2 rounded-full bg-[#d23657] shadow-[0_0_6px_#d23657]" />
                  </div>
                </button>

                {/* Desktop Feature Node 3 (Top Center Apex): How bidding works */}
                <button
                  type="button"
                  onClick={() => scrollToTarget('how-it-works')}
                  data-testid="hero-register"
                  aria-label="Direct to How bidding works"
                  className="group hidden sm:flex absolute left-1/2 top-[4.8%] -translate-x-1/2 -translate-y-[calc(100%-9px)] flex-col items-center z-20 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d23657] focus-visible:ring-offset-2 rounded-lg"
                >
                  <div className="mb-2 flex flex-col items-center text-center transition group-hover:-translate-y-0.5">
                    <span className="text-[13px] font-bold tracking-tight text-gray-900 transition group-hover:text-[#d23657]">
                      How bidding works
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">
                      Simple by design
                    </span>
                  </div>
                  <div className="relative flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 border-[#d23657] bg-white shadow-xs transition duration-200 group-hover:scale-125 group-hover:shadow-[0_0_10px_rgba(210,54,87,0.35)]">
                    <span className="size-2 rounded-full bg-[#d23657] shadow-[0_0_6px_#d23657]" />
                  </div>
                </button>

                {/* Desktop Feature Node 4 (Top Right): FAQs */}
                <button
                  type="button"
                  onClick={() => scrollToTarget('faqs')}
                  data-testid="hero-faqs-node"
                  aria-label="Direct to FAQs"
                  className="group hidden sm:flex absolute left-[73%] top-[29%] -translate-x-1/2 -translate-y-[calc(100%-9px)] flex-col items-center z-20 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d23657] focus-visible:ring-offset-2 rounded-lg"
                >
                  <div className="mb-2 flex flex-col items-center text-center transition group-hover:-translate-y-0.5">
                    <span className="text-[13px] font-bold tracking-tight text-gray-900 transition group-hover:text-[#d23657]">
                      FAQs
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">
                      Quick answers
                    </span>
                  </div>
                  <div className="relative flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 border-[#d23657] bg-white shadow-xs transition duration-200 group-hover:scale-125 group-hover:shadow-[0_0_10px_rgba(210,54,87,0.35)]">
                    <span className="size-2 rounded-full bg-[#d23657] shadow-[0_0_6px_#d23657]" />
                  </div>
                </button>

                {/* Desktop Feature Node 5 (Right): Ending soon */}
                <button
                  type="button"
                  onClick={() => {
                    scrollToTarget('auctions', () => setActiveTab('ending'));
                  }}
                  data-testid="hero-ending-soon-node"
                  aria-label="Direct to Ending soon"
                  className="group hidden sm:flex absolute left-[84%] top-[85.7%] -translate-y-1/2 -translate-x-[9px] items-center z-20 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d23657] focus-visible:ring-offset-2 rounded-lg"
                >
                  <div className="relative flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 border-[#d23657] bg-white shadow-xs transition duration-200 group-hover:scale-125 group-hover:shadow-[0_0_10px_rgba(210,54,87,0.35)]">
                    <span className="size-2 rounded-full bg-[#d23657] shadow-[0_0_6px_#d23657]" />
                  </div>
                  <div className="ml-3 flex flex-col items-start text-left transition group-hover:translate-x-0.5">
                    <span className="text-[13px] font-bold tracking-tight text-gray-900 transition group-hover:text-[#d23657]">
                      Ending soon
                    </span>
                    <span className="text-[11px] font-medium text-gray-500">
                      Urgent countdowns
                    </span>
                  </div>
                </button>

                {/* Static 3D Motorcycle Image Centered on Studio Surface */}
                <div className="relative z-10 flex flex-col items-center pt-8 sm:pt-10">
                  {/* Soft Contact Shadow */}
                  <div
                    className="pointer-events-none absolute bottom-0 inset-x-8 sm:inset-x-12 h-6 rounded-[100%] opacity-40 blur-xs"
                    style={{
                      background:
                        'radial-gradient(ellipse at 50% 50%, rgba(210, 54, 87, 0.35) 0%, rgba(0, 0, 0, 0.15) 50%, transparent 80%)',
                    }}
                  />

                  {/* Static 3D Motorcycle Image (Transparent Background) */}
                  <img
                    src="/images/hero-bike.png"
                    alt="Vutto 3D Motorcycle Showcase"
                    className="relative z-10 max-h-[180px] sm:max-h-[230px] lg:max-h-[270px] w-auto object-contain drop-shadow-[0_16px_28px_rgba(210,54,87,0.22)] transition duration-300 hover:scale-[1.02]"
                  />
                </div>
              </div>

              {/* Mobile Responsive Stack */}
              <div className="mt-6 flex w-full max-w-xs flex-col gap-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => {
                    scrollToTarget('auctions', () => setActiveTab('live'));
                  }}
                  className="flex items-center justify-between rounded-xl border border-[#d23657]/15 bg-white/80 px-3.5 py-2 shadow-2xs backdrop-blur-xs transition hover:border-[#d23657]/40 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex size-4 items-center justify-center rounded-full border-2 border-[#d23657] bg-[#fdf0f3]">
                      <span className="size-1.5 rounded-full bg-[#d23657] shadow-[0_0_6px_#d23657]" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-gray-900">
                        Live auctions
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {liveAuctions.length} live now
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-gray-400" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToTarget('about')}
                  className="flex items-center justify-between rounded-xl border border-[#d23657]/15 bg-white/80 px-3.5 py-2 shadow-2xs backdrop-blur-xs transition hover:border-[#d23657]/40 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex size-4 items-center justify-center rounded-full border-2 border-[#d23657]/60 bg-[#fdf0f3]">
                      <span className="size-1.5 rounded-full bg-[#d23657]/30" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-gray-900">
                        About Vutto
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Confidence standard
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-gray-400" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToTarget('how-it-works')}
                  className="flex items-center justify-between rounded-xl border border-[#d23657]/15 bg-white/80 px-3.5 py-2 shadow-2xs backdrop-blur-xs transition hover:border-[#d23657]/40 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex size-4 items-center justify-center rounded-full border-2 border-[#d23657]/60 bg-[#fdf0f3]">
                      <span className="size-1.5 rounded-full bg-[#d23657]/30" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-gray-900">
                        How bidding works
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Simple by design
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-gray-400" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToTarget('faqs')}
                  className="flex items-center justify-between rounded-xl border border-[#d23657]/15 bg-white/80 px-3.5 py-2 shadow-2xs backdrop-blur-xs transition hover:border-[#d23657]/40 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex size-4 items-center justify-center rounded-full border-2 border-[#d23657]/60 bg-[#fdf0f3]">
                      <span className="size-1.5 rounded-full bg-[#d23657]/30" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-gray-900">
                        FAQs
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Quick answers
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-gray-400" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    scrollToTarget('auctions', () => setActiveTab('ending'));
                  }}
                  className="flex items-center justify-between rounded-xl border border-[#d23657]/15 bg-white/80 px-3.5 py-2 shadow-2xs backdrop-blur-xs transition hover:border-[#d23657]/40 text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex size-4 items-center justify-center rounded-full border-2 border-[#d23657]/60 bg-[#fdf0f3]">
                      <span className="size-1.5 rounded-full bg-[#d23657]/30" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-gray-900">
                        Ending soon
                      </span>
                      <span className="text-[10px] text-gray-500">
                        Urgent countdowns
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Below the orbit: one primary button and one inline trust line */}
            <div className="mt-8 sm:mt-10 flex flex-col items-center gap-3">
              <Link
                to="/auctions?status=live"
                className="rounded-full bg-[#d23657] px-6 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-[#b02644] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d23657] focus-visible:ring-offset-2"
              >
                Browse live auctions
              </Link>
              <p className="text-xs text-gray-500">
                200+ point inspection · Clear RTO title · 6-month warranty
              </p>
            </div>
          </div>
        </section>

        {/* Auctions Section */}
        <section
          id="auctions"
          data-testid="live-auctions-section"
          className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <h2
                data-testid="live-section-heading"
                className="text-[28px] font-bold tracking-tight text-[#111827]"
              >
                Auctions
              </h2>

              {/* Tabs: Live now / Ending soon / Upcoming */}
              <div className="flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-gray-50/80 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('live')}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'live'
                      ? 'bg-white text-[#d23657] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Live now ({liveAuctions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ending')}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'ending'
                      ? 'bg-white text-[#d23657] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Ending soon ({endingAuctions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('upcoming')}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition cursor-pointer ${
                    activeTab === 'upcoming'
                      ? 'bg-white text-[#d23657] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Upcoming ({upcomingAuctions.length})
                </button>
              </div>
            </div>

            <Link
              to={
                activeTab === 'ending'
                  ? '/auctions?status=live&sort=ending'
                  : activeTab === 'upcoming'
                    ? '/auctions?status=upcoming'
                    : '/auctions?status=live'
              }
              data-testid="view-all-live"
              className="text-sm font-semibold text-[#d23657] hover:underline"
            >
              View all →
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {auctionsQuery.isLoading ? (
              [1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  data-testid={`auction-skeleton-${item}`}
                  className="aspect-[4/3] animate-pulse rounded-2xl bg-gray-100"
                />
              ))
            ) : currentTabAuctions.length > 0 ? (
              currentTabAuctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))
            ) : (
              <div className="col-span-full rounded-2xl border border-dashed border-[#e5e7eb] bg-white p-10 text-center">
                <p className="text-sm font-semibold text-gray-900">
                  {activeTab === 'live'
                    ? 'No live auctions right now.'
                    : activeTab === 'ending'
                      ? 'No auctions ending in the next 24 hours.'
                      : 'No upcoming auctions scheduled at the moment.'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {activeTab === 'live'
                    ? 'Check upcoming auctions or adjust your location filter.'
                    : 'Browse our active auctions to find available two-wheelers.'}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          data-testid="how-it-works-section"
          className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-[#e5e7eb]"
        >
          <div className="max-w-xl">
            <h2
              data-testid="how-heading"
              className="text-[28px] font-bold tracking-tight text-[#111827]"
            >
              How bidding works
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Four straightforward steps to buy your next two-wheeler with
              confidence.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div data-testid="how-step-01" className="space-y-2">
              <span
                data-testid="how-step-number-01"
                className="text-xs font-bold text-[#d23657]"
              >
                01
              </span>
              <h3 className="text-base font-semibold text-[#111827]">
                Register
              </h3>
              <p className="text-sm text-gray-500">
                Create your free account and complete quick verification in
                under a minute.
              </p>
            </div>
            <div data-testid="how-step-02" className="space-y-2">
              <span
                data-testid="how-step-number-02"
                className="text-xs font-bold text-[#d23657]"
              >
                02
              </span>
              <h3 className="text-base font-semibold text-[#111827]">Browse</h3>
              <p className="text-sm text-gray-500">
                Review detailed inspection reports, checkpoint photos, and title
                history.
              </p>
            </div>
            <div data-testid="how-step-03" className="space-y-2">
              <span
                data-testid="how-step-number-03"
                className="text-xs font-bold text-[#d23657]"
              >
                03
              </span>
              <h3 className="text-base font-semibold text-[#111827]">Bid</h3>
              <p className="text-sm text-gray-500">
                Place real-time bids with instant notifications and fair
                anti-sniping protection.
              </p>
            </div>
            <div data-testid="how-step-04" className="space-y-2">
              <span
                data-testid="how-step-number-04"
                className="text-xs font-bold text-[#d23657]"
              >
                04
              </span>
              <h3 className="text-base font-semibold text-[#111827]">
                Collect
              </h3>
              <p className="text-sm text-gray-500">
                Complete payment securely and pick up your bike from our hub or
                arrange delivery.
              </p>
            </div>
          </div>
        </section>

        {/* Top Brands Bar */}
        <section
          data-testid="top-brands-section"
          className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >
          <div className="rounded-3xl bg-gradient-to-r from-[#d23657] to-[#b02644] p-4 sm:p-5 text-white shadow-sm">
            <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar sm:justify-around lg:gap-6">
              {TOP_BRANDS.map(({ name, logo: Logo }) => (
                <div
                  key={name}
                  className="flex shrink-0 items-center gap-2.5 rounded-2xl bg-white/10 px-3.5 py-2 backdrop-blur-xs select-none"
                >
                  <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 text-white">
                    <Logo className="size-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold tracking-tight text-white whitespace-nowrap">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Vutto */}
        <section
          id="about"
          data-testid="trust-section"
          className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-[#e5e7eb]"
        >
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <h2
                data-testid="trust-heading"
                className="text-[28px] font-bold tracking-tight text-[#111827]"
              >
                About Vutto
              </h2>
              <p className="mt-3 text-base leading-relaxed text-gray-600">
                Certified pre-owned two-wheeler auctions with physical
                inspection hubs in Delhi NCR and Jaipur. Every bike is evaluated
                across 200+ checkpoints with verified RTO history before bidding
                begins.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs transition duration-200 hover:border-[#d23657]/30 hover:shadow-sm">
                <img
                  src="/images/about-inspection.svg"
                  alt="200+ point physical inspection checkpoints"
                  className="aspect-[4/3] w-full object-contain bg-[#fdf0f3] transition duration-300 hover:scale-105"
                />
                <div className="p-3 sm:p-3.5">
                  <p className="text-xs sm:text-sm font-bold text-gray-900">
                    Physical Hubs
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500">
                    200+ point inspection
                  </p>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xs transition duration-200 hover:border-[#d23657]/30 hover:shadow-sm">
                <img
                  src="/images/about-rto.svg"
                  alt="Verified vehicle registration and clean title"
                  className="aspect-[4/3] w-full object-contain bg-[#fdf0f3] transition duration-300 hover:scale-105"
                />
                <div className="p-3 sm:p-3.5">
                  <p className="text-xs sm:text-sm font-bold text-gray-900">
                    RTO Verified
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500">
                    Clean title & provenance
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mission, Vision, and Values Widgets */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Our Mission */}
            <div className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs transition duration-200 hover:border-[#d23657]/30 hover:shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#fdf0f3] text-[#d23657] transition group-hover:scale-105">
                <Target className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#111827]">
                Our mission
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Make buying used two-wheelers transparent, reliable, and fair
                through certified inspections and live bidding.
              </p>
            </div>

            {/* Our Vision */}
            <div className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs transition duration-200 hover:border-[#d23657]/30 hover:shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#fdf0f3] text-[#d23657] transition group-hover:scale-105">
                <Eye className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#111827]">
                Our vision
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Become India&apos;s most trusted two-wheeler auction
                marketplace, built on verified quality and honest pricing.
              </p>
            </div>

            {/* Our Values */}
            <div className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-xs transition duration-200 hover:border-[#d23657]/30 hover:shadow-sm">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-[#fdf0f3] text-[#d23657] transition group-hover:scale-105">
                <HeartHandshake className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-[#111827]">
                Our values
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                200+ checkpoint rigor, verified vehicle history, and putting
                riders first in every decision.
              </p>
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section
          id="faqs"
          data-testid="faqs-section"
          className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 border-t border-[#e5e7eb]"
        >
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2
                data-testid="faqs-heading"
                className="text-[28px] font-bold tracking-tight text-[#111827]"
              >
                Frequently asked questions
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Everything you need to know about bidding, inspections, and
                collecting your vehicle.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={faq.question}
                    className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white transition"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 p-4 text-left sm:p-5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d23657]"
                    >
                      <span className="text-sm font-semibold text-[#111827] sm:text-base">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`size-4 shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#d23657]' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-[#e5e7eb] bg-gray-50/50 p-4 text-sm leading-relaxed text-gray-600 sm:p-5">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 text-center text-sm text-gray-600">
              Have more questions?{' '}
              <Link
                to="/contact"
                data-testid="help-contact-us"
                className="font-semibold text-[#d23657] hover:underline"
              >
                Contact us →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
