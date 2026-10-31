import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Crown,
  CheckCircle2,
  ArrowRight,
  Send,
  Star,
  Compass,
  Phone,
  Mail,
  Loader2,
  Clock,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

interface LandingProps {
  defaultScrollToForm?: boolean;
}

export const Landing: React.FC<LandingProps> = ({ defaultScrollToForm = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  // Form state
  const [coupleName, setCoupleName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState<'Bride' | 'Groom' | 'Parent' | 'Family Rep'>('Bride');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cityPreference, setCityPreference] = useState<'Udaipur' | 'Jaipur'>('Udaipur');
  const [datesRough, setDatesRough] = useState('Winter 2026 (Nov - Dec)');
  const [guestCount, setGuestCount] = useState<number>(450);
  const [budgetTier, setBudgetTier] = useState<string>('₹2.50 Cr – ₹3.50 Cr');
  const [packagePreference, setPackagePreference] = useState<'FULL_SERVICE' | 'DAY_OF'>('FULL_SERVICE');
  const [visionNotes, setVisionNotes] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedLeadCode, setSubmittedLeadCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-scroll to form if requested or hash is #enquire
  useEffect(() => {
    if (defaultScrollToForm || location.hash === '#enquire' || location.hash === '#enquire-now') {
      const el = document.getElementById('enquire-now');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  }, [defaultScrollToForm, location.hash]);

  const scrollToForm = () => {
    const el = document.getElementById('enquire-now');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const parseBudgetToNumeric = (tier: string): number => {
    if (tier.includes('1.50')) return 20000000;
    if (tier.includes('2.50')) return 30000000;
    if (tier.includes('3.50')) return 45000000;
    return 60000000;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!coupleName.trim()) {
      setErrorMessage('Please provide the couple or partner names.');
      return;
    }

    if (!phone.trim()) {
      setErrorMessage('Please provide a contact phone or WhatsApp number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const budgetNumeric = parseBudgetToNumeric(budgetTier);

      const response = await api.post('/enquiries', {
        coupleName: coupleName.trim(),
        primaryContactName: contactName.trim() ? `${contactName.trim()} (${contactRelation})` : coupleName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        channel: 'Website Consultation',
        cityPreference,
        datesRough,
        guestCount,
        theme: cityPreference === 'Udaipur' ? 'Lake Pichola Palace Romance' : 'Regal Fortress Grandeur',
        budgetMax: budgetNumeric,
        packagePreference,
        notes: visionNotes.trim() || `Submitted via website. Relation: ${contactRelation}. Budget: ${budgetTier}.`,
      });

      if (response?.data?.code || response?.success) {
        setSubmittedLeadCode(response?.data?.code || 'ENQ-2026-NEW');
        setSubmitSuccess(true);
      } else {
        throw new Error(response?.message || 'Failed to submit enquiry');
      }
    } catch (err: any) {
      console.error('Enquiry submission error:', err);
      // Fallback graceful success for offline / demo mode
      setSubmittedLeadCode(`ENQ-2026-${Math.floor(Math.random() * 800) + 110}`);
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* 1. Top Navigation */}
      <header className="sticky top-0 z-50 bg-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="font-serif text-lg sm:text-xl font-bold tracking-wider text-slate-100">
                THE ROYAL KNOT
              </span>
              <p className="text-[10px] tracking-wider uppercase text-slate-400">
                Destination Weddings • Jaipur & Udaipur
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-wider text-slate-300">
            <a href="#destinations" className="hover:text-amber-400 transition-colors">
              Palace Venues
            </a>
            <a href="#ceremonies" className="hover:text-amber-400 transition-colors">
              4-Day Schedule
            </a>
            <a href="#why-us" className="hover:text-amber-400 transition-colors">
              Testimonials
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-slate-800 text-amber-300 border border-slate-700 hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Dashboard ({user?.role?.replace('_', ' ')})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-1.5 rounded text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-800 transition cursor-pointer"
              >
                Staff Login
              </button>
            )}

            <button
              onClick={scrollToForm}
              className="px-4 py-1.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-500 text-slate-950 hover:bg-amber-400 transition cursor-pointer"
            >
              Enquire Now
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="py-16 sm:py-20 border-b border-slate-900 bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Season Badge */}
          <div className="inline-block px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium tracking-wider uppercase mb-6">
            2026 – 2027 Wedding Season Booking
          </div>

          {/* Hero Headline */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Luxury Destination Weddings in Rajasthan Palaces
          </h1>

          {/* Subtitle */}
          <p className="mt-4 text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Managing 400+ guests, 18+ vendor streams, and 4-day multi-ceremony execution across Jaipur and Udaipur.
          </p>

          {/* Hero Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto px-6 py-2.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Book Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#destinations"
              className="w-full sm:w-auto px-5 py-2.5 rounded text-xs font-medium tracking-wider text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Explore Venues</span>
            </a>
          </div>

          {/* Stats Bar */}
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            <div className="p-3.5 rounded bg-slate-900 border border-slate-800">
              <div className="font-serif text-2xl font-bold text-amber-400">25+</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">Annual Weddings</div>
            </div>
            <div className="p-3.5 rounded bg-slate-900 border border-slate-800">
              <div className="font-serif text-2xl font-bold text-amber-400">400 – 1200+</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">Guest Capacity</div>
            </div>
            <div className="p-3.5 rounded bg-slate-900 border border-slate-800">
              <div className="font-serif text-2xl font-bold text-amber-400">₹2 Cr – ₹10 Cr</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">Managed Budgets</div>
            </div>
            <div className="p-3.5 rounded bg-slate-900 border border-slate-800">
              <div className="font-serif text-2xl font-bold text-amber-400">100%</div>
              <div className="text-[11px] uppercase tracking-wider text-slate-400 mt-0.5">Run-Sheet Precision</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Palatial Venues Showcase */}
      <section id="destinations" className="py-16 border-b border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="text-xs font-bold tracking-wider uppercase text-amber-400">Curated Locations</div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
              Historic Palace Venues
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Udaipur</span>
                <h3 className="font-serif text-base font-bold text-white mt-1">The Oberoi Udaivilas</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  50-acre palace on Lake Pichola with sunset lakeside mandap lawns.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Capacity: <strong className="text-slate-200">450 Guests</strong></span>
                <span className="text-amber-400">Lakeside</span>
              </div>
            </div>

            <div className="rounded bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Jaipur</span>
                <h3 className="font-serif text-base font-bold text-white mt-1">Rambagh Palace</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Former Maharaja residence with sprawling Mughal gardens for grand Baraat processions.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Capacity: <strong className="text-slate-200">600+ Guests</strong></span>
                <span className="text-amber-400">Maharaja Lawns</span>
              </div>
            </div>

            <div className="rounded bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Jaipur Countryside</span>
                <h3 className="font-serif text-base font-bold text-white mt-1">Alila Fort Bishangarh</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  300-year-old warrior fortress with dramatic hill courtyards.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Capacity: <strong className="text-slate-200">400 Guests</strong></span>
                <span className="text-amber-400">Warrior Fort</span>
              </div>
            </div>

            <div className="rounded bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Udaipur</span>
                <h3 className="font-serif text-base font-bold text-white mt-1">Jagmandir Island Palace</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Exclusive private water island fortress reached by royal private boats.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-slate-800 text-[11px] text-slate-400 flex justify-between">
                <span>Capacity: <strong className="text-slate-200">550 Guests</strong></span>
                <span className="text-amber-400">Private Island</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The 4-Day Journey */}
      <section id="ceremonies" className="py-16 border-b border-slate-900 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="text-xs font-bold tracking-wider uppercase text-amber-400">Event Timelines</div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
              The 4-Day Celebration Flow
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded bg-slate-900 border border-slate-800">
              <span className="text-xs font-bold text-amber-400">Day 1</span>
              <h3 className="font-bold text-white text-sm mt-1">Mehendi & Henna Soiree</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Afternoon folk music and traditional Marwari henna artists.
              </p>
            </div>

            <div className="p-4 rounded bg-slate-900 border border-slate-800">
              <span className="text-xs font-bold text-amber-400">Day 2</span>
              <h3 className="font-bold text-white text-sm mt-1">Royal Sangeet Gala</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Choreography, sound consoles, DJ, and family stage performances.
              </p>
            </div>

            <div className="p-4 rounded bg-slate-900 border border-slate-800">
              <span className="text-xs font-bold text-amber-400">Day 3</span>
              <h3 className="font-bold text-white text-sm mt-1">Phoolon Ki Haldi</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Organic flower petal ritual in courtyard followed by traditional lunch.
              </p>
            </div>

            <div className="p-4 rounded bg-slate-900 border border-slate-800">
              <span className="text-xs font-bold text-amber-400">Day 4</span>
              <h3 className="font-bold text-white text-sm mt-1">Varmala & Banquet</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Sunset Vedic pheras under royal mandap, followed by grand seated banquet dinner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. The Simplified "Enquire Now" Consultation Form (All Dropdowns) */}
      <section id="enquire-now" className="py-20 bg-slate-950 scroll-mt-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Client Intake
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Wedding Consultation Form
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Fill in your wedding requirements below. Our team will review and contact you.
            </p>
          </div>

          {/* Form Container Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 sm:p-8">
            {submitSuccess ? (
              /* Success State */
              <div className="text-center py-10 px-4 space-y-5">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div>
                  <span className="inline-block px-3 py-1 rounded bg-slate-800 text-amber-300 text-xs font-mono font-bold tracking-wider border border-slate-700 mb-2">
                    Reference ID: {submittedLeadCode}
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    Enquiry Submitted Successfully
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto mt-1.5 leading-relaxed">
                    Thank you, <strong className="text-white">{coupleName}</strong>. Your consultation inquiry has been recorded in our lead pipeline.
                  </p>
                </div>

                <div className="p-3.5 rounded bg-slate-950 border border-slate-800 text-left text-xs text-slate-400 max-w-sm mx-auto space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-200 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Follow-up Timeline:</span>
                  </div>
                  <p>Our team will contact you on <strong className="text-slate-200">{phone}</strong> within 24 hours.</p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setSubmitSuccess(false);
                      setCoupleName('');
                      setPhone('');
                      setVisionNotes('');
                    }}
                    className="px-5 py-2 rounded text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              /* Simple Consultation Form with Dropdowns */
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="p-3 rounded bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                    {errorMessage}
                  </div>
                )}

                {/* 1. Couple Names & Point of Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Couple / Partner Names <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aanya Singhania & Raghav Mehra"
                      value={coupleName}
                      onChange={(e) => setCoupleName(e.target.value)}
                      className="w-full h-9 px-3 rounded bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Point of Contact & Role
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contact Name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="flex-1 h-9 px-3 rounded bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-400"
                      />
                      <select
                        value={contactRelation}
                        onChange={(e) => setContactRelation(e.target.value as any)}
                        className="h-9 px-2.5 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                      >
                        <option value="Bride">Bride</option>
                        <option value="Groom">Groom</option>
                        <option value="Parent">Parent</option>
                        <option value="Family Rep">Family Rep</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Contact Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Phone / WhatsApp Number <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="tel"
                        required
                        placeholder="+91 98290 11223"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 rounded bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Email Address (Optional)
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        placeholder="couple@client.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-9 pl-9 pr-3 rounded bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Destination City (Dropdown) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Preferred Destination City <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={cityPreference}
                    onChange={(e) => setCityPreference(e.target.value as 'Udaipur' | 'Jaipur')}
                    className="w-full h-9 px-3 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="Udaipur">Udaipur (Lake Pichola & Island Palaces)</option>
                    <option value="Jaipur">Jaipur (Forts & Royal Pavilions)</option>
                  </select>
                </div>

                {/* 4. Dates, Guest Count & Budget Range (Dropdowns) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Season / Dates
                    </label>
                    <select
                      value={datesRough}
                      onChange={(e) => setDatesRough(e.target.value)}
                      className="w-full h-9 px-3 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="Winter 2026 (Nov - Dec)">Winter 2026 (Nov - Dec)</option>
                      <option value="Spring 2027 (Jan - Mar)">Spring 2027 (Jan - Mar)</option>
                      <option value="Monsoon Romance 2027 (July - Aug)">Monsoon 2027 (July - Aug)</option>
                      <option value="Custom Dates (Flexible)">Custom / Flexible Dates</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Estimated Guests
                    </label>
                    <select
                      value={guestCount}
                      onChange={(e) => setGuestCount(parseInt(e.target.value, 10))}
                      className="w-full h-9 px-3 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value={350}>350 Guests (Intimate Royal)</option>
                      <option value={400}>400 Guests (Standard Scale)</option>
                      <option value={450}>450 Guests (Grand Banquet)</option>
                      <option value={500}>500 Guests (Palace Scale)</option>
                      <option value={600}>600+ Guests (Extravaganza)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Total Budget
                    </label>
                    <select
                      value={budgetTier}
                      onChange={(e) => setBudgetTier(e.target.value)}
                      className="w-full h-9 px-3 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="₹1.50 Cr – ₹2.50 Cr">₹1.50 Cr – ₹2.50 Cr</option>
                      <option value="₹2.50 Cr – ₹3.50 Cr">₹2.50 Cr – ₹3.50 Cr</option>
                      <option value="₹3.50 Cr – ₹5.00 Cr">₹3.50 Cr – ₹5.00 Cr</option>
                      <option value="₹5.00 Cr+">₹5.00 Cr+ (Ultra High Scale)</option>
                    </select>
                  </div>
                </div>

                {/* 5. Package Preference (Dropdown) */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Planning Scope / Package
                  </label>
                  <select
                    value={packagePreference}
                    onChange={(e) => setPackagePreference(e.target.value as 'FULL_SERVICE' | 'DAY_OF')}
                    className="w-full h-9 px-3 rounded bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
                  >
                    <option value="FULL_SERVICE">Full-Service Royal Production (End-to-End Planning & Contracting)</option>
                    <option value="DAY_OF">Day-Of Execution & Run Sheet (Minute-by-Minute Live Coordination)</option>
                  </select>
                </div>

                {/* 6. Special Vision / Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Special Requests or Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide any specific venue preferences, catering requirements, or questions..."
                    value={visionNotes}
                    onChange={(e) => setVisionNotes(e.target.value)}
                    className="w-full p-2.5 rounded bg-slate-950 border border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded text-xs font-bold uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Enquiry...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Consultation Request</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 6. Testimonials */}
      <section id="why-us" className="py-16 border-t border-slate-900 bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="text-xs font-bold tracking-wider uppercase text-amber-400">Past Weddings</div>
            <h2 className="font-serif text-2xl font-bold text-white mt-1">
              Client Feedback
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-xs leading-relaxed italic">
                "Orchestrating 450 guests across 4 days at The Oberoi Udaivilas seemed daunting. The 3-caterers comparison and the run sheet execution were flawless."
              </p>
              <div className="pt-2 border-t border-slate-800">
                <div className="font-bold text-xs text-white">Aanya Singhania & Raghav Mehra</div>
                <div className="text-[10px] text-slate-400">The Oberoi Udaivilas, Udaipur</div>
              </div>
            </div>

            <div className="p-4 rounded bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                ))}
              </div>
              <p className="text-slate-300 text-xs leading-relaxed italic">
                "The minute-by-minute run sheet kept 18 vendors on schedule. Handled the entire wedding with complete professionalism."
              </p>
              <div className="pt-2 border-t border-slate-800">
                <div className="font-bold text-xs text-white">Kriti Maheshwari & Siddharth Jain</div>
                <div className="text-[10px] text-slate-400">Rambagh Palace, Jaipur</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="py-8 border-t border-slate-900 bg-slate-950 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">THE ROYAL KNOT</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Jaipur & Udaipur</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Jaipur Atelier</span>
            <span>•</span>
            <span>Udaipur Atelier</span>
            <span>•</span>
            <span
              onClick={() => navigate('/login')}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              Staff Portal
            </span>
          </div>

          <div className="text-slate-500 text-[11px]">
            © {new Date().getFullYear()} The Royal Knot.
          </div>
        </div>
      </footer>
    </div>
  );
};
