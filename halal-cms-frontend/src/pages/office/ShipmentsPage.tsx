import { useState } from "react"
import {
  Ship, Plus, X, Save, Search, RefreshCw,
  ChevronDown, ChevronUp, ExternalLink,
} from "lucide-react"
import OfficeLayout from "./OfficeLayout"
import { C, getStatusStyle, formatDate } from "@/lib/utils"
import type { LocalShipment, LocalGeneratedCertificate } from "@/types"

const STORAGE_KEY = "hcs_shipments"

function lsArr<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]") as T[] }
  catch { return [] }
}
function lsSave(key: string, val: unknown) { localStorage.setItem(key, JSON.stringify(val)) }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36) }

const DEST_COUNTRIES = [
  "UAE", "Saudi Arabia", "Qatar", "Kuwait", "Bahrain", "Oman", "Jordan",
  "Egypt", "Malaysia", "Indonesia", "Singapore", "United Kingdom", "Germany",
  "France", "Netherlands", "United States", "Canada", "Australia",
  "China", "Japan", "South Korea", "Turkey", "Pakistan", "Bangladesh",
  "Nigeria", "South Africa", "Others",
]

const STATUS_OPTS: { value: LocalShipment["status"]; label: string }[] = [
  { value: "DRAFT",        label: "Draft" },
  { value: "SUBMITTED",    label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "ISSUED",       label: "Issued" },
  { value: "REJECTED",     label: "Rejected" },
]

const BLANK: Omit<LocalShipment, "id" | "shipmentNumber" | "createdAt"> = {
  certificateRef: "", companyName: "", products: "", batches: "",
  invoiceNumber: "", packingListRef: "", bolRef: "",
  containerNumbers: "", sealNumbers: "", productionDate: "", expiryDate: "",
  destinationCountry: "", importerName: "", portOfLoading: "", portOfDestination: "",
  status: "DRAFT",
}

function InputRow({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string; onChange?: (v: string) => void
  type?: string; placeholder?: string
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 3 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange?.(e.target.value)}
        readOnly={!onChange} placeholder={placeholder}
        style={{ width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.textDark, background: onChange ? "#fff" : "#f9fafb", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
        onFocus={e => onChange && (e.target.style.borderColor = C.primary)}
        onBlur={e => (e.target.style.borderColor = C.border)} />
    </div>
  )
}

function TextRow({ label, value, onChange, rows = 2, placeholder }: {
  label: string; value: string; onChange?: (v: string) => void
  rows?: number; placeholder?: string
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 3 }}>{label}</label>
      <textarea value={value} onChange={e => onChange?.(e.target.value)}
        readOnly={!onChange} rows={rows} placeholder={placeholder}
        style={{ width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.textDark, background: onChange ? "#fff" : "#f9fafb", outline: "none", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }}
        onFocus={e => onChange && (e.target.style.borderColor = C.primary)}
        onBlur={e => (e.target.style.borderColor = C.border)} />
    </div>
  )
}

