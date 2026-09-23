import React, { useState, useRef, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft, Type, Minus, Square, QrCode, Image as ImageIcon,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Save, Eye, Trash2, Copy, LayoutTemplate, Plus, X, Lock, Unlock,
  Check, ChevronDown, Database,
} from "lucide-react"
import OfficeLayout from "./OfficeLayout"

const F = "'Inter', system-ui, sans-serif"
const BLUE = "#2563eb"
const NAVY = "#0f2170"
const CANVAS_W = 660
const CANVAS_H = 932

// ── Types ──────────────────────────────────────────────────────────────────────
type EType = "text" | "field" | "line" | "rect" | "qr" | "image"

interface CertElement {
  id: string
  type: EType
  x: number   // px on canvas
  y: number
  w: number
  h: number
  content: string
  fontSize: number
  fontFamily: string
  fontWeight: "normal" | "bold"
  fontStyle: "normal" | "italic"
  textDecoration: "none" | "underline"
  color: string
  textAlign: "left" | "center" | "right"
  background: string
  borderWidth: number
  borderColor: string
  borderStyle: string
  borderRadius: number
  letterSpacing: number
  lineHeight: number
  opacity: number
  locked?: boolean
}

interface CertDesign {
  name: string
  background: string
  outerBorderWidth: number
  outerBorderColor: string
  outerBorderStyle: string
  frame?: string
  frameBack?: boolean
  pages: CertElement[][]
}

// ── Constants ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "hcs_cert_designer_v2"

const DATA_FIELDS: { key: string; label: string }[] = [
  { key: "{{companyName}}",    label: "Company Name"          },
  { key: "{{clientId}}",       label: "Client ID"             },
  { key: "{{certNumber}}",     label: "Certificate Number"    },
  { key: "{{issueDate}}",      label: "Issue Date"            },
  { key: "{{expiryDate}}",     label: "Expiry Date"           },
  { key: "{{halalStandard}}",  label: "Halal Standard"        },
  { key: "{{scope}}",          label: "Scope of Certification"},
  { key: "{{address}}",        label: "Company Address"       },
  { key: "{{country}}",        label: "Country"               },
  { key: "{{hcbName}}",        label: "Certifying Body"       },
  { key: "{{ceoName}}",        label: "CEO / Director"        },
  { key: "{{products}}",       label: "Products List"         },
  { key: "{{productCategory}}", label: "Product Category"     },
]

const FONTS = [
  "Inter", "Georgia", "Times New Roman", "Garamond",
  "Palatino Linotype", "Arial", "Trebuchet MS", "Courier New",
]

const BORDER_STYLES = ["solid", "dashed", "dotted", "double", "groove", "ridge"]

const uid = () => Math.random().toString(36).slice(2, 9)

// ── Default element ────────────────────────────────────────────────────────────
function defaultEl(type: EType, content = ""): CertElement {
  const base: CertElement = {
    id: uid(), type, content,
    x: CANVAS_W / 2 - 120, y: CANVAS_H / 2 - 20,
    w: 240, h: 40,
    fontSize: 13, fontFamily: "Inter", fontWeight: "normal",
    fontStyle: "normal", textDecoration: "none",
    color: "#111827", textAlign: "center",
    background: "transparent",
    borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid",
    borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1,
  }
  if (type === "text")  return { ...base, content: "Text block", w: 240, h: 36 }
  if (type === "field") return { ...base, content: content || "{{companyName}}", w: 280, h: 36, fontWeight: "bold", color: NAVY }
  if (type === "line")  return { ...base, w: 400, h: 2, background: "#b8860b", color: "#b8860b", y: CANVAS_H / 2 }
  if (type === "rect")  return { ...base, w: 280, h: 80, background: "transparent", borderWidth: 1, borderColor: "#d1d5db" }
  if (type === "qr")    return { ...base, w: 90, h: 90, content: "{{certNumber}}" }
  if (type === "image") return { ...base, w: 120, h: 80, content: "", background: "#f1f5f9" }
  return base
}

