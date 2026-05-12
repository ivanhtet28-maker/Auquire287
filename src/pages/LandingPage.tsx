import { useConvexAuth } from "convex/react";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronDown,
  Clock,
  Crosshair,
  FileText,
  Menu,
  MessageSquare,
  Search,
  Send,
  Shield,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

/* ─── agent data ─── */
const agents = [
  {
    name: "Hunter",
    icon: Crosshair,
    accent: "bg-sky-500",
    lightBg: "bg-sky-50",
    textColor: "text-sky-600",
    desc: "Scans Carsales, Gumtree & Facebook Marketplace 24/7. Finds private-party vehicles matching your buy box, scores every deal, and flags the best buys before your competition sees them.",
    stat: "2,100+",
    statLabel: "listings scanned/month",
  },
  {
    name: "Lister",
    icon: BarChart3,
    accent: "bg-amber-500",
    lightBg: "bg-amber-50",
    textColor: "text-amber-600",
    desc: "Audits your Carsales listings against live market comps. Identifies mispriced stock, stale listings, and tells you exactly what to reprice — and by how much.",
    stat: "24%",
    statLabel: "higher gross per unit",
  },
  {
    name: "Responder",
    icon: MessageSquare,
    accent: "bg-violet-500",
    lightBg: "bg-violet-50",
    textColor: "text-violet-600",
    desc: "Drafts personalised replies to every inbound enquiry within 60 seconds. No more missed leads. No more 7-day response gaps. Three variants per reply, plus a follow-up nudge.",
    stat: "<60s",
    statLabel: "average response time",
  },
  {
    name: "Scout",
    icon: Search,
    accent: "bg-rose-500",
    lightBg: "bg-rose-50",
    textColor: "text-rose-600",
    desc: "Deep-dives into any vehicle. Pulls market comps, price history, PPSR risk factors, and estimated reconditioning cost — returns a one-page intel brief.",
    stat: "100%",
    statLabel: "market coverage",
  },
  {
    name: "Briefer",
    icon: FileText,
    accent: "bg-teal-500",
    lightBg: "bg-teal-50",
    textColor: "text-teal-600",
    desc: "Generates a 6 AM morning brief: overnight market moves, new high-score listings, follow-up reminders, and a daily focus list for your team.",
    stat: "6 AM",
    statLabel: "daily brief delivered",
  },
  {
    name: "Closer",
    icon: Send,
    accent: "bg-indigo-500",
    lightBg: "bg-indigo-50",
    textColor: "text-indigo-600",
    desc: "Drafts first-contact SMS and email to private sellers. Personalised, non-pushy messages that convert private sellers into appointments.",
    stat: "3×",
    statLabel: "more appointments booked",
  },
];

const stats = [
  { value: "$0", label: "Per-car acquisition fees" },
  { value: "2,000+", label: "Local listings scanned / month" },
  { value: "33%", label: "Faster inventory turn" },
  { value: "24%", label: "Higher gross per unit" },
];

const faqs = [
  {
    q: "How does Auquire find private-party listings?",
    a: "Our Hunter agent continuously monitors Carsales, Gumtree, and Facebook Marketplace. It cross-references every listing against your buy box criteria and returns only the vehicles that match — scored and ranked.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. Auquire is a web app — log in from any browser. Your agents run in the cloud 24/7, no desktop software or extensions required.",
  },
  {
    q: "What's the difference between Auquire and auction platforms?",
    a: "Auctions charge $300–$800 per car in buyer fees and you're competing with every dealer in the country. Auquire finds private-party cars in your local market at wholesale-equivalent prices — $0 per-car fees.",
  },
  {
    q: "How long before I see results?",
    a: "Most dealers see actionable leads within the first 24 hours. Set your buy boxes, and Hunter starts scanning immediately.",
  },
  {
    q: "Can I customise what the agents look for?",
    a: "Absolutely. Buy boxes let you dial in make, model, year range, price ceiling, odometer limit, state, and more. You can run multiple buy boxes simultaneously.",
  },
];

const pricing = [
  {
    name: "Starter",
    price: "$499",
    period: "/mo",
    desc: "Perfect for independent dealers getting started with private-party acquisition.",
    features: [
      "2 buy boxes",
      "Hunter + Scout agents",
      "500 listings scanned/month",
      "Email support",
      "1 user seat",
    ],
    cta: "Start Free Trial",
    featured: false,
  },
  {
    name: "Growth",
    price: "$999",
    period: "/mo",
    desc: "For growing dealerships that want the full AI acquisition team.",
    features: [
      "Unlimited buy boxes",
      "All 6 AI agents",
      "2,000+ listings scanned/month",
      "Priority support",
      "5 user seats",
      "Morning briefing",
      "Auto-responder",
    ],
    cta: "Start Free Trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Multi-rooftop groups with custom integration and onboarding needs.",
    features: [
      "Everything in Growth",
      "Unlimited seats",
      "DMS integration",
      "Dedicated success manager",
      "Custom agent tuning",
      "API access",
    ],
    cta: "Contact Sales",
    featured: false,
  },
];

