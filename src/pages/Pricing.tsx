import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Zap, Building2, Rocket, HelpCircle } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const plans = [
  {
    name: "Starter",
    price: "0",
    period: "forever",
    description: "Perfect for solo developers exploring Blueprint.dev.",
    icon: Zap,
    cta: "Get Started Free",
    popular: false,
    features: [
      "1 active project",
      "PRD upload & analysis",
      "Basic architecture graph",
      "Task decomposition (up to 20)",
      "Community support",
      "5 AI generations / month",
    ],
  },
  {
    name: "Pro",
    price: "29",
    period: "per month",
    description: "For professional developers and small teams shipping fast.",
    icon: Rocket,
    cta: "Start Pro Trial",
    popular: true,
    features: [
      "Unlimited projects",
      "Advanced PRD analysis with AI",
      "Full architecture & traceability",
      "Unlimited task decomposition",
      "Sprint planning & Kanban",
      "Code generation (all frameworks)",
      "GitHub & Jira integration",
      "Priority email support",
      "100 AI generations / month",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations that need scale, security, and dedicated support.",
    icon: Building2,
    cta: "Contact Sales",
    popular: false,
    features: [
      "Everything in Pro",
      "SSO / SAML authentication",
      "Custom AI model fine-tuning",
      "Dedicated success manager",
      "SLA & uptime guarantees",
      "On-premise deployment option",
      "Audit logs & compliance",
      "Unlimited AI generations",
      "Custom integrations",
    ],
  },
];

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes. Upgrade or downgrade anytime. Changes take effect on your next billing cycle. Unused days are prorated.",
  },
  {
    q: "What counts as an AI generation?",
    a: "Each PRD analysis, architecture generation, code scaffold, or AI chat response counts as one generation.",
  },
  {
    q: "Do you offer a student or startup discount?",
    a: "Yes! We offer 50% off Pro for verified students and early-stage startups. Contact us to apply.",
  },
  {
    q: "Is there a free trial for Pro?",
    a: "Absolutely. Pro comes with a 14-day free trial — no credit card required.",
  },
];

export default function Pricing() {
  const [selectedPlan, setSelectedPlan] = useState("Pro");

  return (
    <div className="min-h-screen bg-canvas text-foreground font-satoshi">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-6">
        <div className="max-w-[1280px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold tracking-wide uppercase mb-6">
            <Zap className="w-3.5 h-3.5" />
            Simple Pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Ship architecture, <span className="text-primary">not invoices</span>
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Start free. Scale when you're ready. No hidden fees, no per-seat pricing traps.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 px-6">
        <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              onClick={() => setSelectedPlan(plan.name)}
              className={`relative bg-surface border rounded-2xl p-8 flex flex-col transition-all cursor-pointer ${
                selectedPlan === plan.name
                  ? "border-primary shadow-[0_0_40px_-12px_hsl(25_95%_53%/0.4)] ring-1 ring-primary"
                  : "border-border-subtle hover:border-border-emphasis"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-white text-xs font-bold uppercase tracking-wider rounded-full">
                  Most Popular
                </div>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedPlan === plan.name ? "bg-primary/15" : "bg-overlay"}`}>
                  <plan.icon className={`w-5 h-5 ${selectedPlan === plan.name ? "text-primary" : "text-text-secondary"}`} />
                </div>
                <h2 className="text-xl font-bold">{plan.name}</h2>
              </div>

              <div className="mb-4">
                <span className="text-4xl font-bold tracking-tight">
                  {plan.price === "Custom" ? "" : "$"}{plan.price}
                </span>
                {plan.period && <span className="text-text-muted text-sm ml-1">/{plan.period}</span>}
              </div>

              <p className="text-text-secondary text-sm mb-6">{plan.description}</p>

              <Link to="/auth" className="block mb-6" onClick={(e) => e.stopPropagation()}>
                <button
                  className={`w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    selectedPlan === plan.name
                      ? "bg-primary text-white hover:brightness-110 glow-orange"
                      : "bg-overlay border border-border-subtle text-foreground hover:bg-elevated"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>

              <div className="border-t border-border-subtle pt-6 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${selectedPlan === plan.name ? "text-primary" : "text-accent-green"}`} />
                    <span className="text-sm text-text-secondary">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Frequently asked questions</h2>
            <p className="text-text-secondary">Everything else you need to know.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-surface border border-border-subtle rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                    <p className="text-sm text-text-secondary">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