// ── Templates ──────────────────────────────────────────────────────────────────
function classicTemplate(): CertDesign {
  return {
    name: "Classic",
    background: "#fffef9",
    outerBorderWidth: 8,
    outerBorderColor: "#b8860b",
    outerBorderStyle: "double",
    pages: [[
      { id: uid(), type: "line",  x: 30,  y: 58,  w: 600, h: 2,  content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#b8860b", textAlign: "center", background: "#b8860b", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 80,  y: 76,  w: 500, h: 44, content: "HALAL CERTIFICATE", fontSize: 30, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#1a3a1a", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 5, lineHeight: 1.3, opacity: 1 },
      { id: uid(), type: "text",  x: 180, y: 124, w: 300, h: 30, content: "شهادة حلال", fontSize: 18, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#b8860b", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "text",  x: 80,  y: 170, w: 500, h: 24, content: "Awarded to:", fontSize: 13, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "italic", textDecoration: "none", color: "#374151", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 60,  y: 198, w: 540, h: 40, content: "{{companyName}}", fontSize: 24, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: NAVY, textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.3, opacity: 1 },
      { id: uid(), type: "field", x: 130, y: 242, w: 400, h: 22, content: "{{address}}", fontSize: 11, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#4b5563", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "line",  x: 80,  y: 278, w: 500, h: 1,  content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#d1d5db", textAlign: "center", background: "#d1d5db", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 50,  y: 292, w: 560, h: 56, content: "Halal Quality Control hereby awards this Halal Certificate to the above mentioned company which has been found in compliance with the required Halal certification criteria.", fontSize: 11, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#374151", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.7, opacity: 1 },
      { id: uid(), type: "text",  x: 50,  y: 368, w: 220, h: 20, content: "Reference Halal Standards:", fontSize: 10, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 278, y: 368, w: 340, h: 20, content: "{{halalStandard}}", fontSize: 10, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: NAVY, textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 50,  y: 396, w: 220, h: 20, content: "Scope of Certification:", fontSize: 10, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 278, y: 396, w: 340, h: 40, content: "{{scope}}", fontSize: 10, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#374151", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 50,  y: 444, w: 220, h: 20, content: "Product Category:", fontSize: 10, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 278, y: 444, w: 340, h: 20, content: "{{productCategory}}", fontSize: 10, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#374151", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 50,  y: 472, w: 220, h: 20, content: "For the Products:", fontSize: 10, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 278, y: 472, w: 340, h: 20, content: "{{products}}", fontSize: 10, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#374151", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "line",  x: 50,  y: 508, w: 560, h: 1,  content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#d1d5db", textAlign: "center", background: "#d1d5db", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 50,  y: 530, w: 400, h: 44, content: "This Halal Certificate is the sole property of the Halal approved company and is not to be shared with unauthorized parties.", fontSize: 10, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "italic", textDecoration: "none", color: "#6b7280", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.6, opacity: 1 },
      { id: uid(), type: "text",  x: 50,  y: 620, w: 180, h: 18, content: "Chief Executive Officer:", fontSize: 10, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 50,  y: 642, w: 220, h: 20, content: "{{ceoName}}", fontSize: 11, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 50,  y: 666, w: 280, h: 18, content: "{{hcbName}}", fontSize: 10, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#6b7280", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "qr",    x: 500, y: 590, w: 90,  h: 90, content: "{{certNumber}}", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "center", background: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 4, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "rect",  x: 350, y: 700, w: 260, h: 100, content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "#f8fafc", borderWidth: 1, borderColor: "#d1d5db", borderStyle: "solid", borderRadius: 4, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 360, y: 712, w: 100, h: 18, content: "Client ID:", fontSize: 9, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#374151", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 464, y: 712, w: 136, h: 18, content: "{{clientId}}", fontSize: 9, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 360, y: 734, w: 100, h: 18, content: "Issue Date:", fontSize: 9, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#374151", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 464, y: 734, w: 136, h: 18, content: "{{issueDate}}", fontSize: 9, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 360, y: 756, w: 100, h: 18, content: "Expiry Date:", fontSize: 9, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#374151", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 464, y: 756, w: 136, h: 18, content: "{{expiryDate}}", fontSize: 9, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 360, y: 778, w: 100, h: 18, content: "Cert. No:", fontSize: 9, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#374151", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 464, y: 778, w: 136, h: 18, content: "{{certNumber}}", fontSize: 9, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "line",  x: 30,  y: 870, w: 600, h: 2,  content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#b8860b", textAlign: "center", background: "#b8860b", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 60,  y: 878, w: 540, h: 34, content: "{{hcbName}}", fontSize: 9, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#6b7280", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.6, opacity: 1 },
    ]],
  }
}

function modernTemplate(): CertDesign {
  return {
    name: "Modern",
    background: "#ffffff",
    outerBorderWidth: 0,
    outerBorderColor: "#e2e8f0",
    outerBorderStyle: "solid",
    pages: [[
      { id: uid(), type: "rect",  x: 0,   y: 0,   w: CANVAS_W, h: 100, content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#fff", textAlign: "center", background: NAVY, borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 50,  y: 22,  w: 560, h: 38, content: "HALAL CERTIFICATE", fontSize: 26, fontFamily: "Inter", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#ffffff", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 5, lineHeight: 1.3, opacity: 1 },
      { id: uid(), type: "text",  x: 180, y: 62,  w: 300, h: 26, content: "شهادة حلال", fontSize: 16, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "rgba(255,255,255,0.65)", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "rect",  x: 0,   y: 100, w: CANVAS_W, h: 5,  content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#fff", textAlign: "center", background: BLUE, borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 80,  y: 134, w: 500, h: 22, content: "This is to certify that", fontSize: 12, fontFamily: "Inter", fontWeight: "normal", fontStyle: "italic", textDecoration: "none", color: "#6b7280", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 60,  y: 160, w: 540, h: 40, content: "{{companyName}}", fontSize: 24, fontFamily: "Inter", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: NAVY, textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.3, opacity: 1 },
      { id: uid(), type: "field", x: 130, y: 204, w: 400, h: 20, content: "{{address}}", fontSize: 11, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#6b7280", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "rect",  x: 240, y: 238, w: 180, h: 2,  content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: BLUE, textAlign: "center", background: BLUE, borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 50,  y: 256, w: 560, h: 50, content: "has been audited and certified to be in full compliance with Halal certification requirements and is hereby awarded the Halal Certificate.", fontSize: 11, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#374151", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.7, opacity: 1 },
      { id: uid(), type: "line",  x: 50,  y: 322, w: 560, h: 1,  content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#e5e7eb", textAlign: "center", background: "#e5e7eb", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 60,  y: 338, w: 540, h: 16, content: "HALAL STANDARD", fontSize: 9, fontFamily: "Inter", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#9ca3af", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 2, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 60,  y: 358, w: 540, h: 22, content: "{{halalStandard}}", fontSize: 13, fontFamily: "Inter", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "line",  x: 50,  y: 390, w: 560, h: 1,  content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#e5e7eb", textAlign: "center", background: "#e5e7eb", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 60,  y: 404, w: 540, h: 16, content: "SCOPE OF CERTIFICATION", fontSize: 9, fontFamily: "Inter", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#9ca3af", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 2, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 60,  y: 424, w: 540, h: 40, content: "{{scope}}", fontSize: 12, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#374151", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "line",  x: 50,  y: 474, w: 560, h: 1,  content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#e5e7eb", textAlign: "center", background: "#e5e7eb", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 60,  y: 490, w: 160, h: 16, content: "ISSUE DATE", fontSize: 9, fontFamily: "Inter", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#9ca3af", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 2, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 60,  y: 510, w: 160, h: 22, content: "{{issueDate}}", fontSize: 13, fontFamily: "Inter", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "text",  x: 270, y: 490, w: 160, h: 16, content: "EXPIRY DATE", fontSize: 9, fontFamily: "Inter", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#9ca3af", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 2, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 270, y: 510, w: 160, h: 22, content: "{{expiryDate}}", fontSize: 13, fontFamily: "Inter", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "text",  x: 480, y: 490, w: 140, h: 16, content: "CERT. NO", fontSize: 9, fontFamily: "Inter", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#9ca3af", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 2, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 480, y: 510, w: 140, h: 22, content: "{{certNumber}}", fontSize: 11, fontFamily: "Inter", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: BLUE, textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "line",  x: 50,  y: 546, w: 560, h: 1,  content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#e5e7eb", textAlign: "center", background: "#e5e7eb", borderWidth: 0, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 60,  y: 580, w: 220, h: 44, content: "________________________", fontSize: 14, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#d1d5db", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 60,  y: 628, w: 220, h: 22, content: "{{ceoName}}", fontSize: 12, fontFamily: "Inter", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "text",  x: 60,  y: 654, w: 220, h: 18, content: "Chief Executive Officer", fontSize: 10, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#6b7280", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "qr",    x: 510, y: 564, w: 100, h: 100, content: "{{certNumber}}", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "center", background: "#fff", borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 4, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "rect",  x: 0,   y: 888, w: CANVAS_W, h: 44, content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#fff", textAlign: "center", background: "#f8fafc", borderWidth: 1, borderColor: "#e5e7eb", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 60,  y: 898, w: 540, h: 24, content: "{{hcbName}}", fontSize: 10, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#6b7280", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
    ]],
  }
}

function elegantTemplate(): CertDesign {
  return {
    name: "Elegant",
    background: "#fdfcf8",
    outerBorderWidth: 10,
    outerBorderColor: "#1a3a1a",
    outerBorderStyle: "solid",
    pages: [[
      { id: uid(), type: "rect",  x: 16,  y: 16,  w: CANVAS_W - 32, h: CANVAS_H - 32, content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#b8860b", textAlign: "center", background: "transparent", borderWidth: 2, borderColor: "#b8860b", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 100, y: 40,  w: 460, h: 24, content: "✦ ✦ ✦", fontSize: 14, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#b8860b", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 6, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 80,  y: 74,  w: 500, h: 24, content: "{{hcbName}}", fontSize: 12, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "italic", textDecoration: "none", color: "#1a3a1a", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "text",  x: 60,  y: 108, w: 540, h: 48, content: "HALAL CERTIFICATE", fontSize: 32, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#1a3a1a", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 6, lineHeight: 1.3, opacity: 1 },
      { id: uid(), type: "text",  x: 100, y: 162, w: 460, h: 22, content: "───── ✦ ─────", fontSize: 14, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#b8860b", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 4, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 80,  y: 194, w: 500, h: 24, content: "This certificate is proudly awarded to", fontSize: 13, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "italic", textDecoration: "none", color: "#4b5563", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 60,  y: 224, w: 540, h: 44, content: "{{companyName}}", fontSize: 26, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#1a3a1a", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.3, opacity: 1 },
      { id: uid(), type: "field", x: 130, y: 272, w: 400, h: 22, content: "{{address}}", fontSize: 11, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#6b7280", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "text",  x: 100, y: 304, w: 460, h: 22, content: "───── ✦ ─────", fontSize: 14, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#b8860b", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 4, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 60,  y: 336, w: 540, h: 52, content: "has been audited and found to be in full compliance with Halal requirements and is hereby recognized as a Halal Certified entity.", fontSize: 12, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#374151", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.75, opacity: 1 },
      { id: uid(), type: "text",  x: 60,  y: 406, w: 260, h: 20, content: "Reference Halal Standard:", fontSize: 10, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#1a3a1a", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 328, y: 406, w: 280, h: 20, content: "{{halalStandard}}", fontSize: 10, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#1a3a1a", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 60,  y: 434, w: 260, h: 20, content: "Scope of Certification:", fontSize: 10, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#1a3a1a", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 328, y: 434, w: 280, h: 40, content: "{{scope}}", fontSize: 10, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#374151", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 60,  y: 484, w: 260, h: 20, content: "Issue Date:", fontSize: 10, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#1a3a1a", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 220, y: 484, w: 160, h: 20, content: "{{issueDate}}", fontSize: 10, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#374151", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 400, y: 484, w: 100, h: 20, content: "Expiry Date:", fontSize: 10, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#1a3a1a", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 506, y: 484, w: 120, h: 20, content: "{{expiryDate}}", fontSize: 10, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#374151", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 60,  y: 628, w: 220, h: 44, content: "________________________", fontSize: 14, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#9ca3af", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 60,  y: 676, w: 220, h: 22, content: "{{ceoName}}", fontSize: 11, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#1a3a1a", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "text",  x: 60,  y: 700, w: 220, h: 18, content: "Chief Executive Officer", fontSize: 9, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#6b7280", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.4, opacity: 1 },
      { id: uid(), type: "qr",    x: 500, y: 616, w: 110, h: 110, content: "{{certNumber}}", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "center", background: "#fff", borderWidth: 1, borderColor: "#d1d5db", borderStyle: "solid", borderRadius: 4, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "rect",  x: 60,  y: 750, w: 540, h: 80, content: "", fontSize: 13, fontFamily: "Inter", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 1, borderColor: "#d1d5db", borderStyle: "solid", borderRadius: 4, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 72,  y: 762, w: 120, h: 16, content: "Client ID:", fontSize: 9, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#6b7280", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 196, y: 762, w: 200, h: 16, content: "{{clientId}}", fontSize: 9, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 72,  y: 784, w: 120, h: 16, content: "Certificate No:", fontSize: 9, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#6b7280", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "field", x: 196, y: 784, w: 200, h: 16, content: "{{certNumber}}", fontSize: 9, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 72,  y: 806, w: 120, h: 16, content: "Page:", fontSize: 9, fontFamily: "Georgia", fontWeight: "bold", fontStyle: "normal", textDecoration: "none", color: "#6b7280", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 196, y: 806, w: 100, h: 16, content: "1 / 2", fontSize: 9, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#111827", textAlign: "left", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 0, lineHeight: 1.5, opacity: 1 },
      { id: uid(), type: "text",  x: 100, y: 870, w: 460, h: 24, content: "✦ ✦ ✦", fontSize: 14, fontFamily: "Georgia", fontWeight: "normal", fontStyle: "normal", textDecoration: "none", color: "#b8860b", textAlign: "center", background: "transparent", borderWidth: 0, borderColor: "transparent", borderStyle: "solid", borderRadius: 0, letterSpacing: 6, lineHeight: 1.5, opacity: 1 },
    ]],
  }
}

const TEMPLATES = [
  { label: "Classic",  fn: classicTemplate  },
  { label: "Modern",   fn: modernTemplate   },
  { label: "Elegant",  fn: elegantTemplate  },
]

// ── Storage ────────────────────────────────────────────────────────────────────
function loadDesign(): CertDesign {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s) {
      const d = JSON.parse(s)
      if (d.elements && !d.pages) { d.pages = [d.elements]; delete d.elements }
      if (!d.pages || !Array.isArray(d.pages) || d.pages.length === 0) d.pages = [[]]
      return d
    }
  } catch {}
  return classicTemplate()
}
function saveDesign(d: CertDesign) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
}

// ── QR visual placeholder ──────────────────────────────────────────────────────
function QRPlaceholder({ size }: { size: number }) {
  const cell = Math.floor(size / 7)
  const pattern = [
    [1,1,1,1,1,1,1],[1,0,1,0,1,0,1],[1,1,0,1,0,1,1],
    [1,0,1,0,1,0,1],[1,1,0,0,0,1,1],[1,0,1,0,1,0,1],[1,1,1,1,1,1,1],
  ]
  return (
    <div style={{ display:"grid", gridTemplateRows:`repeat(7,${cell}px)`, gridTemplateColumns:`repeat(7,${cell}px)`, gap:0 }}>
      {pattern.flatMap((row, r) => row.map((v, c) => (
        <div key={`${r}-${c}`} style={{ width:cell, height:cell, background: v ? "#111827" : "#fff" }} />
      )))}
    </div>
  )
}

// ── Render element on canvas ───────────────────────────────────────────────────
function renderEl(
  el: CertElement,
  selected: boolean,
  onClick: (e: React.MouseEvent) => void,
  onMouseDown: (e: React.MouseEvent) => void,
  elRef?: (node: HTMLElement | null) => void,
) {
  const borderStr = el.borderWidth > 0
    ? `${el.borderWidth}px ${el.borderStyle} ${el.borderColor}`
    : "none"

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: el.x, top: el.y, width: el.w, height: el.h,
    opacity: el.opacity,
    cursor: el.locked ? "default" : "move",
    outline: selected ? `2px solid ${BLUE}` : "none",
    outlineOffset: 1,
    userSelect: "none",
    boxSizing: "border-box",
  }

  if (el.type === "line") {
    return (
      <div key={el.id} ref={elRef} style={{ ...baseStyle, background: el.color || el.background }}
        onClick={onClick} onMouseDown={onMouseDown} />
    )
  }

  if (el.type === "rect") {
    return (
      <div key={el.id} ref={elRef} style={{ ...baseStyle, background: el.background, border: borderStr, borderRadius: el.borderRadius }}
        onClick={onClick} onMouseDown={onMouseDown} />
    )
  }

  if (el.type === "qr") {
    return (
      <div key={el.id} ref={elRef} style={{ ...baseStyle, background: el.background, border: borderStr, borderRadius: el.borderRadius, display:"flex", alignItems:"center", justifyContent:"center" }}
        onClick={onClick} onMouseDown={onMouseDown}>
        <QRPlaceholder size={Math.min(el.w, el.h) - 8} />
      </div>
    )
  }

  if (el.type === "image") {
    return (
      <div key={el.id} ref={elRef} style={{ ...baseStyle, background: el.content ? "transparent" : (el.background || "#f1f5f9"), border: el.content ? "none" : `1.5px dashed #94a3b8`, borderRadius: el.borderRadius, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:4, overflow:"hidden" }}
        onClick={onClick} onMouseDown={onMouseDown}>
        {el.content
          ? <img src={el.content} alt="" style={{ width:"100%", height:"100%", objectFit:"contain", display:"block", pointerEvents:"none" }} />
          : <><ImageIcon size={16} color="#94a3b8" /><span style={{ fontSize:9, color:"#94a3b8", fontFamily:F }}>Image</span></>
        }
      </div>
    )
  }

  // text / field
  const isField = el.type === "field"
  return (
    <div key={el.id} ref={elRef}
      style={{
        ...baseStyle,
        fontSize: el.fontSize,
        fontFamily: el.fontFamily,
        fontWeight: el.fontWeight,
        fontStyle: el.fontStyle,
        textDecoration: el.textDecoration,
        color: el.color,
        textAlign: el.textAlign,
        background: isField ? "rgba(219,234,254,0.18)" : (el.background === "transparent" ? "transparent" : el.background),
        border: isField ? (selected ? `2px solid ${BLUE}` : "1px dashed #93c5fd") : borderStr,
        borderRadius: el.borderRadius,
        letterSpacing: el.letterSpacing,
        lineHeight: el.lineHeight,
        padding: "2px 4px",
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        display:"flex", alignItems:"center",
        justifyContent: el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start",
      }}
      onClick={onClick} onMouseDown={onMouseDown}>
      {el.content}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CertificateDesignerPage() {
  const navigate = useNavigate()
  const [design, setDesign] = useState<CertDesign>(loadDesign)
  const [currentPage, setCurrentPage] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [saved, setSaved] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ id: string; startMX: number; startMY: number; origX: number; origY: number; node: HTMLElement } | null>(null)
  const elRefs = useRef<Map<string, HTMLElement>>(new Map())

  const pageElements = design.pages[currentPage] ?? []
  const selected = pageElements.find(e => e.id === selectedId) ?? null

  function setPageEls(updater: (els: CertElement[]) => CertElement[]) {
    setDesign(d => ({ ...d, pages: d.pages.map((p, i) => i === currentPage ? updater(p) : p) }))
  }

  function addPage() {
    setDesign(d => ({ ...d, pages: [...d.pages, []] }))
    setCurrentPage(design.pages.length)
    setSelectedId(null)
  }

  function deletePage(idx: number) {
    if (design.pages.length <= 1) return
    const next = Math.min(idx, design.pages.length - 2)
    setDesign(d => ({ ...d, pages: d.pages.filter((_, i) => i !== idx) }))
    setCurrentPage(next)
    setSelectedId(null)
  }

  // ── Drag on canvas — DOM-only during move, commit on mouseup ─────────────────
  const handleElMouseDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const el = (design.pages[currentPage] ?? []).find(x => x.id === id)
    if (!el || el.locked) return
    const node = elRefs.current.get(id)
    if (!node) return
    setSelectedId(id)
    dragRef.current = { id, startMX: e.clientX, startMY: e.clientY, origX: el.x, origY: el.y, node }
  }, [design.pages, currentPage])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startMX
      const dy = e.clientY - dragRef.current.startMY
      dragRef.current.node.style.left = `${Math.round(Math.max(0, dragRef.current.origX + dx))}px`
      dragRef.current.node.style.top  = `${Math.round(Math.max(0, dragRef.current.origY + dy))}px`
    }
    const onUp = (e: MouseEvent) => {
      if (!dragRef.current) return
      const dx = e.clientX - dragRef.current.startMX
      const dy = e.clientY - dragRef.current.startMY
      const newX = Math.round(Math.max(0, dragRef.current.origX + dx))
      const newY = Math.round(Math.max(0, dragRef.current.origY + dy))
      const id = dragRef.current.id
      dragRef.current = null
      setDesign(d => ({ ...d, pages: d.pages.map((p, i) => i === currentPage ? p.map(el => el.id === id ? { ...el, x: newX, y: newY } : el) : p) }))
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp) }
  }, [currentPage])

  // ── Add element ──────────────────────────────────────────────────────────────
  function addElement(type: EType, content = "") {
    const el = defaultEl(type, content)
    setPageEls(els => [...els, el])
    setSelectedId(el.id)
  }

  // ── Update selected ──────────────────────────────────────────────────────────
  function upd<K extends keyof CertElement>(key: K, val: CertElement[K]) {
    if (!selectedId) return
    setPageEls(els => els.map(e => e.id === selectedId ? { ...e, [key]: val } : e))
  }

  function deleteSelected() {
    if (!selectedId) return
    setPageEls(els => els.filter(e => e.id !== selectedId))
    setSelectedId(null)
  }

  function duplicateSelected() {
    if (!selected) return
    const clone = { ...selected, id: uid(), x: selected.x + 16, y: selected.y + 16 }
    setPageEls(els => [...els, clone])
    setSelectedId(clone.id)
  }

  function handleSave() {
    saveDesign(design)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const BtnSm = ({ onClick, active, children, title }: { onClick: () => void; active?: boolean; children: React.ReactNode; title?: string }) => (
    <button title={title} onClick={onClick} style={{ display:"flex", alignItems:"center", justifyContent:"center", width:28, height:28, borderRadius:6, border:`1px solid ${active ? BLUE : "#e2e8f0"}`, background: active ? "#eff6ff" : "#fff", color: active ? BLUE : "#374151", cursor:"pointer", flexShrink:0 }}>
      {children}
    </button>
  )

  const Label = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize:10, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:4, fontFamily:F }}>{children}</div>
  )

  const Input = ({ value, onChange, type = "text", min, max, step, style }: any) => (
    <input type={type} value={value} min={min} max={max} step={step} onChange={e => onChange(e.target.value)}
      style={{ width:"100%", padding:"5px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, color:"#111827", fontFamily:F, outline:"none", boxSizing:"border-box" as const, ...style }} />
  )

  return (
    <OfficeLayout title="Certificate Designer">
      <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 130px)", fontFamily:F, margin:"-1.75rem -2rem", overflow:"hidden" }}>

        {/* ── Top toolbar ────────────────────────────────────────────────────── */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", background:"#fff", borderBottom:"1px solid #e2e8f0", flexShrink:0 }}>
          <button onClick={() => navigate("/office/settings?tab=certificate")}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:7, border:"1px solid #e2e8f0", background:"#f8fafc", color:"#374151", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:F }}>
            <ArrowLeft size={14} /> Back
          </button>

          <div style={{ width:1, height:24, background:"#e2e8f0" }} />

          {/* Templates */}
          <div style={{ position:"relative" }}>
            <button onClick={() => setShowTemplates(v => !v)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:7, border:"1px solid #e2e8f0", background:"#f8fafc", color:"#374151", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:F }}>
              <LayoutTemplate size={14} /> Templates <ChevronDown size={12} />
            </button>
            {showTemplates && (
              <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:100, overflow:"hidden", minWidth:160 }}>
                {TEMPLATES.map(t => (
                  <button key={t.label} onClick={() => { setDesign(t.fn()); setSelectedId(null); setCurrentPage(0); setShowTemplates(false) }}
                    style={{ display:"block", width:"100%", padding:"9px 14px", textAlign:"left", background:"transparent", border:"none", fontSize:13, color:"#111827", cursor:"pointer", fontFamily:F, fontWeight:500 }}
                    onMouseOver={e => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ width:1, height:24, background:"#e2e8f0" }} />

          {/* Canvas background */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>BG</span>
            <input type="color" value={design.background} onChange={e => setDesign(d => ({ ...d, background: e.target.value }))}
              style={{ width:28, height:28, borderRadius:6, border:"1px solid #e2e8f0", cursor:"pointer", padding:2 }} />
          </div>

          {/* Outer border */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>Border</span>
            <input type="number" min={0} max={20} value={design.outerBorderWidth} onChange={e => setDesign(d => ({ ...d, outerBorderWidth: +e.target.value }))}
              style={{ width:44, padding:"4px 6px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, textAlign:"center" }} />
            <input type="color" value={design.outerBorderColor} onChange={e => setDesign(d => ({ ...d, outerBorderColor: e.target.value }))}
              style={{ width:28, height:28, borderRadius:6, border:"1px solid #e2e8f0", cursor:"pointer", padding:2 }} />
            <select value={design.outerBorderStyle} onChange={e => setDesign(d => ({ ...d, outerBorderStyle: e.target.value }))}
              style={{ padding:"4px 6px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:11, cursor:"pointer" }}>
              {BORDER_STYLES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Frame overlay */}
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontSize:11, color:"#6b7280", fontWeight:600 }}>Frame</span>
            <label title={`Upload a frame image — recommended size: ${CANVAS_W}×${CANVAS_H}px (PNG with transparency)`}
              style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:6, border:"1px solid #e2e8f0", background: design.frame ? "#eff6ff" : "#f8fafc", color: design.frame ? BLUE : "#374151", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:F, whiteSpace:"nowrap" }}>
              <ImageIcon size={12} />
              {design.frame ? "Change" : "Upload"}
              <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => {
                const f = e.target.files?.[0]
                if (!f) return
                const r = new FileReader()
                r.onload = ev => setDesign(d => ({ ...d, frame: ev.target?.result as string }))
                r.readAsDataURL(f)
                e.target.value = ""
              }} />
            </label>
            {design.frame && (
              <>
                <button onClick={() => setDesign(d => ({ ...d, frameBack: !d.frameBack }))}
                  title={design.frameBack ? "Frame is behind elements — click to bring to front" : "Frame is in front — click to send to back"}
                  style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 8px", borderRadius:6, border:`1px solid ${design.frameBack ? "#a3e635" : "#e2e8f0"}`, background: design.frameBack ? "#f7fee7" : "#f8fafc", color: design.frameBack ? "#4d7c0f" : "#374151", fontSize:11, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" }}>
                  {design.frameBack ? "Behind" : "In Front"}
                </button>
                <button onClick={() => setDesign(d => ({ ...d, frame: undefined }))}
                  title="Remove frame"
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", width:26, height:26, borderRadius:6, border:"1px solid #fecaca", background:"#fef2f2", color:"#dc2626", cursor:"pointer" }}>
                  <X size={12} />
                </button>
              </>
            )}
            <span style={{ fontSize:10, color:"#94a3b8" }}>{CANVAS_W}×{CANVAS_H}px</span>
          </div>

          <div style={{ flex:1 }} />

          {selected && (
            <>
              <BtnSm onClick={duplicateSelected} title="Duplicate"><Copy size={13} /></BtnSm>
              <BtnSm onClick={() => upd("locked", !selected.locked)} active={selected.locked} title={selected.locked ? "Unlock" : "Lock"}>
                {selected.locked ? <Lock size={13} /> : <Unlock size={13} />}
              </BtnSm>
              <BtnSm onClick={deleteSelected} title="Delete element"><Trash2 size={13} color="#dc2626" /></BtnSm>
              <div style={{ width:1, height:24, background:"#e2e8f0" }} />
            </>
          )}

          <button onClick={() => setShowPreview(true)}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:7, border:"1px solid #e2e8f0", background:"#f8fafc", color:"#374151", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:F }}>
            <Eye size={14} /> Preview
          </button>
          <button onClick={handleSave}
            style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", borderRadius:7, border:"none", background: saved ? "#16a34a" : NAVY, color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:F }}>
            {saved ? <Check size={14} /> : <Save size={14} />} {saved ? "Saved!" : "Save"}
          </button>
        </div>

        {/* ── Page tabs ───────────────────────────────────────────────────────── */}
        <div style={{ display:"flex", alignItems:"center", gap:4, padding:"6px 16px", background:"#fff", borderBottom:"1px solid #e2e8f0", flexShrink:0, overflowX:"auto" }}>
          {design.pages.map((_, idx) => (
            <div key={idx} style={{ display:"flex", alignItems:"center", gap:0 }}>
              <button
                onClick={() => { setCurrentPage(idx); setSelectedId(null) }}
                style={{ padding:"4px 14px", borderRadius: design.pages.length > 1 ? "6px 0 0 6px" : 6, border:`1px solid ${currentPage === idx ? BLUE : "#e2e8f0"}`, borderRight: design.pages.length > 1 ? "none" : undefined, background: currentPage === idx ? "#eff6ff" : "#f8fafc", color: currentPage === idx ? BLUE : "#374151", fontSize:12, fontWeight: currentPage === idx ? 700 : 500, cursor:"pointer", fontFamily:F, whiteSpace:"nowrap" }}>
                Page {idx + 1}
              </button>
              {design.pages.length > 1 && (
                <button onClick={() => deletePage(idx)} title="Delete page"
                  style={{ padding:"4px 6px", borderRadius:"0 6px 6px 0", border:`1px solid ${currentPage === idx ? BLUE : "#e2e8f0"}`, background: currentPage === idx ? "#eff6ff" : "#f8fafc", color:"#94a3b8", fontSize:11, cursor:"pointer", lineHeight:1 }}>
                  ×
                </button>
              )}
            </div>
          ))}
          <button onClick={addPage}
            style={{ display:"flex", alignItems:"center", gap:4, padding:"4px 10px", borderRadius:6, border:"1px dashed #cbd5e1", background:"#f8fafc", color:"#64748b", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:F }}>
            <Plus size={12} /> Add Page
          </button>
        </div>

        {/* ── 3-column layout ─────────────────────────────────────────────────── */}
        <div style={{ display:"flex", flex:1, overflow:"hidden" }}>

          {/* LEFT: Palette ───────────────────────────────────────────────────── */}
          <div style={{ width:220, background:"#f8fafc", borderRight:"1px solid #e2e8f0", overflowY:"auto", flexShrink:0 }}>
            <div style={{ padding:"12px 12px 6px" }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8 }}>Add Elements</div>
              <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                {[
                  { type:"text"  as EType, icon:<Type size={13} />,       label:"Text Block"       },
                  { type:"line"  as EType, icon:<Minus size={13} />,      label:"Horizontal Line"  },
                  { type:"rect"  as EType, icon:<Square size={13} />,     label:"Rectangle / Box"  },
                  { type:"qr"    as EType, icon:<QrCode size={13} />,     label:"QR Code"          },
                  { type:"image" as EType, icon:<ImageIcon size={13} />,  label:"Image Upload"     },
                ].map(({ type, icon, label }) => (
                  <button key={type} onClick={() => addElement(type)}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 10px", borderRadius:7, border:"1px solid #e2e8f0", background:"#fff", color:"#374151", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:F, textAlign:"left" }}
                    onMouseOver={e => (e.currentTarget.style.background = "#eff6ff")}
                    onMouseOut={e => (e.currentTarget.style.background = "#fff")}>
                    <span style={{ color:BLUE }}>{icon}</span>{label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ height:1, background:"#e2e8f0", margin:"8px 12px" }} />

            <div style={{ padding:"6px 12px 12px" }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#6b7280", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
                <Database size={11} />Data Fields
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                {DATA_FIELDS.map(f => (
                  <button key={f.key} onClick={() => addElement("field", f.key)}
                    style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 8px", borderRadius:6, border:"1px dashed #93c5fd", background:"rgba(219,234,254,0.3)", color:"#1d4ed8", fontSize:11, fontWeight:500, cursor:"pointer", fontFamily:F, textAlign:"left" }}
                    onMouseOver={e => (e.currentTarget.style.background = "#eff6ff")}
                    onMouseOut={e => (e.currentTarget.style.background = "rgba(219,234,254,0.3)")}>
                    <Plus size={10} />{f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* CENTER: Canvas ──────────────────────────────────────────────────── */}
          <div style={{ flex:1, overflowY:"auto", background:"#e5e7eb", display:"flex", justifyContent:"center", padding:"24px 16px" }}>
            <div
              ref={canvasRef}
              onClick={() => setSelectedId(null)}
              style={{
                position:"relative",
                width: CANVAS_W,
                height: CANVAS_H,
                background: design.background,
                border: design.outerBorderWidth > 0
                  ? `${design.outerBorderWidth}px ${design.outerBorderStyle} ${design.outerBorderColor}`
                  : "1px solid #d1d5db",
                boxShadow:"0 8px 40px rgba(0,0,0,0.18)",
                flexShrink: 0,
              }}>
              {design.frame && design.frameBack && (
                <img src={design.frame} alt="frame" draggable={false} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"fill", pointerEvents:"none", userSelect:"none", zIndex:0 }} />
              )}
              {pageElements.map(el =>
                renderEl(
                  el,
                  el.id === selectedId,
                  (e) => { e.stopPropagation(); setSelectedId(el.id) },
                  (e) => handleElMouseDown(e, el.id),
                  (node) => { if (node) elRefs.current.set(el.id, node); else elRefs.current.delete(el.id) }
                )
              )}
              {design.frame && !design.frameBack && (
                <img src={design.frame} alt="frame" draggable={false} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"fill", pointerEvents:"none", userSelect:"none", zIndex:999 }} />
              )}
            </div>
          </div>

          {/* RIGHT: Properties ───────────────────────────────────────────────── */}
          <div style={{ width:256, background:"#fff", borderLeft:"1px solid #e2e8f0", overflowY:"auto", flexShrink:0, padding:"12px" }}>
            {!selected ? (
              <div style={{ padding:"40px 12px", textAlign:"center", color:"#9ca3af", fontSize:12 }}>
                Click an element on the canvas to edit its properties.
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:NAVY, fontFamily:F }}>
                  {selected.type === "field" ? "Data Field" : selected.type === "text" ? "Text" : selected.type === "rect" ? "Rectangle" : selected.type === "line" ? "Line" : selected.type === "qr" ? "QR Code" : "Image"}
                </div>

                {/* Content */}
                {(selected.type === "text" || selected.type === "field") && (
                  <div>
                    <Label>Content</Label>
                    <textarea value={selected.content} onChange={e => upd("content", e.target.value)} rows={3}
                      style={{ width:"100%", padding:"5px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, color:"#111827", fontFamily:F, outline:"none", resize:"vertical", boxSizing:"border-box" }} />
                    {selected.type === "field" && (
                      <div style={{ marginTop:4, display:"flex", flexWrap:"wrap", gap:3 }}>
                        {DATA_FIELDS.map(f => (
                          <button key={f.key} onClick={() => upd("content", f.key)}
                            style={{ fontSize:9, padding:"2px 6px", borderRadius:4, border:"1px solid #bfdbfe", background: selected.content === f.key ? "#eff6ff" : "#fff", color:"#1d4ed8", cursor:"pointer" }}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Font */}
                {(selected.type === "text" || selected.type === "field") && (
                  <>
                    <div>
                      <Label>Font Family</Label>
                      <select value={selected.fontFamily} onChange={e => upd("fontFamily", e.target.value)}
                        style={{ width:"100%", padding:"5px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, cursor:"pointer" }}>
                        {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                      <div>
                        <Label>Font Size</Label>
                        <Input type="number" min={6} max={96} value={selected.fontSize} onChange={(v: string) => upd("fontSize", +v)} />
                      </div>
                      <div>
                        <Label>Letter Spacing</Label>
                        <Input type="number" min={-5} max={30} value={selected.letterSpacing} onChange={(v: string) => upd("letterSpacing", +v)} />
                      </div>
                    </div>
                    <div>
                      <Label>Line Height</Label>
                      <Input type="number" min={0.8} max={4} step={0.1} value={selected.lineHeight} onChange={(v: string) => upd("lineHeight", +v)} />
                    </div>
                    <div>
                      <Label>Style</Label>
                      <div style={{ display:"flex", gap:4 }}>
                        <BtnSm onClick={() => upd("fontWeight", selected.fontWeight === "bold" ? "normal" : "bold")} active={selected.fontWeight === "bold"} title="Bold"><Bold size={13} /></BtnSm>
                        <BtnSm onClick={() => upd("fontStyle", selected.fontStyle === "italic" ? "normal" : "italic")} active={selected.fontStyle === "italic"} title="Italic"><Italic size={13} /></BtnSm>
                        <BtnSm onClick={() => upd("textDecoration", selected.textDecoration === "underline" ? "none" : "underline")} active={selected.textDecoration === "underline"} title="Underline"><Underline size={13} /></BtnSm>
                        <BtnSm onClick={() => upd("textAlign", "left")} active={selected.textAlign === "left"} title="Left"><AlignLeft size={13} /></BtnSm>
                        <BtnSm onClick={() => upd("textAlign", "center")} active={selected.textAlign === "center"} title="Center"><AlignCenter size={13} /></BtnSm>
                        <BtnSm onClick={() => upd("textAlign", "right")} active={selected.textAlign === "right"} title="Right"><AlignRight size={13} /></BtnSm>
                      </div>
                    </div>
                  </>
                )}

                {/* Colors */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {(selected.type === "text" || selected.type === "field") && (
                    <div>
                      <Label>Text Color</Label>
                      <input type="color" value={selected.color} onChange={e => upd("color", e.target.value)}
                        style={{ width:"100%", height:32, borderRadius:6, border:"1px solid #e2e8f0", cursor:"pointer", padding:2 }} />
                    </div>
                  )}
                  {selected.type !== "line" && (
                    <div>
                      <Label>Background</Label>
                      <input type="color" value={selected.background === "transparent" ? "#ffffff" : selected.background}
                        onChange={e => upd("background", e.target.value)}
                        style={{ width:"100%", height:32, borderRadius:6, border:"1px solid #e2e8f0", cursor:"pointer", padding:2 }} />
                    </div>
                  )}
                  {selected.type === "line" && (
                    <div style={{ gridColumn:"1/-1" }}>
                      <Label>Line Color</Label>
                      <input type="color" value={selected.color} onChange={e => { upd("color", e.target.value); upd("background", e.target.value) }}
                        style={{ width:"100%", height:32, borderRadius:6, border:"1px solid #e2e8f0", cursor:"pointer", padding:2 }} />
                    </div>
                  )}
                </div>

                {/* Border */}
                {selected.type !== "line" && (
                  <div>
                    <Label>Border</Label>
                    <div style={{ display:"grid", gridTemplateColumns:"56px 1fr", gap:6, marginBottom:6 }}>
                      <Input type="number" min={0} max={20} value={selected.borderWidth} onChange={(v: string) => upd("borderWidth", +v)} style={{ textAlign:"center" }} />
                      <select value={selected.borderStyle} onChange={e => upd("borderStyle", e.target.value)}
                        style={{ padding:"5px 8px", borderRadius:6, border:"1px solid #e2e8f0", fontSize:12, cursor:"pointer" }}>
                        {BORDER_STYLES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 60px", gap:6 }}>
                      <input type="color" value={selected.borderColor} onChange={e => upd("borderColor", e.target.value)}
                        style={{ height:32, borderRadius:6, border:"1px solid #e2e8f0", cursor:"pointer", padding:2 }} />
                      <div>
                        <div style={{ fontSize:9, color:"#9ca3af", marginBottom:2 }}>Radius</div>
                        <Input type="number" min={0} max={60} value={selected.borderRadius} onChange={(v: string) => upd("borderRadius", +v)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Size & Position */}
                <div>
                  <Label>Size & Position</Label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    {[
                      { k:"x" as const, label:"X" },
                      { k:"y" as const, label:"Y" },
                      { k:"w" as const, label:"W" },
                      { k:"h" as const, label:"H" },
                    ].map(({ k, label }) => (
                      <div key={k}>
                        <div style={{ fontSize:9, color:"#9ca3af", marginBottom:2 }}>{label}</div>
                        <Input type="number" min={0} value={selected[k]} onChange={(v: string) => upd(k, +v)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opacity */}
                <div>
                  <Label>Opacity ({Math.round(selected.opacity * 100)}%)</Label>
                  <input type="range" min={0.1} max={1} step={0.01} value={selected.opacity}
                    onChange={e => upd("opacity", +e.target.value)}
                    style={{ width:"100%", cursor:"pointer" }} />
                </div>

                {/* Image upload */}
                {selected.type === "image" && (
                  <div>
                    <Label>Upload Image</Label>
                    <label style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 12px", borderRadius:7, border:"1px solid #e2e8f0", background:"#f8fafc", color:"#374151", fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:F }}>
                      <ImageIcon size={13} /> Choose file
                      <input type="file" accept="image/*" style={{ display:"none" }} onChange={e => {
                        const f = e.target.files?.[0]
                        if (!f) return
                        const r = new FileReader()
                        r.onload = ev => upd("content", ev.target?.result as string)
                        r.readAsDataURL(f)
                      }} />
                    </label>
                  </div>
                )}

                {/* Delete */}
                <button onClick={deleteSelected}
                  style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, padding:"7px", borderRadius:7, border:"1px solid #fecaca", background:"#fef2f2", color:"#dc2626", fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:F, marginTop:4 }}>
                  <Trash2 size={13} /> Delete Element
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Preview modal ──────────────────────────────────────────────────────── */}
      {showPreview && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:1000, display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"24px", overflowY:"auto" }} onClick={() => setShowPreview(false)}>
          <div onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <span style={{ color:"#fff", fontWeight:700, fontSize:14, fontFamily:F }}>Preview — {design.name}</span>
              <button onClick={() => setShowPreview(false)} style={{ width:32, height:32, borderRadius:8, border:"none", background:"rgba(255,255,255,0.15)", cursor:"pointer", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={16} />
              </button>
            </div>
            <div style={{
              position:"relative",
              width: CANVAS_W,
              height: CANVAS_H,
              background: design.background,
              border: design.outerBorderWidth > 0
                ? `${design.outerBorderWidth}px ${design.outerBorderStyle} ${design.outerBorderColor}`
                : "1px solid #d1d5db",
              boxShadow:"0 16px 60px rgba(0,0,0,0.4)",
              flexShrink:0,
            }}>
              {design.frame && design.frameBack && (
                <img src={design.frame} alt="frame" draggable={false} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"fill", pointerEvents:"none", userSelect:"none", zIndex:0 }} />
              )}
              {pageElements.map(el =>
                renderEl(el, false, () => {}, () => {})
              )}
              {design.frame && !design.frameBack && (
                <img src={design.frame} alt="frame" draggable={false} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"fill", pointerEvents:"none", userSelect:"none", zIndex:999 }} />
              )}
            </div>
          </div>
        </div>
      )}
    </OfficeLayout>
  )
}