function SelectRow({ label, value, onChange, options }: {
  label: string; value: string; onChange?: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 3 }}>{label}</label>
      <select value={value} onChange={e => onChange?.(e.target.value)} disabled={!onChange}
        style={{ width: "100%", padding: "7px 10px", border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.textDark, background: "#fff", outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
        <option value="">— select —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<LocalShipment[]>(() => lsArr(STORAGE_KEY))
  const [search, setSearch]     = useState("")
  const [statusF, setStatusF]   = useState("")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ ...BLANK })
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const genCerts: LocalGeneratedCertificate[] = lsArr("hcs_gen_certs")

  const certOptions = genCerts
    .filter(c => c.status === "ACTIVE")
    .map(c => ({ value: c.certificateNumber, label: `${c.certificateNumber} — ${c.companyName}` }))

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase()
    const matchSearch = !q || s.shipmentNumber.toLowerCase().includes(q) || s.companyName.toLowerCase().includes(q) || s.certificateRef.toLowerCase().includes(q)
    const matchStatus = !statusF || s.status === statusF
    return matchSearch && matchStatus
  })

  const saveShipment = () => {
    if (!form.certificateRef && !form.companyName) {
      return
    }
    const id = uid()
    const certNum = form.certificateRef ? genCerts.find(c => c.certificateNumber === form.certificateRef) : null
    const newShipment: LocalShipment = {
      ...form,
      id,
      shipmentNumber: `SHP-${Date.now().toString().slice(-6)}`,
      companyName: form.companyName || certNum?.companyName || "",
      createdAt: new Date().toISOString(),
    }
    const updated = [...shipments, newShipment]
    setShipments(updated)
    lsSave(STORAGE_KEY, updated)
    setForm({ ...BLANK })
    setShowForm(false)
  }

  const updateStatus = (id: string, status: LocalShipment["status"]) => {
    const updated = shipments.map(s => s.id === id ? { ...s, status } : s)
    setShipments(updated)
    lsSave(STORAGE_KEY, updated)
  }

  const removeShipment = (id: string) => {
    const updated = shipments.filter(s => s.id !== id)
    setShipments(updated)
    lsSave(STORAGE_KEY, updated)
  }

  const counts = {
    total: shipments.length,
    draft: shipments.filter(s => s.status === "DRAFT").length,
    issued: shipments.filter(s => s.status === "ISSUED").length,
    pending: shipments.filter(s => ["SUBMITTED", "UNDER_REVIEW"].includes(s.status)).length,
  }

  return (
    <OfficeLayout title="Shipments">
      <div style={{ padding: "0 0 40px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Shipments", value: counts.total,   accent: C.primary  },
            { label: "Draft",           value: counts.draft,   accent: C.muted    },
            { label: "Pending Review",  value: counts.pending, accent: "#ffb900"  },
            { label: "Issued",          value: counts.issued,  accent: "#107c10"  },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4"
              style={{ background: C.white, border: `1px solid ${C.border}`, boxShadow: C.cardShadow }}>
              <p style={{ fontSize: 13, color: C.muted }}>{s.label}</p>
              <p style={{ fontSize: 26, fontWeight: 700, color: s.accent, marginTop: 2 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
            <Search size={15} color={C.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            <input type="text" placeholder="Search shipment, company, certificate…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 10px 8px 32px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
              onFocus={e => (e.target.style.borderColor = C.primary)}
              onBlur={e => (e.target.style.borderColor = C.border)} />
          </div>
          <select value={statusF} onChange={e => setStatusF(e.target.value)}
            style={{ padding: "8px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, background: "#fff", outline: "none", cursor: "pointer", fontFamily: "inherit" }}>
            <option value="">All Statuses</option>
            {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button onClick={() => setShipments(lsArr(STORAGE_KEY))}
            style={{ padding: "8px 10px", border: `1px solid ${C.border}`, borderRadius: 8, background: C.white, color: C.muted, cursor: "pointer" }}>
            <RefreshCw size={15} />
          </button>
          <button onClick={() => { setForm({ ...BLANK }); setShowForm(true) }}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: C.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginLeft: "auto" }}
            onMouseOver={e => (e.currentTarget.style.background = C.primaryHover)}
            onMouseOut={e => (e.currentTarget.style.background = C.primary)}>
            <Plus size={15} />New Shipment Request
          </button>
        </div>

        {/* New Shipment Form */}
        {showForm && (
          <div style={{ border: `2px solid ${C.primary}`, borderRadius: 12, padding: 20, marginBottom: 20, background: "#f8fcff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Ship size={16} color={C.primary} />
                <span style={{ fontWeight: 700, fontSize: 14, color: C.textDark }}>New Shipment / Export Document Request</span>
              </div>
              <button onClick={() => setShowForm(false)} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: C.muted }}><X size={18} /></button>
            </div>

            <div style={{ padding: "10px 14px", background: "#e0f0ff", borderRadius: 8, marginBottom: 16, fontSize: 12, color: "#0057a3" }}>
              Shipment documents can only be issued against an active halal certificate. Select the certificate reference below and verify that the shipped products, batches, and destination match the certified scope.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0 16px" }}>
              <SelectRow label="Certificate Reference *"
                value={form.certificateRef}
                options={[
                  ...certOptions,
                  { value: "MANUAL", label: "Enter manually (certificate not in system)" }
                ]}
                onChange={v => {
                  const cert = genCerts.find(c => c.certificateNumber === v)
                  setForm(f => ({ ...f, certificateRef: v, companyName: cert?.companyName ?? f.companyName, products: cert?.products ?? f.products }))
                }}
              />
              <InputRow label="Company Name" value={form.companyName} onChange={v => setForm(f => ({ ...f, companyName: v }))} placeholder="Auto-filled from certificate or enter manually" />
              <TextRow label="Products / Items Shipped *" value={form.products} rows={2} onChange={v => setForm(f => ({ ...f, products: v }))} placeholder="List product names, codes, and quantities…" />
              <TextRow label="Batch / Lot Numbers" value={form.batches} rows={2} onChange={v => setForm(f => ({ ...f, batches: v }))} placeholder="Batch/lot numbers for traceability…" />
              <InputRow label="Invoice Number *" value={form.invoiceNumber} onChange={v => setForm(f => ({ ...f, invoiceNumber: v }))} placeholder="Commercial invoice number" />
              <InputRow label="Packing List Reference" value={form.packingListRef} onChange={v => setForm(f => ({ ...f, packingListRef: v }))} placeholder="Packing list or document ref" />
              <InputRow label="Bill of Lading / Airway Bill / D/O" value={form.bolRef} onChange={v => setForm(f => ({ ...f, bolRef: v }))} placeholder="Transport document reference" />
              <InputRow label="Container Numbers" value={form.containerNumbers} onChange={v => setForm(f => ({ ...f, containerNumbers: v }))} placeholder="e.g. MSCU1234567, HLXU9876543" />
              <InputRow label="Seal Numbers" value={form.sealNumbers} onChange={v => setForm(f => ({ ...f, sealNumbers: v }))} placeholder="Container seal numbers" />
              <InputRow label="Production Date" value={form.productionDate} type="date" onChange={v => setForm(f => ({ ...f, productionDate: v }))} />
              <InputRow label="Best Before / Expiry Date" value={form.expiryDate} type="date" onChange={v => setForm(f => ({ ...f, expiryDate: v }))} />
              <SelectRow label="Destination Country *" value={form.destinationCountry}
                options={DEST_COUNTRIES.map(c => ({ value: c, label: c }))}
                onChange={v => setForm(f => ({ ...f, destinationCountry: v }))}
              />
              <InputRow label="Importer / Consignee Name" value={form.importerName} onChange={v => setForm(f => ({ ...f, importerName: v }))} placeholder="Importing company or agent" />
              <InputRow label="Port of Loading" value={form.portOfLoading} onChange={v => setForm(f => ({ ...f, portOfLoading: v }))} placeholder="e.g. Port Klang, KLIA Cargo" />
              <InputRow label="Port of Destination" value={form.portOfDestination} onChange={v => setForm(f => ({ ...f, portOfDestination: v }))} placeholder="e.g. Jebel Ali, Dammam" />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={saveShipment}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: C.primary, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                onMouseOver={e => (e.currentTarget.style.background = C.primaryHover)}
                onMouseOut={e => (e.currentTarget.style.background = C.primary)}>
                <Save size={14} />Save Request
              </button>
              <button onClick={() => { saveShipment(); }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 18px", background: "#107c10", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                onMouseOver={e => (e.currentTarget.style.background = "#0a5e0a")}
                onMouseOut={e => (e.currentTarget.style.background = "#107c10")}>
                <Ship size={14} />Save & Submit
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: "8px 14px", background: "#f3f4f6", color: C.muted, border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Shipments list */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0", background: C.white, borderRadius: 12, border: `1px solid ${C.border}` }}>
            <Ship size={36} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontWeight: 600, color: C.muted }}>{shipments.length === 0 ? "No shipment requests yet" : "No results match your filters"}</p>
            {shipments.length === 0 && <p style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Create a shipment request linked to an active certificate to generate export documentation.</p>}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {filtered.map(s => {
              const st = getStatusStyle(s.status)
              const isExp = expandedId === s.id
              return (
                <div key={s.id} style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, overflow: "hidden", boxShadow: C.cardShadow }}>
                  {/* Row */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}
                    onClick={() => setExpandedId(isExp ? null : s.id)}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f0f7ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Ship size={16} color={C.primary} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: C.primary }}>{s.shipmentNumber}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: C.textDark }}>{s.companyName}</span>
                        {s.certificateRef && (
                          <span style={{ fontSize: 11, padding: "1px 8px", borderRadius: 20, background: "#e6f4e6", color: "#107c10", fontWeight: 600 }}>Cert: {s.certificateRef}</span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 10, marginTop: 3, flexWrap: "wrap" }}>
                        {s.destinationCountry && <span style={{ fontSize: 12, color: C.muted }}>→ {s.destinationCountry}</span>}
                        {s.invoiceNumber && <span style={{ fontSize: 12, color: C.muted }}>INV: {s.invoiceNumber}</span>}
                        <span style={{ fontSize: 12, color: C.muted }}>{formatDate(s.createdAt)}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: st.bg, color: st.color }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: st.dot }} />{st.label}
                      </span>
                      {isExp ? <ChevronUp size={14} color={C.muted} /> : <ChevronDown size={14} color={C.muted} />}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExp && (
                    <div style={{ padding: "0 16px 16px", borderTop: `1px solid ${C.border}` }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, paddingTop: 14, marginBottom: 14 }}>
                        {[
                          ["Products", s.products],
                          ["Batches / Lots", s.batches],
                          ["Invoice", s.invoiceNumber],
                          ["Packing List", s.packingListRef],
                          ["Bill of Lading / AWB", s.bolRef],
                          ["Container Numbers", s.containerNumbers],
                          ["Seal Numbers", s.sealNumbers],
                          ["Production Date", s.productionDate ? formatDate(s.productionDate) : ""],
                          ["Expiry Date", s.expiryDate ? formatDate(s.expiryDate) : ""],
                          ["Destination Country", s.destinationCountry],
                          ["Importer", s.importerName],
                          ["Port of Loading", s.portOfLoading],
                          ["Port of Destination", s.portOfDestination],
                        ].filter(([, v]) => v).map(([label, value]) => (
                          <div key={label}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>{label}</p>
                            <p style={{ fontSize: 13, color: C.textDark }}>{value}</p>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
                        <span style={{ fontSize: 12, color: C.muted, alignSelf: "center" }}>Update status:</span>
                        {STATUS_OPTS.map(o => (
                          <button key={o.value} onClick={() => updateStatus(s.id, o.value)}
                            style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${s.status === o.value ? "#107c10" : C.border}`, background: s.status === o.value ? "#e6f4e6" : "#fff", color: s.status === o.value ? "#107c10" : C.muted, fontSize: 12, fontWeight: s.status === o.value ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                            {o.label}
                          </button>
                        ))}
                        {s.status === "ISSUED" && s.certificateRef && (
                          <a href={`/verify/${s.certificateRef}`} target="_blank" rel="noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 8, background: "#f0f7ff", color: C.primary, fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                            <ExternalLink size={12} />View Certificate
                          </a>
                        )}
                        <button onClick={() => removeShipment(s.id)}
                          style={{ marginLeft: "auto", padding: "5px 12px", borderRadius: 8, background: "#fde7e9", color: "#d13438", border: "none", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </OfficeLayout>
  )
}
