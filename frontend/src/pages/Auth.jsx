import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, BadgeCheck, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const isRegister = location.pathname === '/register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const mutation = useMutation({
    mutationFn: () =>
      isRegister
        ? register(name.trim(), email.trim(), password)
        : login(email.trim(), password),
    onSuccess: (user) => {
      toast.success(`Welcome, ${user.name.split(' ')[0]}!`);
      navigate(user.role === 'admin' ? '/admin' : '/');
    },
    onError: () => {
      if (!isRegister) {
        toast.error('Invalid email or password');
      } else {
        toast.error('Registration failed. Please check your details.');
      }
    },
  });
  const submit = (event) => {
    event.preventDefault();
    if (isRegister && name.trim().length < 2) {
      toast.error('Please enter your full name');
      return;
    }
    if (!email.includes('@')) {
      toast.error('Enter a valid email address');
      return;
    }
    if (password.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    mutation.mutate();
  };
  return (
    <div className="min-h-[calc(100vh-72px)] bg-[#fdf0f3]">
      <div className="mx-auto grid min-h-[calc(100vh-72px)] max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8">
        <div className="hidden lg:block">
          <Link
            to="/"
            data-testid="auth-back-home"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#d23657]"
          >
            <ArrowLeft className="size-4" />
            Back to Vutto Auctions
          </Link>
          <div className="mt-16 max-w-lg">
            <div
              data-testid="auth-trust-badge"
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#b02644]"
            >
              <ShieldCheck className="size-4" />
              Trusted two-wheeler auctions
            </div>
            <h1
              data-testid="auth-heading"
              className="mt-6 text-5xl font-extrabold leading-tight tracking-[-.05em]"
            >
              Your next ride is
              <br />
              <span className="text-[#d23657]">closer than you think.</span>
            </h1>
            <p
              data-testid="auth-description"
              className="mt-5 max-w-md text-base leading-7 text-gray-600"
            >
              Sign in to follow bids, save auctions and move one step closer to
              riding home.
            </p>
            <div className="mt-10 flex gap-6 text-sm font-semibold text-gray-700">
              <span
                data-testid="auth-proof-inspection"
                className="inline-flex items-center gap-2"
              >
                <BadgeCheck className="size-4 text-[#d23657]" />
                200+ checks
              </span>
              <span
                data-testid="auth-proof-warranty"
                className="inline-flex items-center gap-2"
              >
                <ShieldCheck className="size-4 text-emerald-500" />
                6-month warranty
              </span>
            </div>
          </div>
        </div>
        <div
          data-testid="auth-card"
          className="rounded-3xl border border-white bg-white p-6 shadow-[0_24px_60px_-20px_rgba(108,25,48,.18)] sm:p-8"
        >
          <div className="lg:hidden">
            <Link
              to="/"
              data-testid="auth-mobile-back-home"
              className="text-sm font-semibold text-gray-500"
            >
              ← Vutto Auctions
            </Link>
          </div>
          <h2
            data-testid="auth-card-heading"
            className="mt-6 text-2xl font-extrabold tracking-tight"
          >
            {isRegister ? 'Create your account' : 'Welcome back'}
          </h2>
          <p
            data-testid="auth-card-description"
            className="mt-2 text-sm text-gray-500"
          >
            {isRegister
              ? 'Join the fairer way to buy your next two-wheeler.'
              : 'Sign in with your email and password to start bidding.'}
          </p>
          <form
            data-testid="auth-form"
            onSubmit={submit}
            className="mt-7 space-y-4"
          >
            {isRegister && (
              <div>
                <label
                  htmlFor="name"
                  className="text-xs font-bold text-gray-700"
                >
                  Full name
                </label>
                <input
                  id="name"
                  data-testid="register-name-input"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#d23657] focus:ring-2 focus:ring-[#d23657]/10"
                  placeholder="Arjun Sharma"
                  required
                />
              </div>
            )}
            <div>
              <label
                htmlFor="email"
                className="text-xs font-bold text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                data-testid="auth-email-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none focus:border-[#d23657] focus:ring-2 focus:ring-[#d23657]/10"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="text-xs font-bold text-gray-700"
              >
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  data-testid="auth-password-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-11 w-full rounded-xl border border-gray-200 px-3 pr-11 text-sm outline-none focus:border-[#d23657] focus:ring-2 focus:ring-[#d23657]/10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  data-testid="toggle-password-visibility"
                  onClick={() => setShowPassword((show) => !show)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              type="submit"
              data-testid="auth-submit-button"
              disabled={mutation.isPending}
              className="h-12 w-full rounded-xl bg-[#d23657] text-sm font-bold text-white shadow-[0_7px_18px_rgba(210,54,87,.18)] transition hover:bg-[#b02644] disabled:opacity-60"
            >
              {mutation.isPending
                ? 'Please wait…'
                : isRegister
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>
          <p
            data-testid="auth-switch-copy"
            className="mt-6 text-center text-sm text-gray-500"
          >
            {isRegister ? 'Already have an account?' : 'New to Vutto?'}{' '}
            <Link
              to={isRegister ? '/login' : '/register'}
              data-testid="auth-switch-link"
              className="font-bold text-[#d23657] hover:underline"
            >
              {isRegister ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
