import { useState } from "react"
import { CheckCircle2, ChevronRight, Search } from "lucide-react"
import { PRICING_STORAGE, CURRENCIES, type PricingConfig } from "@/lib/pricing"
import { ONBOARDING_KEY } from "@/lib/onboarding"
import { saveBankDetails, type BankDetails, DEFAULT_BANK_DETAILS } from "@/lib/billing"

const COUNTRIES = [
  { name: "Malaysia",             iso: "my", flag: "🇲🇾", currency: "MYR", taxLabel: "SST",  taxPct: 8  },
  { name: "Indonesia",            iso: "id", flag: "🇮🇩", currency: "IDR", taxLabel: "PPN",  taxPct: 11 },
  { name: "United Arab Emirates", iso: "ae", flag: "🇦🇪", currency: "AED", taxLabel: "VAT",  taxPct: 5  },
  { name: "Saudi Arabia",         iso: "sa", flag: "🇸🇦", currency: "SAR", taxLabel: "VAT",  taxPct: 15 },
  { name: "Qatar",                iso: "qa", flag: "🇶🇦", currency: "QAR", taxLabel: "—",    taxPct: 0  },
  { name: "Kuwait",               iso: "kw", flag: "🇰🇼", currency: "KWD", taxLabel: "—",    taxPct: 0  },
  { name: "Bahrain",              iso: "bh", flag: "🇧🇭", currency: "BHD", taxLabel: "VAT",  taxPct: 10 },
  { name: "Oman",                 iso: "om", flag: "🇴🇲", currency: "OMR", taxLabel: "VAT",  taxPct: 5  },
  { name: "Jordan",               iso: "jo", flag: "🇯🇴", currency: "JOD", taxLabel: "GST",  taxPct: 16 },
  { name: "Egypt",                iso: "eg", flag: "🇪🇬", currency: "EGP", taxLabel: "VAT",  taxPct: 14 },
  { name: "Turkey",               iso: "tr", flag: "🇹🇷", currency: "TRY", taxLabel: "KDV",  taxPct: 20 },
  { name: "Pakistan",             iso: "pk", flag: "🇵🇰", currency: "PKR", taxLabel: "GST",  taxPct: 17 },
  { name: "Bangladesh",           iso: "bd", flag: "🇧🇩", currency: "BDT", taxLabel: "VAT",  taxPct: 15 },
  { name: "India",                iso: "in", flag: "🇮🇳", currency: "INR", taxLabel: "GST",  taxPct: 18 },
  { name: "Singapore",            iso: "sg", flag: "🇸🇬", currency: "SGD", taxLabel: "GST",  taxPct: 9  },
  { name: "Brunei",               iso: "bn", flag: "🇧🇳", currency: "BND", taxLabel: "—",    taxPct: 0  },
  { name: "Philippines",          iso: "ph", flag: "🇵🇭", currency: "PHP", taxLabel: "VAT",  taxPct: 12 },
  { name: "United Kingdom",       iso: "gb", flag: "🇬🇧", currency: "GBP", taxLabel: "VAT",  taxPct: 20 },
  { name: "Germany",              iso: "de", flag: "🇩🇪", currency: "EUR", taxLabel: "MwSt", taxPct: 19 },
  { name: "France",               iso: "fr", flag: "🇫🇷", currency: "EUR", taxLabel: "TVA",  taxPct: 20 },
  { name: "Netherlands",          iso: "nl", flag: "🇳🇱", currency: "EUR", taxLabel: "BTW",  taxPct: 21 },
  { name: "Belgium",              iso: "be", flag: "🇧🇪", currency: "EUR", taxLabel: "VAT",  taxPct: 21 },
  { name: "United States",        iso: "us", flag: "🇺🇸", currency: "USD", taxLabel: "—",    taxPct: 0  },
  { name: "Canada",               iso: "ca", flag: "🇨🇦", currency: "CAD", taxLabel: "GST",  taxPct: 5  },
  { name: "Australia",            iso: "au", flag: "🇦🇺", currency: "AUD", taxLabel: "GST",  taxPct: 10 },
  { name: "South Africa",         iso: "za", flag: "🇿🇦", currency: "ZAR", taxLabel: "VAT",  taxPct: 15 },
  { name: "Morocco",              iso: "ma", flag: "🇲🇦", currency: "MAD", taxLabel: "TVA",  taxPct: 20 },
  { name: "Nigeria",              iso: "ng", flag: "🇳🇬", currency: "NGN", taxLabel: "VAT",  taxPct: 7  },
  { name: "Others",               iso: "un", flag: "🌐",   currency: "USD", taxLabel: "VAT",  taxPct: 0  },
]

