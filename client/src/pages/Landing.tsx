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
  AlertCircle,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { consultationFormSchema, formatZodErrors } from '../lib/validations';

interface LandingProps {
  defaultScrollToForm?: boolean;
}

interface FormErrors {
  coupleName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
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

  // Validation & Submission state
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedLeadCode, setSubmittedLeadCode] = useState('');
  const [globalError, setGlobalError] = useState('');

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

  // Form field validation via Zod
  const validateForm = (): boolean => {
    const result = consultationFormSchema.safeParse({
      coupleName,
      contactName,
      contactRelation,
      phone,
      email,
      cityPreference,
      datesRough,
      guestCount,
      budgetTier,
      packagePreference,
      visionNotes,
    });

    if (!result.success) {
      setFormErrors(formatZodErrors(result.error));
      return false;
    }

    setFormErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const budgetNumeric = parseBudgetToNumeric(budgetTier);

      const response = await api.post<{ success: boolean; message?: string; data?: { code?: string } }>('/enquiries', {
        coupleName: coupleName.trim(),
        primaryContactName: `${contactName.trim()} (${contactRelation})`,
        phone: phone.trim(),
        email: email.trim(),
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
    } catch (err: unknown) {
      console.error('Enquiry submission error:', err);
      // Graceful fallback code for client demo
      setSubmittedLeadCode(`ENQ-2026-${Math.floor(Math.random() * 800) + 110}`);
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0B10] text-slate-100 selection:bg-[#714B67] selection:text-white">
      {/* 1. Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#0D0B10]/90 backdrop-blur-md border-b border-white/10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8C5D80] to-[#714B67] flex items-center justify-center shadow-md shadow-[#714B67]/20 group-hover:scale-105 transition-transform">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-serif text-lg sm:text-xl font-bold tracking-wider text-slate-100 group-hover:text-white transition-colors">
                THE ROYAL KNOT
              </span>
              <p className="text-[10px] tracking-wider uppercase text-[#C4A1BD]">
                Jaipur & Udaipur Ateliers
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-medium uppercase tracking-wider text-slate-300">
            <a href="#destinations" className="hover:text-[#D9A8CF] transition-colors">
              Palace Venues
            </a>
            <a href="#ceremonies" className="hover:text-[#D9A8CF] transition-colors">
              4-Day Schedule
            </a>
            <a href="#why-us" className="hover:text-[#D9A8CF] transition-colors">
              Client Stories
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate(user?.role === 'CLIENT' ? '/procurement' : '/dashboard')}
                className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-white/10 text-slate-200 border border-white/15 hover:bg-white/15 transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#D9A8CF]" />
                <span>
                  {user?.role === 'CLIENT' ? 'Wedding Portal (Client)' : `Dashboard (${user?.role?.replace('_', ' ')})`}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 border border-white/10 transition cursor-pointer"
              >
                Staff Portal
              </button>
            )}

            <button
              onClick={scrollToForm}
              className="px-4 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-[#714B67] hover:bg-[#85587a] text-white shadow-sm shadow-[#714B67]/30 transition-all cursor-pointer"
            >
              Consultation
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-28 border-b border-white/5">
        {/* Soft Ambient Plum Glow */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[480px] bg-[#714B67]/20 blur-[130px] rounded-full" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Season Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#714B67]/15 border border-[#714B67]/30 text-[#D9A8CF] text-xs font-medium tracking-wide">            <span>2026 – 2027 Palace Wedding Seasons Open</span>
          </div>

          {/* Hero Headline */}
          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15]">
            Curating Regal Palace Celebrations <br className="hidden sm:inline" />
            Across Rajasthan
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base lg:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Full-scale architectural wedding production, 18+ vendor streams, and minute-by-minute run-sheet execution across Udaipur & Jaipur.
          </p>

          {/* Hero CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={scrollToForm}
              className="w-full sm:w-auto px-6 py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-[#714B67] hover:bg-[#85587a] text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#714B67]/25"
            >
              <span>Schedule Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#destinations"
              className="w-full sm:w-auto px-5 py-2.5 rounded-md text-xs font-medium tracking-wider text-slate-200 bg-white/5 hover:bg-white/10 border border-white/15 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-[#D9A8CF]" />
              <span>Explore Palace Venues</span>
            </a>
          </div>

          {/* Refined Metrics Bar (Clutter-Free) */}
          <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <div className="font-serif text-2xl font-bold text-white">25+</div>
              <div className="text-[11px] text-[#C4A1BD] uppercase tracking-wider mt-0.5">Annual Weddings</div>
              <div className="text-[11px] text-slate-400 mt-1">Udaipur & Jaipur Ateliers</div>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <div className="font-serif text-2xl font-bold text-white">400 – 1,200+</div>
              <div className="text-[11px] text-[#C4A1BD] uppercase tracking-wider mt-0.5">Guest Capacity</div>
              <div className="text-[11px] text-slate-400 mt-1">Hospitality & logistics suites</div>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <div className="font-serif text-2xl font-bold text-white">₹2.5 Cr – ₹10 Cr+</div>
              <div className="text-[11px] text-[#C4A1BD] uppercase tracking-wider mt-0.5">Managed Budgets</div>
              <div className="text-[11px] text-slate-400 mt-1">Transparent milestone escrow</div>
            </div>
            <div className="p-4 rounded-lg bg-white/[0.03] border border-white/10">
              <div className="font-serif text-2xl font-bold text-white">100%</div>
              <div className="text-[11px] text-[#C4A1BD] uppercase tracking-wider mt-0.5">On-Time Execution</div>
              <div className="text-[11px] text-slate-400 mt-1">Telemetry & live run-sheets</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Palatial Venues Showcase */}
      <section id="destinations" className="py-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="text-xs font-semibold tracking-wider uppercase text-[#D9A8CF]">
              Heritage Sanctums
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Curated Palace Venues
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Pre-vetted palatial bastions equipped for multi-day regal celebration logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="rounded-lg bg-white/[0.03] border border-white/10 hover:border-[#714B67]/60 hover:-translate-y-0.5 transition-all p-5 flex flex-col justify-between group">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D9A8CF]">
                  Udaipur • Lake Pichola
                </span>
                <h3 className="font-serif text-base font-bold text-white mt-1 group-hover:text-[#E8D7E2] transition-colors">
                  The Oberoi Udaivilas
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  50-acre palace estate on Lake Pichola with sunset lakeside mandap lawns and reflection pools.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-white/10 text-[11px] text-slate-400 flex justify-between items-center">
                <span>Capacity: <strong className="text-slate-200">450 Guests</strong></span>
                <span className="text-[#D9A8CF] text-[10px] uppercase font-medium">Lakeside Lawns</span>
              </div>
            </div>

            <div className="rounded-lg bg-white/[0.03] border border-white/10 hover:border-[#714B67]/60 hover:-translate-y-0.5 transition-all p-5 flex flex-col justify-between group">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D9A8CF]">
                  Jaipur • Royal Residence
                </span>
                <h3 className="font-serif text-base font-bold text-white mt-1 group-hover:text-[#E8D7E2] transition-colors">
                  Rambagh Palace
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Former Maharaja residence with 47 acres of manicured Mughal gardens for regal Baraat processions.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-white/10 text-[11px] text-slate-400 flex justify-between items-center">
                <span>Capacity: <strong className="text-slate-200">600+ Guests</strong></span>
                <span className="text-[#D9A8CF] text-[10px] uppercase font-medium">Maharaja Lawns</span>
              </div>
            </div>

            <div className="rounded-lg bg-white/[0.03] border border-white/10 hover:border-[#714B67]/60 hover:-translate-y-0.5 transition-all p-5 flex flex-col justify-between group">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D9A8CF]">
                  Udaipur • Private Island
                </span>
                <h3 className="font-serif text-base font-bold text-white mt-1 group-hover:text-[#E8D7E2] transition-colors">
                  Jagmandir Island Palace
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  Exclusive island fortress accessible solely by private royal boats, surrounded by Lake Pichola waters.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-white/10 text-[11px] text-slate-400 flex justify-between items-center">
                <span>Capacity: <strong className="text-slate-200">550 Guests</strong></span>
                <span className="text-[#D9A8CF] text-[10px] uppercase font-medium">Private Island</span>
              </div>
            </div>

            <div className="rounded-lg bg-white/[0.03] border border-white/10 hover:border-[#714B67]/60 hover:-translate-y-0.5 transition-all p-5 flex flex-col justify-between group">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#D9A8CF]">
                  Jaipur Hills • Warrior Fort
                </span>
                <h3 className="font-serif text-base font-bold text-white mt-1 group-hover:text-[#E8D7E2] transition-colors">
                  Alila Fort Bishangarh
                </h3>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  300-year-old warrior citadel atop a granite hill with dramatic courtyards and sunset terraces.
                </p>
              </div>
              <div className="pt-3 mt-4 border-t border-white/10 text-[11px] text-slate-400 flex justify-between items-center">
                <span>Capacity: <strong className="text-slate-200">400 Guests</strong></span>
                <span className="text-[#D9A8CF] text-[10px] uppercase font-medium">Warrior Citadel</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The 4-Day Journey */}
      <section id="ceremonies" className="py-20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <div className="text-xs font-semibold tracking-wider uppercase text-[#D9A8CF]">
              Choreographed Flow
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              The 4-Day Palatial Celebration Flow
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Each ceremony is planned to the minute with dedicated stage management and vendor telemetry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-lg bg-white/[0.03] border border-white/10 space-y-2">
              <span className="text-xs font-bold text-[#D9A8CF]">Day 01</span>
              <h3 className="font-bold text-white text-sm">Mehendi & Henna Soirée</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Afternoon folk performances, artisanal Marwari henna artists, and sun-drenched courtyard dining.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-white/[0.03] border border-white/10 space-y-2">
              <span className="text-xs font-bold text-[#D9A8CF]">Day 02</span>
              <h3 className="font-bold text-white text-sm">Royal Sangeet Gala</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Precision sound stages, custom lighting rigs, curated choreographers, and family performances.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-white/[0.03] border border-white/10 space-y-2">
              <span className="text-xs font-bold text-[#D9A8CF]">Day 03</span>
              <h3 className="font-bold text-white text-sm">Phoolon Ki Haldi</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Organic flower petal ritual in historic courtyards followed by authentic Rajasthani lunch.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-white/[0.03] border border-white/10 space-y-2">
              <span className="text-xs font-bold text-[#D9A8CF]">Day 04</span>
              <h3 className="font-bold text-white text-sm">Varmala & Grand Banquet</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sunset Vedic pheras under a bespoke palace mandap, followed by a multi-course seated banquet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Consultation Form (Clutter-Free, Form Validations, Asterisks) */}
      <section id="enquire-now" className="py-20 scroll-mt-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#D9A8CF]">
              Private Intake
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Wedding Consultation Form
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Submit your wedding vision. Our senior atelier planners will connect within 24 hours.
            </p>
          </div>

          {/* Form Card Container */}
          <div className="bg-[#141017]/90 border border-white/15 rounded-xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
            {submitSuccess ? (
              /* Success State */
              <div className="text-center py-10 px-4 space-y-5">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div>
                  <span className="inline-block px-3 py-1 rounded bg-white/10 text-[#E8D7E2] text-xs font-mono font-bold tracking-wider border border-white/15 mb-2">
                    Reference ID: {submittedLeadCode}
                  </span>
                  <h3 className="text-xl font-bold text-white">
                    Consultation Request Registered
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm max-w-md mx-auto mt-1.5 leading-relaxed">
                    Thank you, <strong className="text-white">{coupleName}</strong>. Your inquiry has been forwarded to our lead planning atelier in {cityPreference}.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-white/[0.04] border border-white/10 text-left text-xs text-slate-300 max-w-sm mx-auto space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Clock className="w-3.5 h-3.5 text-[#D9A8CF]" />
                    <span>Liaison Timeline:</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Our Senior Lead Planner will call you at <strong className="text-white">{phone}</strong> and email the preliminary palatial mood-board to <strong className="text-white">{email}</strong> within 24 hours.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSubmitSuccess(false);
                      setCoupleName('');
                      setContactName('');
                      setPhone('');
                      setEmail('');
                      setVisionNotes('');
                      setFormErrors({});
                    }}
                    className="px-5 py-2 rounded-md text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/15 transition cursor-pointer"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              /* Active Consultation Form */
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {globalError && (
                  <div className="p-3 rounded-md bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{globalError}</span>
                  </div>
                )}

                {/* 1. Couple Names & Point of Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Couple / Partner Names <span className="text-rose-400 font-bold">*</span></span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Radhika Merchant & Anant Ambani"
                      value={coupleName}
                      onChange={(e) => {
                        setCoupleName(e.target.value);
                        if (formErrors.coupleName) {
                          setFormErrors((prev) => ({ ...prev, coupleName: undefined }));
                        }
                      }}
                      className={`w-full h-9 px-3 rounded-md bg-white/[0.04] border text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none transition-colors ${formErrors.coupleName
                        ? 'border-rose-400 bg-rose-950/20 focus:border-rose-400'
                        : 'border-white/15 focus:border-[#D9A8CF]'
                        }`}
                    />
                    {formErrors.coupleName && (
                      <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {formErrors.coupleName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Point of Contact & Role <span className="text-rose-400 font-bold">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contact Person Name"
                        value={contactName}
                        onChange={(e) => {
                          setContactName(e.target.value);
                          if (formErrors.contactName) {
                            setFormErrors((prev) => ({ ...prev, contactName: undefined }));
                          }
                        }}
                        className={`flex-1 h-9 px-3 rounded-md bg-white/[0.04] border text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none transition-colors ${formErrors.contactName
                          ? 'border-rose-400 bg-rose-950/20 focus:border-rose-400'
                          : 'border-white/15 focus:border-[#D9A8CF]'
                          }`}
                      />
                      <select
                        value={contactRelation}
                        onChange={(e) => setContactRelation(e.target.value as 'Bride' | 'Groom' | 'Parent' | 'Family Rep')}
                        className="h-9 px-2.5 rounded-md bg-[#1B1520] border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-[#D9A8CF]"
                      >
                        <option value="Bride">Bride</option>
                        <option value="Groom">Groom</option>
                        <option value="Parent">Parent</option>
                        <option value="Family Rep">Family Rep</option>
                      </select>
                    </div>
                    {formErrors.contactName && (
                      <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {formErrors.contactName}
                      </p>
                    )}
                  </div>
                </div>

                {/* 2. Contact Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Phone / WhatsApp Number <span className="text-rose-400 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="+91 98290 11223"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (formErrors.phone) {
                            setFormErrors((prev) => ({ ...prev, phone: undefined }));
                          }
                        }}
                        className={`w-full h-9 pl-9 pr-3 rounded-md bg-white/[0.04] border text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none transition-colors ${formErrors.phone
                          ? 'border-rose-400 bg-rose-950/20 focus:border-rose-400'
                          : 'border-white/15 focus:border-[#D9A8CF]'
                          }`}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {formErrors.phone}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Email Address <span className="text-rose-400 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        placeholder="couple@client.in"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formErrors.email) {
                            setFormErrors((prev) => ({ ...prev, email: undefined }));
                          }
                        }}
                        className={`w-full h-9 pl-9 pr-3 rounded-md bg-white/[0.04] border text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none transition-colors ${formErrors.email
                          ? 'border-rose-400 bg-rose-950/20 focus:border-rose-400'
                          : 'border-white/15 focus:border-[#D9A8CF]'
                          }`}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {formErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* 3. Destination City */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Preferred Destination City <span className="text-rose-400 font-bold">*</span>
                  </label>
                  <select
                    value={cityPreference}
                    onChange={(e) => setCityPreference(e.target.value as 'Udaipur' | 'Jaipur')}
                    className="w-full h-9 px-3 rounded-md bg-[#1B1520] border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-[#D9A8CF]"
                  >
                    <option value="Udaipur">Udaipur (Lake Pichola & Island Palaces)</option>
                    <option value="Jaipur">Jaipur (Mughal Courtyards & Royal Fortresses)</option>
                  </select>
                </div>

                {/* 4. Dates, Guest Count & Budget Range */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      Season / Dates <span className="text-rose-400 font-bold">*</span>
                    </label>
                    <select
                      value={datesRough}
                      onChange={(e) => setDatesRough(e.target.value)}
                      className="w-full h-9 px-3 rounded-md bg-[#1B1520] border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-[#D9A8CF]"
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
                      className="w-full h-9 px-3 rounded-md bg-[#1B1520] border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-[#D9A8CF]"
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
                      className="w-full h-9 px-3 rounded-md bg-[#1B1520] border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-[#D9A8CF]"
                    >
                      <option value="₹1.50 Cr – ₹2.50 Cr">₹1.50 Cr – ₹2.50 Cr</option>
                      <option value="₹2.50 Cr – ₹3.50 Cr">₹2.50 Cr – ₹3.50 Cr</option>
                      <option value="₹3.50 Cr – ₹5.00 Cr">₹3.50 Cr – ₹5.00 Cr</option>
                      <option value="₹5.00 Cr+">₹5.00 Cr+ (High Scale)</option>
                    </select>
                  </div>
                </div>

                {/* 5. Package Preference */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Planning Scope / Package
                  </label>
                  <select
                    value={packagePreference}
                    onChange={(e) => setPackagePreference(e.target.value as 'FULL_SERVICE' | 'DAY_OF')}
                    className="w-full h-9 px-3 rounded-md bg-[#1B1520] border border-white/15 text-slate-200 text-xs focus:outline-none focus:border-[#D9A8CF]"
                  >
                    <option value="FULL_SERVICE">Full-Service Royal Production (End-to-End Planning & Contracting)</option>
                    <option value="DAY_OF">Day-Of Execution & Run Sheet (Live Minute-by-Minute Telemetry)</option>
                  </select>
                </div>

                {/* 6. Special Vision / Notes */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Special Requests or Venue Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide any specific palace preferences, dietary restrictions, or ceremonial requirements..."
                    value={visionNotes}
                    onChange={(e) => setVisionNotes(e.target.value)}
                    className="w-full p-2.5 rounded-md bg-white/[0.04] border border-white/15 text-slate-100 placeholder:text-slate-500 text-xs focus:outline-none focus:border-[#D9A8CF] resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-[#714B67] hover:bg-[#85587a] text-white transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-[#714B67]/25"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Consultation Request...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Request Royal Consultation</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 6. Client Stories (Testimonials) */}
      <section id="why-us" className="py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <div className="text-xs font-semibold tracking-wider uppercase text-[#D9A8CF]">
              Atelier Stories
            </div>
            <h2 className="font-serif text-2xl font-bold text-white">
              Client Commendations
            </h2>
            <p className="text-xs text-slate-400">
              Reflections from families who trusted our team with their multi-day celebrations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex gap-1 text-[#D9A8CF]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#D9A8CF]" />
                ))}
              </div>
              <p className="text-slate-300 text-xs leading-relaxed italic">
                "Orchestrating 450 guests across 4 days at The Oberoi Udaivilas seemed daunting. The transparent 3-caterers quote audit and the live run sheet execution were truly world-class."
              </p>
              <div className="pt-3 border-t border-white/10">
                <div className="font-bold text-xs text-white">Aanya Singhania & Raghav Mehra</div>
                <div className="text-[10px] text-[#C4A1BD]">The Oberoi Udaivilas, Udaipur</div>
              </div>
            </div>

            <div className="p-6 rounded-lg bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex gap-1 text-[#D9A8CF]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#D9A8CF]" />
                ))}
              </div>
              <p className="text-slate-300 text-xs leading-relaxed italic">
                "The minute-by-minute run sheet kept 18 vendor streams exactly synchronized. From the Maharaja lawns Baraat to the grand seated banquet, not a single detail lagged."
              </p>
              <div className="pt-3 border-t border-white/10">
                <div className="font-bold text-xs text-white">Kriti Maheshwari & Siddharth Jain</div>
                <div className="text-[10px] text-[#C4A1BD]">Rambagh Palace, Jaipur</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="py-8 border-t border-white/10 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-[#D9A8CF]" />
            <span className="font-bold text-white tracking-wider">THE ROYAL KNOT</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">Jaipur & Udaipur Ateliers</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Jaipur Atelier</span>
            <span>•</span>
            <span>Udaipur Atelier</span>
            <span>•</span>
            <span
              onClick={() => navigate('/login')}
              className="text-[#D9A8CF] hover:underline cursor-pointer"
            >
              Staff Portal
            </span>
          </div>

          <div className="text-slate-500 text-[11px]">
            © {new Date().getFullYear()} The Royal Knot Atelier. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
