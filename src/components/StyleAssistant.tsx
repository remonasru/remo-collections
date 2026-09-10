import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Minus, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductImage } from "@/components/ProductCard";
import { COLORS, inr, useStore, type Product } from "@/lib/store";

type Mode = "home" | "quiz" | "results" | "color";

type Answers = {
  occasion: string;
  gender: string;
  style: string;
  budget: string;
};

const OCCASIONS = ["Wedding", "Casual", "Formal", "Party", "Festive"];
const GENDERS = ["Men", "Women", "Kids", "Anyone"];
const STYLES = ["Traditional / Ethnic", "Western / Trendy", "Classic / Simple", "Sporty / Comfy"];
const BUDGETS = ["Under ₹500", "₹500 – ₹1,000", "₹1,000 – ₹2,000", "Above ₹2,000"];

const BUDGET_RANGE: Record<string, [number, number]> = {
  "Under ₹500": [0, 500],
  "₹500 – ₹1,000": [500, 1000],
  "₹1,000 – ₹2,000": [1000, 2000],
  "Above ₹2,000": [2000, Number.MAX_SAFE_INTEGER],
};

const STYLE_KEYWORDS: Record<string, string[]> = {
  "Traditional / Ethnic": ["ethnic", "saree", "kurta", "dhoti", "chudithar", "salwar", "dupatta", "shawl", "pattiyala", "frock"],
  "Western / Trendy": ["western", "dress", "top", "tunic", "jacket", "hoodie", "jean", "denim", "sneaker"],
  "Classic / Simple": ["shirt", "formal", "trouser", "pant", "t-shirt"],
  "Sporty / Comfy": ["track", "short", "t-shirt", "night", "legging", "sneaker", "croc"],
};

const OCCASION_KEYWORDS: Record<string, string[]> = {
  Wedding: ["saree", "ethnic", "kurta", "silk", "dhoti", "formal", "jewel", "chain", "ring"],
  Casual: ["t-shirt", "casual", "short", "jean", "top", "sneaker", "track"],
  Formal: ["formal", "shirt", "trouser", "pant", "watch", "belt", "wallet", "shoe"],
  Party: ["western", "dress", "party", "top", "heel", "perfume", "jewel"],
  Festive: ["ethnic", "silk", "saree", "kurta", "festival", "gift", "festive"],
};

/** Fashion pairing rules — shirt/top colour → recommended bottom colours + tip. */
const COLOR_MATCHES: Record<string, { pair: string[]; tip: string }> = {
  White: { pair: ["Black", "Blue", "Beige", "Maroon"], tip: "White goes with everything — pair with navy for formal, beige for a soft daytime look." },
  Black: { pair: ["Grey", "Beige", "White", "Blue"], tip: "Black tops look sharpest with grey or beige bottoms. Avoid full black-on-black unless it's a party." },
  Blue: { pair: ["Beige", "White", "Grey", "Black"], tip: "Light blue with dark charcoal or navy bottoms is the safest smart-casual combo." },
  Red: { pair: ["Black", "Beige", "White", "Grey"], tip: "Keep the bottom neutral — black or beige — so the red stays the hero." },
  Pink: { pair: ["White", "Grey", "Beige", "Black"], tip: "Soft pink with white or light grey feels fresh; add a maroon accessory for depth." },
  Yellow: { pair: ["Blue", "White", "Grey", "Black"], tip: "Yellow pops best against denim blue or crisp white." },
  Green: { pair: ["Beige", "Black", "White", "Grey"], tip: "Olive green with beige or black bottoms is an easy, modern combination." },
  Grey: { pair: ["Black", "Maroon", "Blue", "White"], tip: "Grey is a neutral — try maroon or navy bottoms for a richer look." },
  Maroon: { pair: ["Beige", "Black", "Grey", "White"], tip: "Maroon loves beige and cream. Great for festive and evening wear." },
  Beige: { pair: ["Maroon", "Black", "Blue", "Green"], tip: "Beige is a perfect base — deepen it with maroon, olive or navy." },
};

function hexOf(name: string) {
  return COLORS.find((c) => c.name === name)?.hex ?? "#cccccc";
}

function scoreProduct(p: Product, a: Answers): number {
  let score = 0;
  const hay = `${p.title} ${p.subCategory} ${p.description} ${p.occasion} ${p.recipient} ${p.fabric}`.toLowerCase();

  if (a.gender && a.gender !== "Anyone") {
    if (p.category === a.gender) score += 5;
    else if (p.category === "Accessories") score += 1;
    else score -= 4;
  }
  if (a.occasion) {
    if (p.occasion && p.occasion.toLowerCase() === a.occasion.toLowerCase()) score += 4;
    if ((OCCASION_KEYWORDS[a.occasion] ?? []).some((k) => hay.includes(k))) score += 3;
  }
  if (a.style && (STYLE_KEYWORDS[a.style] ?? []).some((k) => hay.includes(k))) score += 3;
  if (a.budget) {
    const [min, max] = BUDGET_RANGE[a.budget] ?? [0, Number.MAX_SAFE_INTEGER];
    if (p.price >= min && p.price <= max) score += 4;
    else score -= 2;
  }
  if (p.inStock) score += 1;
  return score;
}