export default function LandingPage() {
  const { isAuthenticated } = useConvexAuth();
  const [activeAgent, setActiveAgent] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased">
      {/* ═══════ NAVBAR ═══════ */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
              <Zap className="w-5 h-5 text-sky-400" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Auquire
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">
              How It Works
            </a>
            <a href="#agents" className="hover:text-slate-900 transition-colors">
              Agents
            </a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-slate-900 transition-colors">
              FAQ
            </a>
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="default" className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" className="rounded-full border-slate-300 text-slate-700 hover:bg-slate-50 px-6">
                    Login
                  </Button>
                </Link>
                <Link to="/demo">
                  <Button className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-6">
                    Get a Demo <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden text-slate-700"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileMenu && (
          <div className="md:hidden border-t border-slate-100 bg-white px-6 py-4 space-y-4">
            <a href="#how-it-works" className="block text-sm font-medium text-slate-600">How It Works</a>
            <a href="#agents" className="block text-sm font-medium text-slate-600">Agents</a>
            <a href="#pricing" className="block text-sm font-medium text-slate-600">Pricing</a>
            <a href="#faq" className="block text-sm font-medium text-slate-600">FAQ</a>
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1">
                <Button variant="outline" className="w-full rounded-full">Login</Button>
              </Link>
              <Link to="/demo" className="flex-1">
                <Button className="w-full bg-slate-900 text-white rounded-full">Get a Demo</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ═══════ HERO ═══════ */}
      <section className="relative overflow-hidden">
        {/* Subtle gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-50/60 via-white to-white" />

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm text-sm font-medium text-slate-600 mb-8">
            <Bot className="w-4 h-4 text-sky-500" />
            Australia's First Private Party Acquisition System
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] text-slate-900">
            Buy cars from{" "}
            <br className="hidden sm:block" />
            private sellers{" "}
            <span className="text-sky-500">at scale</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Transform your dealership's used car department by unlocking 40% of
            your market's potential customers, inventory, and gross.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/demo">
              <Button
                size="lg"
                className="bg-slate-900 hover:bg-slate-800 text-white rounded-full px-8 py-6 text-base font-semibold shadow-lg shadow-slate-900/10"
              >
                Get a Demo <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 text-base font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                See How It Works
              </Button>
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-sky-500" /> $0 per-car fees
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-sky-500" /> Australian-built
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-sky-500" /> Works while you sleep
            </span>
          </div>
        </div>

        {/* Product mockup */}
        <div className="relative max-w-6xl mx-auto px-6 pb-20">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl shadow-slate-200/50 overflow-hidden">
            {/* Fake browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-100 border-b border-slate-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-white border border-slate-200 text-xs text-slate-400 font-mono">
                  app.auquire.com.au
                </div>
              </div>
            </div>

            {/* Dashboard mockup content */}
            <div className="p-6 bg-white">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-sky-400" />
                  </div>
                  <span className="font-bold text-slate-900">Auquire</span>
                </div>
                <div className="flex items-center gap-6 text-sm font-medium text-slate-500">
                  <span className="flex items-center gap-2 text-sky-600 border-b-2 border-sky-500 pb-1">
                    <Crosshair className="w-4 h-4" /> Fresh Listings{" "}
                    <span className="bg-sky-100 text-sky-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      +14
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Appointments{" "}
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      8
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <Check className="w-4 h-4" /> Purchased{" "}
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                      3
                    </span>
                  </span>
                </div>
              </div>

              {/* Cards row */}
              <div className="grid grid-cols-3 gap-4">
                {/* Card 1 */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Match
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      Score 9.2
                    </span>
                  </div>
                  <div className="h-24 bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-300">
                    <div className="text-center">
                      <div className="w-16 h-10 bg-slate-200 rounded mx-auto mb-1" />
                      <div className="text-[10px]">Vehicle Photo</div>
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-slate-900">2022 Toyota HiLux SR5</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">$48,500</p>
                  <p className="text-xs text-emerald-600 font-medium">↓ $3,200 below market</p>
                </div>
                {/* Card 2 */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Match
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      Score 8.7
                    </span>
                  </div>
                  <div className="h-24 bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-300">
                    <div className="text-center">
                      <div className="w-16 h-10 bg-slate-200 rounded mx-auto mb-1" />
                      <div className="text-[10px]">Vehicle Photo</div>
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-slate-900">2021 Mazda CX-5 Akera</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">$36,900</p>
                  <p className="text-xs text-emerald-600 font-medium">↓ $2,100 below market</p>
                </div>
                {/* Card 3 */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded-full flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" /> New Message
                    </span>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                      Score 7.9
                    </span>
                  </div>
                  <div className="h-24 bg-slate-100 rounded-lg mb-3 flex items-center justify-center text-slate-300">
                    <div className="text-center">
                      <div className="w-16 h-10 bg-slate-200 rounded mx-auto mb-1" />
                      <div className="text-[10px]">Vehicle Photo</div>
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-slate-900">2023 Ford Ranger XLT</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">$52,000</p>
                  <p className="text-xs text-emerald-600 font-medium">↓ $1,800 below market</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STATS STRIP ═══════ */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-extrabold text-sky-500">
                {s.value}
              </p>
              <p className="mt-1 text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm font-semibold tracking-widest text-slate-400 uppercase mb-4">
            The Future of Vehicle Acquisition
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-center text-slate-900 leading-tight">
            Solving the #1{" "}
            <br className="hidden sm:block" />
            Problem for Dealers
          </h2>

          {/* Problem / Solution cards */}
          <div className="mt-16 grid md:grid-cols-2 gap-8">
            {/* Problem */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">
                Vehicle Acquisition is Broken
              </h3>
              <ol className="space-y-4 text-slate-600">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">1</span>
                  <span>Auction costs up 36% since 2019</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">2</span>
                  <span>33% fewer lease returns post-COVID</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">3</span>
                  <span>Dealers doom-scrolling Facebook Marketplace</span>
                </li>
              </ol>

              {/* Stat graphic */}
              <div className="mt-8 flex items-center gap-4">
                <div className="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-lg font-bold text-lg">
                  <TrendingUp className="w-5 h-5" /> 36%
                </div>
                <span className="text-sm text-slate-500">Increase in auction costs</span>
              </div>
            </div>

            {/* Solution */}
            <div className="rounded-2xl bg-sky-500 p-8 sm:p-10 text-white">
              <h3 className="text-2xl font-bold mb-6">We Fixed It</h3>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">1</span>
                  <span className="font-medium">Save $1,200 per unit in recon/auction fees.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">2</span>
                  <span className="font-medium">Access 2,100 local listings/month.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">3</span>
                  <span className="font-medium">Your AI team is 95% more efficient than manual sourcing.</span>
                </li>
              </ol>
              <Link to="/demo" className="inline-block mt-8">
                <Button
                  size="lg"
                  className="bg-white text-sky-600 hover:bg-sky-50 rounded-full px-8 font-semibold shadow-lg"
                >
                  Stock Smarter Today
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ AGENTS SECTION ═══════ */}
      <section id="agents" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm font-semibold tracking-widest text-slate-400 uppercase mb-4">
            Your AI Acquisition Team
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-center text-slate-900 leading-tight">
            6 Agents. One Platform.{" "}
            <span className="text-sky-500">Zero Auction Fees.</span>
          </h2>
          <p className="mt-4 text-center text-lg text-slate-500 max-w-2xl mx-auto">
            Each agent is a specialist. Together, they run your entire used car
            acquisition pipeline — from search to signed deal.
          </p>

          {/* Agent selector tabs */}
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {agents.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <button
                  key={agent.name}
                  onClick={() => setActiveAgent(i)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                    activeAgent === i
                      ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                      : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {agent.name}
                </button>
              );
            })}
          </div>

          {/* Active agent detail */}
          <div className="mt-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${agents[activeAgent].lightBg} ${agents[activeAgent].textColor} text-sm font-semibold mb-4`}
              >
                {(() => {
                  const Icon = agents[activeAgent].icon;
                  return <Icon className="w-4 h-4" />;
                })()}
                {agents[activeAgent].name} Agent
              </div>
              <h3 className="text-3xl font-bold text-slate-900 mb-4">
                {agents[activeAgent].name === "Hunter" && "Find Every Deal Before Your Competition"}
                {agents[activeAgent].name === "Lister" && "Maximise Gross on Every Unit"}
                {agents[activeAgent].name === "Responder" && "Never Miss Another Lead"}
                {agents[activeAgent].name === "Scout" && "Deep Intel on Any Vehicle"}
                {agents[activeAgent].name === "Briefer" && "Start Every Morning Informed"}
                {agents[activeAgent].name === "Closer" && "Turn Listings Into Appointments"}
              </h3>
              <p className="text-slate-500 text-lg leading-relaxed">
                {agents[activeAgent].desc}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <span className="text-3xl font-extrabold text-sky-500">
                  {agents[activeAgent].stat}
                </span>
                <span className="text-sm text-slate-500">
                  {agents[activeAgent].statLabel}
                </span>
              </div>
            </div>

            {/* Agent visual card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 p-8">
              <div className="flex items-center gap-4 mb-6">
                <div
                  className={`w-12 h-12 rounded-xl ${agents[activeAgent].accent} flex items-center justify-center text-white`}
                >
                  {(() => {
                    const Icon = agents[activeAgent].icon;
                    return <Icon className="w-6 h-6" />;
                  })()}
                </div>
                <div>
                  <p className="font-bold text-slate-900">
                    {agents[activeAgent].name}
                  </p>
                  <p className="text-sm text-emerald-500 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Active — scanning now
                  </p>
                </div>
              </div>

              {/* Simulated activity feed */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
                    <Search className="w-4 h-4 text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">Scanning Carsales — NSW Region</p>
                    <p className="text-xs text-slate-400">12 new matches found</p>
                  </div>
                  <span className="text-xs text-slate-400">2m ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">Deal scored: 2022 HiLux SR5 — 9.2/10</p>
                    <p className="text-xs text-slate-400">$3,200 below market value</p>
                  </div>
                  <span className="text-xs text-slate-400">5m ago</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">Auto-reply drafted for seller inquiry</p>
                    <p className="text-xs text-slate-400">Response ready for review</p>
                  </div>
                  <span className="text-xs text-slate-400">8m ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ REAL RESULTS ═══════ */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold tracking-widest text-slate-400 uppercase mb-4">
            Built for Australian Dealers
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900">
            Real Results
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
            Dealers using Auquire source more cars, faster, at better margins —
            without the auction grind.
          </p>

          <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, stat: "$0", label: "Per-car fees", desc: "No buyer premiums. No hidden costs." },
              { icon: TrendingUp, stat: "33%", label: "Faster turns", desc: "Right stock, right price, right away." },
              { icon: Clock, stat: "<60s", label: "Lead response", desc: "Every enquiry answered instantly." },
              { icon: Sparkles, stat: "24/7", label: "Always on", desc: "Your AI team never sleeps." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-6 text-left hover:shadow-lg hover:shadow-slate-200/50 transition-shadow">
                  <div className="w-11 h-11 rounded-xl bg-sky-50 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-sky-500" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900">{item.stat}</p>
                  <p className="text-sm font-semibold text-sky-500 mt-1">{item.label}</p>
                  <p className="text-sm text-slate-500 mt-2">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════ PRICING ═══════ */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm font-semibold tracking-widest text-slate-400 uppercase mb-4">
            Simple, Transparent Pricing
          </p>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-center text-slate-900">
            Plans that scale with you
          </h2>
          <p className="mt-4 text-center text-lg text-slate-500 max-w-xl mx-auto">
            Start with a 14-day free trial. No credit card required.
          </p>

          <div className="mt-16 grid md:grid-cols-3 gap-8">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 ${
                  plan.featured
                    ? "bg-slate-900 text-white ring-2 ring-sky-500 shadow-2xl shadow-slate-900/20 scale-[1.03]"
                    : "bg-white border border-slate-200 text-slate-900"
                }`}
              >
                {plan.featured && (
                  <span className="inline-block text-xs font-bold bg-sky-500 text-white px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className={`text-sm ${plan.featured ? "text-slate-400" : "text-slate-500"}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`mt-3 text-sm ${plan.featured ? "text-slate-400" : "text-slate-500"}`}>
                  {plan.desc}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                          plan.featured ? "text-sky-400" : "text-sky-500"
                        }`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/demo" className="block mt-8">
                  <Button
                    className={`w-full rounded-full py-5 font-semibold ${
                      plan.featured
                        ? "bg-sky-500 hover:bg-sky-600 text-white"
                        : "bg-slate-900 hover:bg-slate-800 text-white"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FAQ ═══════ */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-extrabold text-center text-slate-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 overflow-hidden transition-shadow hover:shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-semibold text-slate-900 pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-slate-500 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ FINAL CTA ═══════ */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
            Ready to stock smarter?
          </h2>
          <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto">
            Join the dealers who are acquiring better cars, faster, and cheaper — without the auction grind.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/demo">
              <Button
                size="lg"
                className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-8 py-6 text-base font-semibold shadow-lg"
              >
                Book a Demo <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/founding-dealer">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 text-base font-semibold border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Become a Founding Dealer
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
              <Zap className="w-4 h-4 text-sky-400" />
            </div>
            <span className="font-bold text-white">Auquire</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#agents" className="hover:text-white transition-colors">Agents</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link to="/demo" className="hover:text-white transition-colors">Book a Demo</Link>
          </div>
          <p className="text-sm">© 2025 Auquire. Built in Australia.</p>
        </div>
      </footer>
    </div>
  );
}
