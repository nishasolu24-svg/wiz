import React, { useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  ShieldCheck,
  Building2,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Lock,
  Bell,
  Calendar,
  Layers,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PRICING_PLANS, paymentService } from '../services/paymentService';
import { authService } from '../services/authService';
import { analyticsService } from '../services/analyticsService';
import { TeacherProfile, UserTier } from '../types';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTierChanged?: (tier: UserTier) => void;
  initialSelectedTier?: UserTier;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onTierChanged,
  initialSelectedTier,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [selectedPlanTier, setSelectedPlanTier] = useState<UserTier>(
    initialSelectedTier && initialSelectedTier !== 'free' ? initialSelectedTier : 'pro'
  );
  const [step, setStep] = useState<'plans' | 'coming_soon'>('plans');

  // Waitlist state
  const profile = authService.getProfile();
  const currentTier = authService.getUserTier();
  const [waitlistEmail, setWaitlistEmail] = useState(profile.email || '');
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPlan = (tier: UserTier) => {
    if (tier === 'free') {
      onClose();
      return;
    }
    setSelectedPlanTier(tier);
    setWaitlistSuccess(false);
    setWaitlistMessage(null);
    setStep('coming_soon');
  };

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes('@')) {
      setWaitlistMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmittingWaitlist(true);
    try {
      const res = await analyticsService.joinWaitlist(
        waitlistEmail,
        selectedPlanTier === 'school' ? 'school' : 'pro'
      );
      if (res.success) {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
        });
        setWaitlistSuccess(true);
        setWaitlistMessage(res.message);
      }
    } catch (err: any) {
      setWaitlistMessage('Could not register email. Please try again.');
    } finally {
      setIsSubmittingWaitlist(false);
    }
  };

  const selectedPlan = paymentService.getPlan(selectedPlanTier);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-violet-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-amber-300 border border-white/20 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-tight">
                  {step === 'coming_soon'
                    ? 'Paid Features Launching in 1 Week'
                    : 'Choose Your WizSheet AI Plan'}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-amber-950 uppercase tracking-wide">
                  Public Free Preview
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                {step === 'coming_soon'
                  ? 'All educators have free access during our preview launch. No payment required.'
                  : 'Start free today. Paid Pro & School plans unlock in 7 days with exclusive early bird savings.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* STEP 1: PLAN SELECTION */}
          {step === 'plans' && (
            <div className="space-y-6">
              {/* Public Free Week Notification Ribbon */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-center gap-2.5 text-amber-900 font-semibold">
                  <span className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 text-sm shadow-xs">
                    🚀
                  </span>
                  <span>
                    <strong className="font-bold text-amber-950">Free Launch Preview Active:</strong> All teachers can generate worksheets today on our Free Starter tier. Paid features unlock in 7 days with zero card info required today!
                  </span>
                </div>
                <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full bg-amber-200/70 text-amber-900 text-[10px] font-black uppercase tracking-wider shrink-0">
                  7 Days to Paid Launch
                </span>
              </div>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-3">
                <span className={`text-xs font-bold ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-500'}`}>
                  Monthly Billing
                </span>
                <button
                  type="button"
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
                  className="w-13 h-7 bg-violet-600 rounded-full p-1 transition-colors relative"
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold ${billingCycle === 'annual' ? 'text-slate-900' : 'text-slate-500'}`}>
                    Annual Billing
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 animate-pulse">
                    Save 20%
                  </span>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {PRICING_PLANS.map((plan) => {
                  const isCurrent = currentTier === plan.tier;
                  const isPro = plan.tier === 'pro';
                  const isSchool = plan.tier === 'school';
                  const price =
                    billingCycle === 'annual'
                      ? plan.priceAnnual === 0
                        ? 0
                        : plan.priceAnnual
                      : plan.priceMonthly;

                  return (
                    <div
                      key={plan.id}
                      className={`rounded-2xl p-5 border transition-all flex flex-col justify-between relative ${
                        plan.popular
                          ? 'border-violet-500 ring-2 ring-violet-500/20 bg-gradient-to-b from-violet-50/50 to-white shadow-lg'
                          : isSchool
                          ? 'border-indigo-300 bg-gradient-to-b from-indigo-50/30 to-white shadow-sm'
                          : 'border-slate-200 bg-white shadow-xs'
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                          Most Popular with Teachers
                        </div>
                      )}

                      {isSchool && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">
                          School & District Teams
                        </div>
                      )}

                      <div>
                        {/* Plan Name & Tagline */}
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-base font-black text-slate-900">{plan.name}</h3>
                          {plan.tier === 'free' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                              Active Now
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>In 1 Week</span>
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 min-h-[30px]">{plan.tagline}</p>

                        {/* Pricing */}
                        <div className="my-4 pb-4 border-b border-slate-100">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900">${price}</span>
                            <span className="text-xs font-semibold text-slate-500">
                              {plan.priceMonthly === 0 ? 'forever' : '/ month'}
                            </span>
                          </div>
                          {billingCycle === 'annual' && plan.annualBilledTotal > 0 && (
                            <p className="text-[10px] text-violet-700 font-bold mt-0.5">
                              Billed annually (${plan.annualBilledTotal}/yr)
                            </p>
                          )}
                        </div>

                        {/* Features List */}
                        <div className="space-y-2 text-xs">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                            Included Capabilities:
                          </span>
                          {plan.features.map((feat, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-slate-700">
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span className="text-[11px] leading-tight">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        {plan.tier === 'free' ? (
                          <button
                            type="button"
                            onClick={() => handleSelectPlan('free')}
                            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm active:scale-98 flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Continue on Free Plan</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectPlan(plan.tier)}
                            className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-98 ${
                              plan.popular
                                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-violet-200'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
                            }`}
                          >
                            <Bell className="w-3.5 h-3.5 text-amber-300" />
                            <span>Coming Soon • Join Waitlist</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trust Badges */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-around gap-4 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Free core generations every single day</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span>Zero payment info collected during free preview</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-violet-600" />
                  <span>Paid tier launch date: In 7 days</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COMING SOON SCREEN (BLOCKS ALL PAYMENT INPUTS) */}
          {step === 'coming_soon' && selectedPlan && (
            <div className="max-w-xl mx-auto space-y-6 py-2">
              <button
                type="button"
                onClick={() => setStep('plans')}
                className="text-xs font-bold text-violet-700 hover:text-violet-900 flex items-center gap-1.5 transition-colors"
              >
                ← Back to plan comparison
              </button>

              {/* Coming Soon Hero Banner */}
              <div className="p-6 bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50 rounded-3xl border border-violet-200 text-center space-y-3 relative overflow-hidden shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-violet-200">
                  <Clock className="w-7 h-7 text-amber-300" />
                </div>

                <div>
                  <span className="px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-400 text-amber-950 inline-block mb-1 shadow-2xs">
                    🚀 Launching in 1 Week
                  </span>
                  <h3 className="text-xl font-black text-slate-900">
                    {selectedPlan.name} is Launching Next Week!
                  </h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                    We are currently conducting our open teacher preview so every educator can test the AI generator completely free. Payment processing is disabled until official launch.
                  </p>
                </div>

                {/* Plan Highlights */}
                <div className="pt-2 flex items-center justify-center flex-wrap gap-4 text-xs font-bold text-violet-900">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Unlimited Worksheets</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Unlimited Book PDFs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>School Library Sharing</span>
                  </div>
                </div>
              </div>

              {/* Secure Lock Badge Notice (Blocking Payment Inputs) */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-xs text-emerald-900">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="font-bold text-emerald-950">Payment Gateway Inactive & Protected</h5>
                  <p className="text-[11px] text-emerald-800 mt-0.5 leading-normal">
                    To safeguard educators, credit card and billing fields are strictly blocked during this launch preview week. You will never be charged or asked for payment information today.
                  </p>
                </div>
              </div>

              {/* Early-Bird Waitlist Notification Box */}
              <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Get Notified When Paid Tiers Open
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Join the educator waitlist to receive an instant notification and an exclusive <strong>20% early bird coupon</strong>.
                    </p>
                  </div>
                </div>

                {waitlistSuccess ? (
                  <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl text-center space-y-1.5 animate-in fade-in">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                    <p className="text-xs font-bold text-violet-950">
                      You're on the early bird VIP list!
                    </p>
                    <p className="text-[11px] text-violet-700">
                      {waitlistMessage || "We'll email you the moment paid tiers launch with your 20% discount code."}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleJoinWaitlist} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Teacher Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="teacher@school.edu"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition-all"
                      />
                    </div>

                    {waitlistMessage && !waitlistSuccess && (
                      <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{waitlistMessage}</span>
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmittingWaitlist}
                      className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-violet-200 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                    >
                      <Bell className="w-4 h-4 text-amber-300" />
                      <span>{isSubmittingWaitlist ? 'Registering...' : 'Notify Me & Lock In 20% Discount'}</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Action: Continue Generating Free */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2"
                >
                  <span>Start Generating on Free Starter Plan</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