export function StyleAssistant() {
  const { products, loading } = useStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("home");
  const [answers, setAnswers] = useState<Answers>({ occasion: "", gender: "", style: "", budget: "" });
  const [step, setStep] = useState(0);
  const [colorPick, setColorPick] = useState<string>("Blue");

  const matches = useMemo(() => {
    if (mode !== "results") return [];
    return products
      .map((p) => ({ p, s: scoreProduct(p, answers) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || b.p.createdAt - a.p.createdAt)
      .slice(0, 6)
      .map((x) => x.p);
  }, [products, answers, mode]);

  if (pathname.startsWith("/admin")) return null;

  const reset = () => {
    setAnswers({ occasion: "", gender: "", style: "", budget: "" });
    setStep(0);
    setMode("home");
  };

  const steps: { key: keyof Answers; label: string; options: string[] }[] = [
    { key: "occasion", label: "What's the occasion?", options: OCCASIONS },
    { key: "gender", label: "Who are we shopping for?", options: GENDERS },
    { key: "style", label: "Preferred style?", options: STYLES },
    { key: "budget", label: "What's your budget?", options: BUDGETS },
  ];

  const current = steps[Math.min(step, steps.length - 1)];

  const choose = (key: keyof Answers, value: string) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    if (step >= steps.length - 1) setMode("results");
    else setStep((s) => s + 1);
  };

  const Chip = ({ label, onClick, active }: { label: string; onClick: () => void; active?: boolean }) => (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:border-primary hover:text-primary"
      }`}
    >
      {label}
    </button>
  );

  const match = COLOR_MATCHES[colorPick];

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close the style assistant" : "Open the AI fashion assistant"}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full gradient-brand text-primary-foreground shadow-card transition-transform duration-300 hover:scale-110 active:scale-95 sm:bottom-6 sm:right-6"
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {/* Panel */}
      <div
        className={`fixed bottom-20 right-2 z-50 w-[min(22rem,calc(100vw-1rem))] origin-bottom-right rounded-2xl border border-border bg-card shadow-card transition-all duration-300 sm:bottom-24 sm:right-6 ${
          open ? "pointer-events-auto scale-100 opacity-100" : "pointer-events-none scale-90 opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center gap-2 rounded-t-2xl gradient-brand px-4 py-3 text-primary-foreground">
          {mode !== "home" && (
            <button type="button" aria-label="Back" onClick={reset} className="opacity-90 hover:opacity-100">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <Sparkles className="h-4 w-4" />
          <p className="flex-1 font-display text-sm font-bold">AI Fashion Assistant</p>
          <button type="button" aria-label="Minimise" onClick={() => setOpen(false)} className="opacity-90 hover:opacity-100">
            <Minus className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto p-4">
          {mode === "home" && (
            <>
              <p className="text-sm text-muted-foreground">
                Hi! I can help you pick an outfit or match colours. What would you like?
              </p>
              <div className="flex flex-wrap gap-2">
                <Chip label="Find my outfit" onClick={() => { setStep(0); setMode("quiz"); }} />
                <Chip label="Find match for my shirt" onClick={() => setMode("color")} />
                <Chip
                  label="Wedding collection"
                  onClick={() => { setAnswers({ occasion: "Wedding", gender: "", style: "", budget: "" }); setMode("results"); }}
                />
                <Chip
                  label="Casual outfits"
                  onClick={() => { setAnswers({ occasion: "Casual", gender: "", style: "", budget: "" }); setMode("results"); }}
                />
              </div>
            </>
          )}

          {mode === "quiz" && current && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Step {step + 1} of {steps.length}
              </p>
              <p className="text-sm font-semibold">{current.label}</p>
              <div className="flex flex-wrap gap-2">
                {current.options.map((o) => (
                  <Chip
                    key={o}
                    label={o}
                    active={answers[current.key] === o}
                    onClick={() => choose(current.key, o)}
                  />
                ))}
              </div>
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  ← Previous question
                </button>
              )}
            </>
          )}

          {mode === "results" && (
            <>
              <p className="text-sm font-semibold">Picked for you</p>
              <p className="text-xs text-muted-foreground">
                {[answers.occasion, answers.gender, answers.style, answers.budget].filter(Boolean).join(" · ") ||
                  "Our latest picks"}
              </p>

              {loading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-20 animate-pulse rounded-lg bg-secondary" />
                  ))}
                </div>
              ) : matches.length === 0 ? (
                <div className="space-y-3 rounded-lg bg-secondary p-3 text-sm">
                  <p>I couldn't find a close match for that combination right now.</p>
                  <div className="flex flex-wrap gap-2">
                    <Chip label="Try again" onClick={() => { setStep(0); setMode("quiz"); }} />
                    <Chip label="Colour stylist" onClick={() => setMode("color")} />
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {matches.map((p) => (
                    <li key={p.id} className="flex gap-3 rounded-lg border border-border p-2">
                      <div className="h-20 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
                        <ProductImage product={p} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.subCategory || p.category}</p>
                        <p className="font-display text-sm font-bold">{inr(p.price)}</p>
                        <Link
                          to="/product/$id"
                          params={{ id: p.id }}
                          onClick={() => setOpen(false)}
                          className="mt-1 inline-block rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                        >
                          View / Buy
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={reset}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Start over
              </button>
            </>
          )}

          {mode === "color" && (
            <>
              <p className="text-sm font-semibold">Colour Stylist</p>
              <p className="text-xs text-muted-foreground">Pick your shirt / top colour:</p>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    aria-label={c.name}
                    onClick={() => setColorPick(c.name)}
                    className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      colorPick === c.name ? "border-primary ring-2 ring-primary/30" : "border-border"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>

              {match ? (
                <div className="space-y-2 rounded-lg bg-secondary p-3">
                  <p className="text-sm font-semibold">
                    {colorPick} top pairs well with:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {match.pair.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-2 rounded-full bg-background px-2 py-1 text-xs font-semibold"
                      >
                        <span
                          className="h-4 w-4 rounded-full border border-border"
                          style={{ backgroundColor: hexOf(name) }}
                        />
                        {name}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{match.tip}</p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Pick a colour to see matching combinations.</p>
              )}

              <Chip label="Find my outfit instead" onClick={() => { setStep(0); setMode("quiz"); }} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