const F    = "'Inter', system-ui, sans-serif"
const BLUE = "#2563eb"

interface Props { onComplete: () => void }

export default function OnboardingWizard({ onComplete }: Props) {
  const [step, setStep]           = useState<1 | 2 | 3>(1)
  const [bank, setBank]           = useState<BankDetails>(DEFAULT_BANK_DETAILS)
  const [search, setSearch]       = useState("")
  const [selected, setSelected]   = useState<typeof COUNTRIES[0] | null>(null)
  const [currency, setCurrency]   = useState("")
  const [taxLabel, setTaxLabel]   = useState("")
  const [taxPct, setTaxPct]       = useState(0)
  const [overrideCur, setOverride] = useState(false)

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.currency.toLowerCase().includes(search.toLowerCase())
  )

  function pickCountry(c: typeof COUNTRIES[0]) {
    setSelected(c)
    setCurrency(c.currency)
    setTaxLabel(c.taxLabel === "—" ? "" : c.taxLabel)
    setTaxPct(c.taxPct)
    setOverride(false)
  }

  function finish() {
    const config = {
      auditDayCost: 0,
      currency,
      vatPct: taxPct,
      operatingCountry: selected!.name,
      taxLabel: taxLabel || "VAT",
    } as PricingConfig & { operatingCountry: string; taxLabel: string }
    localStorage.setItem(PRICING_STORAGE, JSON.stringify(config))
    saveBankDetails(bank)
    localStorage.setItem(ONBOARDING_KEY, "true")
    onComplete()
  }

  return (
    <>
      <style>{`
        @keyframes ob-fade-up   { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        @keyframes ob-fade-in   { from { opacity:0; } to { opacity:1; } }
        @keyframes ob-scale-in  { from { opacity:0; transform:scale(0.93); } to { opacity:1; transform:scale(1); } }

        @keyframes ob-shimmer   { 0% { background-position:200% center; } 100% { background-position:-200% center; } }
        @keyframes ob-dot-pulse { 0%,80%,100% { transform:scale(0); opacity:0.4; } 40% { transform:scale(1); opacity:1; } }
        @keyframes ob-float     { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-6px); } }
        @keyframes ob-orb       { 0%,100% { transform:scale(1) translate(0,0); opacity:0.35; }
                                   33%    { transform:scale(1.2) translate(12px,-8px); opacity:0.5; }
                                   66%    { transform:scale(0.9) translate(-8px,10px); opacity:0.25; } }
        .ob-card  { animation: ob-scale-in 0.38s cubic-bezier(.22,1,.36,1) forwards; }
        .ob-h1    { animation: ob-fade-up  0.5s 0.05s cubic-bezier(.22,1,.36,1) both; }
        .ob-sub   { animation: ob-fade-up  0.5s 0.18s cubic-bezier(.22,1,.36,1) both; }
        .ob-body  { animation: ob-fade-up  0.5s 0.28s cubic-bezier(.22,1,.36,1) both; }

        .ob-float { animation: ob-float 3.8s ease-in-out infinite; }
        .ob-orb1  { animation: ob-orb 7s 0s    ease-in-out infinite; }
        .ob-orb2  { animation: ob-orb 9s 2.5s  ease-in-out infinite; }
        .ob-orb3  { animation: ob-orb 6s 1.2s  ease-in-out infinite; }
        .ob-country-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 14px rgba(37,99,235,0.13); }
        .ob-country-btn { transition: transform 0.15s, box-shadow 0.15s, border-color 0.12s, background 0.12s; }
        .ob-shimmer-text {
          background: linear-gradient(90deg, #1d4ed8 0%, #60a5fa 40%, #1d4ed8 60%, #3b82f6 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: ob-shimmer 3s linear infinite;
        }
      `}</style>

      {/* Backdrop */}
      <div style={{ position:"fixed", inset:0, zIndex:99999, background:"rgba(15,33,112,0.4)", backdropFilter:"blur(6px)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:F }}>

        {/* Card */}
        <div className="ob-card" style={{ background:"#fff", borderRadius:24, width:"min(800px,100%)", maxHeight:"92vh", display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 40px 100px rgba(15,33,112,0.28), 0 0 0 1px rgba(37,99,235,0.08)" }}>

          {/* ── Welcome hero (light blue) ── */}
          <div style={{ position:"relative", overflow:"hidden", background:"linear-gradient(135deg,#dbeafe 0%,#eff6ff 50%,#bfdbfe 100%)", padding:"30px 32px 26px", flexShrink:0 }}>

            {/* Floating orbs */}
            <div className="ob-orb1" style={{ position:"absolute", width:160, height:160, borderRadius:"50%", background:"radial-gradient(circle,#93c5fd,transparent)", top:-40, right:60, pointerEvents:"none" }} />
            <div className="ob-orb2" style={{ position:"absolute", width:120, height:120, borderRadius:"50%", background:"radial-gradient(circle,#a5b4fc,transparent)", bottom:-30, right:20, pointerEvents:"none" }} />
            <div className="ob-orb3" style={{ position:"absolute", width:80,  height:80,  borderRadius:"50%", background:"radial-gradient(circle,#60a5fa,transparent)", top:10,  left:200, pointerEvents:"none" }} />

            <div style={{ position:"relative", zIndex:1 }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                <div>
                  <h1 className="ob-h1 ob-shimmer-text" style={{ margin:"0 0 6px", fontSize:"2rem", fontWeight:900, lineHeight:1.15, letterSpacing:"-0.02em" }}>
                    Welcome!
                  </h1>
                  <p className="ob-sub" style={{ margin:0, fontSize:"0.9rem", color:"#3b82f6", fontWeight:500, lineHeight:1.5 }}>
                    Let's get your system configured — it only takes a minute.
                  </p>
                </div>

                {/* Step bubbles */}
                <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0, paddingTop:4 }}>
                  {[1,2,3].map(s => (
                    <div key={s} style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{
                        width:30, height:30, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
                        background: step === s ? BLUE : step > s ? "#16a34a" : "rgba(255,255,255,0.7)",
                        border: step === s ? `2px solid ${BLUE}` : step > s ? "2px solid #16a34a" : "2px solid #bfdbfe",
                        color: step >= s ? "#fff" : "#93c5fd",
                        fontSize:"0.72rem", fontWeight:800,
                        boxShadow: step === s ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
                        transition:"all 0.3s",
                      }}>
                        {step > s ? <CheckCircle2 size={14} /> : s}
                      </div>
                      {s < 3 && (
                        <div style={{ width:32, height:2.5, borderRadius:2, background: step > s ? "#16a34a" : "rgba(147,197,253,0.6)", transition:"background 0.4s" }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step label */}
              <div style={{ display:"flex", gap:6, marginTop:16 }}>
                {[
                  { n:1, label:"Operating Country" },
                  { n:2, label:"Currency & Tax"    },
                  { n:3, label:"Bank Details"       },
                ].map(s => (
                  <div key={s.n} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 12px", borderRadius:20, background: step===s.n ? "rgba(37,99,235,0.12)" : "transparent", transition:"background 0.3s" }}>
                    <span style={{ fontSize:"0.7rem", fontWeight:700, color: step===s.n ? BLUE : "#93c5fd" }}>{s.n}. {s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="ob-body" style={{ flex:1, overflow:"auto", padding:"24px 32px" }}>

            {/* STEP 1 — Country */}
            {step === 1 && (
              <div>
                <p style={{ margin:"0 0 4px", fontSize:"0.95rem", fontWeight:700, color:"#0f172a" }}>Which country is your organisation operating in?</p>
                <p style={{ margin:"0 0 16px", fontSize:"0.76rem", color:"#64748b", lineHeight:1.55 }}>
                  This automatically sets your system currency, tax label, and default rates. You can change any of these later in <strong>Settings</strong>.
                </p>

                <div style={{ position:"relative", marginBottom:16 }}>
                  <Search size={14} color="#94a3b8" style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)" }} />
                  <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search country or currency…"
                    style={{ width:"100%", padding:"9px 12px 9px 34px", borderRadius:10, border:"1.5px solid #e2e8f0", fontSize:13, color:"#111827", outline:"none", boxSizing:"border-box" as const, fontFamily:F, background:"#f8fafc", transition:"border-color 0.15s" }}
                    onFocus={e => e.target.style.borderColor = BLUE}
                    onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(215px,1fr))", gap:8, maxHeight:300, overflowY:"auto", paddingRight:2 }}>
                  {filtered.map(c => {
                    const sel = selected?.iso === c.iso
                    return (
                      <button key={c.iso} className="ob-country-btn" onClick={() => pickCountry(c)}
                        style={{
                          display:"flex", alignItems:"center", gap:10, padding:"11px 14px",
                          border: sel ? `2px solid ${BLUE}` : "1.5px solid #e2e8f0",
                          borderRadius:12, background: sel ? "#eff6ff" : "#fff",
                          cursor:"pointer", textAlign:"left" as const,
                        }}>
                        {c.iso === "un"
                          ? <span style={{ fontSize:22, flexShrink:0 }}>🌐</span>
                          : <img src={`https://flagcdn.com/w40/${c.iso}.png`} width={28} height={20} alt={c.name} style={{ borderRadius:3, flexShrink:0, objectFit:"cover" }} />
                        }
                        <div style={{ overflow:"hidden", flex:1 }}>
                          <p style={{ margin:0, fontSize:"0.81rem", fontWeight:700, color: sel ? BLUE : "#111827", whiteSpace:"nowrap" as const, overflow:"hidden", textOverflow:"ellipsis" }}>{c.name}</p>
                          <p style={{ margin:"1px 0 0", fontSize:"0.68rem", color:"#94a3b8" }}>{c.currency}{c.taxLabel !== "—" ? ` · ${c.taxLabel} ${c.taxPct}%` : ""}</p>
                        </div>
                        {sel && <CheckCircle2 size={16} color={BLUE} style={{ flexShrink:0 }} />}
                      </button>
                    )
                  })}
                  {filtered.length === 0 && (
                    <div style={{ gridColumn:"1 / -1", padding:"36px 0", textAlign:"center", color:"#94a3b8", fontSize:"0.82rem" }}>No results for "{search}"</div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2 — Currency */}
            {step === 2 && selected && (
              <div>
                <p style={{ margin:"0 0 4px", fontSize:"0.95rem", fontWeight:700, color:"#0f172a" }}>Confirm your currency and tax settings</p>
                <p style={{ margin:"0 0 22px", fontSize:"0.76rem", color:"#64748b", lineHeight:1.55 }}>
                  Based on <strong>{selected.name}</strong> we've pre-filled everything below. Adjust if needed — you can always update these in <strong>Settings → Scope and Price List</strong>.
                </p>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
                  {/* Currency card */}
                  <div style={{ background:"linear-gradient(135deg,#eff6ff,#dbeafe)", border:`1.5px solid #bfdbfe`, borderRadius:14, padding:"18px 20px" }}>
                    <p style={{ margin:"0 0 10px", fontSize:"0.68rem", fontWeight:700, color:"#3b82f6", textTransform:"uppercase" as const, letterSpacing:"0.08em" }}>System Currency</p>
                    {overrideCur ? (
                      <select value={currency} onChange={e => setCurrency(e.target.value)}
                        style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:`1.5px solid ${BLUE}`, fontSize:14, fontWeight:700, color:"#111827", outline:"none", background:"#fff", cursor:"pointer", fontFamily:F }}>
                        {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name}</option>)}
                      </select>
                    ) : (
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                        <div className="ob-float">
                          <p style={{ margin:0, fontSize:"2rem", fontWeight:900, color:BLUE, letterSpacing:"-0.02em" }}>{currency}</p>
                          <p style={{ margin:"2px 0 0", fontSize:"0.72rem", color:"#64748b" }}>{CURRENCIES.find(c => c.code === currency)?.name ?? currency}</p>
                        </div>
                        <button onClick={() => setOverride(true)}
                          style={{ fontSize:"0.72rem", fontWeight:700, color:BLUE, background:"rgba(255,255,255,0.8)", border:`1px solid #bfdbfe`, borderRadius:8, padding:"5px 12px", cursor:"pointer", fontFamily:F }}>
                          Change
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Tax card */}
                  <div style={{ background:"#f8fafc", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"18px 20px" }}>
                    <p style={{ margin:"0 0 10px", fontSize:"0.68rem", fontWeight:700, color:"#64748b", textTransform:"uppercase" as const, letterSpacing:"0.08em" }}>Tax / VAT Settings</p>
                    <div style={{ display:"flex", gap:8 }}>
                      <div style={{ flex:1 }}>
                        <p style={{ margin:"0 0 4px", fontSize:"0.65rem", color:"#94a3b8", fontWeight:600 }}>Label</p>
                        <input value={taxLabel} onChange={e => setTaxLabel(e.target.value)} placeholder="e.g. VAT"
                          style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, fontWeight:700, color:"#111827", outline:"none", boxSizing:"border-box" as const, fontFamily:F }} />
                      </div>
                      <div style={{ width:84 }}>
                        <p style={{ margin:"0 0 4px", fontSize:"0.65rem", color:"#94a3b8", fontWeight:600 }}>Rate %</p>
                        <input type="number" min={0} max={100} step={0.1} value={taxPct}
                          onChange={e => setTaxPct(parseFloat(e.target.value) || 0)}
                          style={{ width:"100%", padding:"8px 10px", borderRadius:8, border:"1.5px solid #e2e8f0", fontSize:14, fontWeight:700, color:"#111827", outline:"none", boxSizing:"border-box" as const, fontFamily:F }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                  {[
                    { label:"Currency",  value: currency,         sub: CURRENCIES.find(c => c.code === currency)?.name ?? "" },
                    { label:"Tax Label", value: taxLabel || "VAT",sub: "Applied to invoices" },
                    { label:"Tax Rate",  value: `${taxPct}%`,     sub: "Default rate" },
                  ].map(item => (
                    <div key={item.label} style={{ border:"1.5px solid #e2e8f0", borderRadius:12, padding:"14px 16px", background:"#fff" }}>
                      <p style={{ margin:"0 0 6px", fontSize:"0.67rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em" }}>{item.label}</p>
                      <p style={{ margin:"0 0 2px", fontSize:"1.3rem", fontWeight:800, color:"#0f172a", letterSpacing:"-0.02em" }}>{item.value}</p>
                      <p style={{ margin:0, fontSize:"0.68rem", color:"#94a3b8" }}>{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* STEP 3 — Bank Details */}
            {step === 3 && (
              <div>
                <p style={{ margin:"0 0 4px", fontSize:"0.95rem", fontWeight:700, color:"#0f172a" }}>Add your bank transfer details</p>
                <p style={{ margin:"0 0 20px", fontSize:"0.76rem", color:"#64748b", lineHeight:1.55 }}>
                  These details appear on invoices so customers know where to send payments. You can skip this and update later in <strong>Settings → Payments</strong>.
                </p>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                  {([
                    { key:"bankName",      label:"Bank Name",          placeholder:"e.g. Maybank Berhad"               },
                    { key:"accountName",   label:"Account Name",       placeholder:"e.g. HCS Halal Certification Body" },
                    { key:"accountNumber", label:"Account Number",     placeholder:"e.g. 1234567890"                   },
                    { key:"swiftBic",      label:"SWIFT / BIC Code",   placeholder:"e.g. MBBEMYKL"                    },
                    { key:"iban",          label:"IBAN",               placeholder:"e.g. MY89 3704 0044 0532 0130 00"  },
                    { key:"branchCode",    label:"Branch / Sort Code", placeholder:"e.g. 04-00"                        },
                  ] as {key: keyof BankDetails; label:string; placeholder:string}[]).map(f => (
                    <div key={f.key}>
                      <p style={{ margin:"0 0 5px", fontSize:"0.67rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em" }}>{f.label}</p>
                      <input value={bank[f.key]} onChange={e => setBank(b => ({ ...b, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, color:"#111827", outline:"none", boxSizing:"border-box" as const, fontFamily:F, transition:"border-color 0.15s" }}
                        onFocus={e => e.target.style.borderColor = BLUE}
                        onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
                      />
                    </div>
                  ))}
                </div>

                <div style={{ marginTop:14 }}>
                  <p style={{ margin:"0 0 5px", fontSize:"0.67rem", fontWeight:700, color:"#94a3b8", textTransform:"uppercase" as const, letterSpacing:"0.07em" }}>Bank Address</p>
                  <textarea value={bank.bankAddress} onChange={e => setBank(b => ({ ...b, bankAddress: e.target.value }))}
                    placeholder="Full bank branch address…" rows={2}
                    style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:10, fontSize:13, color:"#111827", outline:"none", boxSizing:"border-box" as const, fontFamily:F, resize:"vertical" as const, transition:"border-color 0.15s" }}
                    onFocus={e => e.target.style.borderColor = BLUE}
                    onBlur={e  => e.target.style.borderColor = "#e2e8f0"}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ padding:"16px 32px 24px", borderTop:"1px solid #f1f5f9", display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
            {step > 1
              ? <button onClick={() => setStep(s => (s - 1) as 1|2|3)} style={{ fontSize:"0.83rem", fontWeight:600, color:"#64748b", background:"none", border:"none", cursor:"pointer", fontFamily:F }}>← Back</button>
              : <div />
            }

            {step === 1 && (
              <button onClick={() => selected && setStep(2)} disabled={!selected}
                style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"11px 28px", background: selected ? `linear-gradient(135deg,${BLUE},#1d4ed8)` : "#e2e8f0", color: selected ? "#fff" : "#94a3b8", border:"none", borderRadius:12, fontSize:"0.88rem", fontWeight:700, cursor: selected ? "pointer" : "not-allowed", fontFamily:F, boxShadow: selected ? "0 4px 16px rgba(37,99,235,0.3)" : "none", transition:"all 0.2s" }}>
                Continue <ChevronRight size={16} />
              </button>
            )}

            {step === 2 && (
              <button onClick={() => setStep(3)}
                style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"11px 28px", background:`linear-gradient(135deg,${BLUE},#1d4ed8)`, color:"#fff", border:"none", borderRadius:12, fontSize:"0.88rem", fontWeight:700, cursor:"pointer", fontFamily:F, boxShadow:"0 4px 16px rgba(37,99,235,0.3)" }}>
                Continue <ChevronRight size={16} />
              </button>
            )}

            {step === 3 && (
              <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                <button onClick={finish} style={{ fontSize:"0.83rem", fontWeight:600, color:"#64748b", background:"none", border:"none", cursor:"pointer", fontFamily:F }}>
                  Skip for now
                </button>
                <button onClick={finish}
                  style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"11px 28px", background:"linear-gradient(135deg,#1e3a8a,#1d4ed8)", color:"#fff", border:"none", borderRadius:12, fontSize:"0.88rem", fontWeight:700, cursor:"pointer", fontFamily:F, boxShadow:"0 4px 16px rgba(30,58,138,0.3)" }}>
                  <CheckCircle2 size={16} />Complete Setup
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
