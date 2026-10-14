import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { CONTACT_DETAILS } from '@/data/contact';
import { submitContact } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
export default function Contact() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const auctionParam = searchParams.get('auction') || '';
  useEffect(() => {
    document.title = 'Contact · Vutto Auctions';
  }, []);
  const [prevUser, setPrevUser] = useState(user);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('');
  const [prevAuctionParam, setPrevAuctionParam] = useState(auctionParam);
  const [auction, setAuction] = useState(auctionParam);
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  // Sync auth or auctionParam state if changed externally
  if (user !== prevUser) {
    setPrevUser(user);
    if (user?.name && !name) setName(user.name);
    if (user?.email && !email) setEmail(user.email);
  }
  if (auctionParam !== prevAuctionParam) {
    setPrevAuctionParam(auctionParam);
    if (auctionParam) setAuction(auctionParam);
  }
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  // Field refs for focus management
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const phoneRef = useRef(null);
  const topicRef = useRef(null);
  const auctionRef = useRef(null);
  const messageRef = useRef(null);
  const validateField = (field, val) => {
    if (field === 'name') {
      const v = val !== undefined ? val : name;
      if (!v.trim()) return 'Please enter your name.';
      if (v.trim().length < 2) return 'Name must be at least 2 characters.';
    }
    if (field === 'email') {
      const v = val !== undefined ? val : email;
      if (!v.trim()) return 'Please enter your email.';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(v.trim()))
        return 'Please enter a valid email address.';
    }
    if (field === 'phone') {
      const v = val !== undefined ? val : phone;
      if (v.trim()) {
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/;
        if (!phoneRegex.test(v.trim()))
          return 'Please enter a valid phone number.';
      }
    }
    if (field === 'topic') {
      const v = val !== undefined ? val : topic;
      if (!v) return 'Please select a topic.';
    }
    if (field === 'message') {
      const v = val !== undefined ? val : message;
      if (!v.trim()) return 'Please enter your message.';
      if (v.trim().length < 10)
        return 'Message must be at least 10 characters.';
      if (v.length > 1000) return 'Message cannot exceed 1000 characters.';
    }
    return undefined;
  };
  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    // Check honeypot
    if (honeypot) {
      return;
    }
    const newErrors = {
      name: validateField('name'),
      email: validateField('email'),
      phone: validateField('phone'),
      topic: validateField('topic'),
      message: validateField('message'),
    };
    setErrors(newErrors);
    setTouched({
      name: true,
      email: true,
      phone: true,
      topic: true,
      message: true,
    });
    // Check first invalid field and focus it
    if (newErrors.name) {
      nameRef.current?.focus();
      return;
    }
    if (newErrors.email) {
      emailRef.current?.focus();
      return;
    }
    if (newErrors.phone) {
      phoneRef.current?.focus();
      return;
    }
    if (newErrors.topic) {
      topicRef.current?.focus();
      return;
    }
    if (newErrors.message) {
      messageRef.current?.focus();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitContact({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        topic,
        auctionId: auction.trim() || undefined,
        message: message.trim(),
      });
      setSubmittedEmail(email.trim());
    } catch {
      setSubmitError('Failed to send your message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  const handleReset = () => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setPhone('');
    setTopic('');
    setAuction(auctionParam);
    setMessage('');
    setErrors({});
    setTouched({});
    setSubmittedEmail(null);
    setSubmitError(null);
  };
  return (
    <div className="min-h-screen bg-[#fafafa] pb-20">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        {/* Page Heading */}
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Contact us
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Questions about an auction or a bike? Send us a message.
          </p>
        </div>

        {/* Two Column Layout (info 4/12, form 8/12; form first on mobile) */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Right Column: Form (8/12, order-1 on mobile, order-2 on lg) */}
          <div className="order-1 lg:order-2 lg:col-span-8">
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-6 sm:p-8">
              {submittedEmail ? (
                /* Success State */
                <div data-testid="contact-success-state" className="py-8">
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                    Message sent
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    We&apos;ll reply to {submittedEmail}.
                  </p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="mt-6 text-sm font-semibold text-[#d23657] transition hover:text-[#b02644] hover:underline cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                /* Form State */
                <>
                  <h2 className="text-xl font-bold tracking-tight text-gray-900">
                    Send a message
                  </h2>

                  <form
                    onSubmit={handleSubmit}
                    noValidate
                    className="mt-6 space-y-5"
                  >
                    {/* Honeypot field (hidden from users and screen readers) */}
                    <div className="hidden" aria-hidden="true">
                      <label htmlFor="website">Website</label>
                      <input
                        type="text"
                        id="website"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {/* Name */}
                      <div>
                        <label
                          htmlFor="contact-name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Name
                        </label>
                        <input
                          id="contact-name"
                          ref={nameRef}
                          type="text"
                          autoComplete="name"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (touched.name) {
                              setErrors((prev) => ({
                                ...prev,
                                name: validateField('name', e.target.value),
                              }));
                            }
                          }}
                          onBlur={() => handleBlur('name')}
                          aria-invalid={Boolean(errors.name)}
                          aria-describedby={
                            errors.name ? 'name-error' : undefined
                          }
                          className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition ${
                            errors.name
                              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                              : 'border-gray-200 focus:border-[#d23657] focus:ring-1 focus:ring-[#d23657]'
                          }`}
                        />
                        {errors.name && (
                          <p
                            id="name-error"
                            className="mt-1.5 text-xs text-red-600"
                          >
                            {errors.name}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label
                          htmlFor="contact-email"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Email
                        </label>
                        <input
                          id="contact-email"
                          ref={emailRef}
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (touched.email) {
                              setErrors((prev) => ({
                                ...prev,
                                email: validateField('email', e.target.value),
                              }));
                            }
                          }}
                          onBlur={() => handleBlur('email')}
                          aria-invalid={Boolean(errors.email)}
                          aria-describedby={
                            errors.email ? 'email-error' : undefined
                          }
                          className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition ${
                            errors.email
                              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                              : 'border-gray-200 focus:border-[#d23657] focus:ring-1 focus:ring-[#d23657]'
                          }`}
                        />
                        {errors.email && (
                          <p
                            id="email-error"
                            className="mt-1.5 text-xs text-red-600"
                          >
                            {errors.email}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      {/* Phone (optional) */}
                      <div>
                        <label
                          htmlFor="contact-phone"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Phone (optional)
                        </label>
                        <input
                          id="contact-phone"
                          ref={phoneRef}
                          type="tel"
                          autoComplete="tel"
                          value={phone}
                          onChange={(e) => {
                            setPhone(e.target.value);
                            if (touched.phone) {
                              setErrors((prev) => ({
                                ...prev,
                                phone: validateField('phone', e.target.value),
                              }));
                            }
                          }}
                          onBlur={() => handleBlur('phone')}
                          aria-invalid={Boolean(errors.phone)}
                          aria-describedby={
                            errors.phone ? 'phone-error' : undefined
                          }
                          className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition ${
                            errors.phone
                              ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                              : 'border-gray-200 focus:border-[#d23657] focus:ring-1 focus:ring-[#d23657]'
                          }`}
                        />
                        {errors.phone && (
                          <p
                            id="phone-error"
                            className="mt-1.5 text-xs text-red-600"
                          >
                            {errors.phone}
                          </p>
                        )}
                      </div>

                      {/* Topic */}
                      <div>
                        <label
                          htmlFor="contact-topic"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Topic
                        </label>
                        <div className="relative mt-1.5">
                          <select
                            id="contact-topic"
                            ref={topicRef}
                            value={topic}
                            onChange={(e) => {
                              setTopic(e.target.value);
                              if (touched.topic) {
                                setErrors((prev) => ({
                                  ...prev,
                                  topic: validateField('topic', e.target.value),
                                }));
                              }
                            }}
                            onBlur={() => handleBlur('topic')}
                            aria-invalid={Boolean(errors.topic)}
                            aria-describedby={
                              errors.topic ? 'topic-error' : undefined
                            }
                            className={`h-10.5 w-full appearance-none rounded-xl border bg-white pl-3.5 pr-9 text-sm text-gray-900 outline-none transition ${
                              errors.topic
                                ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                : 'border-gray-200 focus:border-[#d23657] focus:ring-1 focus:ring-[#d23657]'
                            } ${!topic ? 'text-gray-400' : ''}`}
                          >
                            <option value="" disabled>
                              Select a topic
                            </option>
                            <option value="Bidding help">Bidding help</option>
                            <option value="A bike or auction">
                              A bike or auction
                            </option>
                            <option value="Selling a bike">
                              Selling a bike
                            </option>
                            <option value="Account issue">Account issue</option>
                            <option value="Other">Other</option>
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                        </div>
                        {errors.topic && (
                          <p
                            id="topic-error"
                            className="mt-1.5 text-xs text-red-600"
                          >
                            {errors.topic}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Auction (optional) */}
                    <div>
                      <label
                        htmlFor="contact-auction"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Auction (optional)
                      </label>
                      <input
                        id="contact-auction"
                        ref={auctionRef}
                        type="text"
                        value={auction}
                        readOnly={Boolean(auctionParam)}
                        onChange={(e) => setAuction(e.target.value)}
                        placeholder="e.g. auc-1"
                        className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition ${
                          auctionParam
                            ? 'border-gray-200 bg-gray-50 text-gray-600 cursor-not-allowed'
                            : 'border-gray-200 bg-white text-gray-900 focus:border-[#d23657] focus:ring-1 focus:ring-[#d23657]'
                        }`}
                      />
                    </div>

                    {/* Message */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="contact-message"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Message
                        </label>
                        <span className="text-xs text-gray-400">
                          {message.length}/1000
                        </span>
                      </div>
                      <textarea
                        id="contact-message"
                        ref={messageRef}
                        rows={5}
                        maxLength={1000}
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          if (touched.message) {
                            setErrors((prev) => ({
                              ...prev,
                              message: validateField('message', e.target.value),
                            }));
                          }
                        }}
                        onBlur={() => handleBlur('message')}
                        placeholder="How can we help?"
                        aria-invalid={Boolean(errors.message)}
                        aria-describedby={
                          errors.message ? 'message-error' : undefined
                        }
                        className={`mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition ${
                          errors.message
                            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                            : 'border-gray-200 focus:border-[#d23657] focus:ring-1 focus:ring-[#d23657]'
                        }`}
                      />
                      {errors.message && (
                        <p
                          id="message-error"
                          className="mt-1.5 text-xs text-red-600"
                        >
                          {errors.message}
                        </p>
                      )}
                    </div>

                    {/* Error Banner with Retry */}
                    {submitError && (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                        <span>{submitError}</span>
                        <button
                          type="button"
                          onClick={() => handleSubmit()}
                          className="font-bold underline hover:text-red-900 cursor-pointer"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex h-11 items-center justify-center rounded-xl bg-[#d23657] px-6 text-sm font-semibold text-white transition hover:bg-[#b02644] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                      >
                        {submitting ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span>Sending message…</span>
                          </span>
                        ) : (
                          'Send message'
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Left Column: Other ways to reach us (4/12, order-2 on mobile, order-1 on lg) */}
          <div className="order-2 lg:order-1 lg:col-span-4">
            <h2 className="text-xl font-bold tracking-tight text-gray-900">
              Other ways to reach us
            </h2>

            <dl className="mt-6 divide-y divide-[#e5e7eb] border-y border-[#e5e7eb]">
              {/* Email */}
              <div className="py-4">
                <dt className="text-xs text-gray-500">Email</dt>
                <dd className="mt-1 text-sm font-normal text-gray-900">
                  <a
                    href={`mailto:${CONTACT_DETAILS.email}`}
                    className="hover:text-[#d23657] transition"
                  >
                    {CONTACT_DETAILS.email}
                  </a>
                </dd>
              </div>

              {/* Phone */}
              <div className="py-4">
                <dt className="text-xs text-gray-500">Phone</dt>
                <dd className="mt-1 text-sm font-normal text-gray-900">
                  <a
                    href={`tel:${CONTACT_DETAILS.phone.replace(/\s+/g, '')}`}
                    className="hover:text-[#d23657] transition"
                  >
                    {CONTACT_DETAILS.phone}
                  </a>
                </dd>
              </div>

              {/* Hours */}
              <div className="py-4">
                <dt className="text-xs text-gray-500">Hours</dt>
                <dd className="mt-1 text-sm font-normal text-gray-900">
                  {CONTACT_DETAILS.hours}
                </dd>
              </div>

              {/* Hubs */}
              <div className="py-4">
                <dt className="text-xs text-gray-500">Hubs</dt>
                <dd className="mt-1 space-y-1 text-sm font-normal text-gray-900">
                  {CONTACT_DETAILS.hubs.map((hub) => (
                    <div key={hub.name}>
                      <span className="font-medium text-gray-900">
                        {hub.name}:
                      </span>{' '}
                      <span className="text-gray-600">{hub.address}</span>
                    </div>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  );
}
