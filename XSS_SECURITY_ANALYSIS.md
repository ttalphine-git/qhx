# XSS Security Analysis - Customer Portal

## Summary
Found **2 potential DOM-based XSS vulnerabilities** in CustomerApplicationDetailPage.tsx

---

## Vulnerability #1: iframe src with data URL (Line 723)
**Location:** Agreement PDF iframe  
**Risk Level:** ⚠️ MEDIUM

```typescript
<iframe
  src={selectedPdf.pdfData}  // ← Data from localStorage
  title="Agreement PDF"
/>
```

**Issue:**
- `selectedPdf.pdfData` comes from localStorage (user/admin-controlled)
- Not validated to ensure it's actually a PDF data URL
- Attacker could inject: `data:text/html,<script>alert('xss')</script>`

**Impact:**
- JavaScript execution within iframe context
- Could steal iframe contents or perform actions

**Fix:** Validate data URL format
```typescript
// Validate before using
const isPdfDataUrl = selectedPdf.pdfData?.startsWith('data:application/pdf;base64,')
if (!isPdfDataUrl) {
  console.error('Invalid PDF data format')
  return null
}
```

---

## Vulnerability #2: iframe src with user-uploaded file (Line 1095)
**Location:** Payment evidence preview  
**Risk Level:** ⚠️ MEDIUM

```typescript
<iframe 
  src={evidencePreview.base64}  // ← User-uploaded file
  title={evidencePreview.name}
/>
```

**Issue:**
- `evidencePreview.base64` comes from user file upload
- No validation of file type or content
- User could upload an HTML file (disguised as PDF)
- When viewed in iframe, HTML/JavaScript would execute

**Impact:**
- Execution of uploaded malicious HTML
- Access to parent window (depending on sandbox attributes)
- Could bypass file type restrictions

**Fix:** Add sandbox attribute + validate MIME type
```typescript
<iframe 
  src={evidencePreview.base64}
  title={evidencePreview.name}
  sandbox="allow-same-origin"  // ← Restrict capabilities
  style={{ width:"100%", height:"80vh", border:"none", display:"block" }}
/>

// And validate on upload
function handleEvidenceUpload(e: React.ChangeEvent<HTMLInputElement>) {
  const file = e.target.files?.[0]
  if (!file) return
  
  // Only allow specific types
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png']
  if (!allowedTypes.includes(file.type)) {
    toast.error('Only PDF and image files are allowed')
    return
  }
  
  const r = new FileReader()
  r.onload = ev => { 
    setEvidenceFile(ev.target?.result as string)
    setEvidenceName(file.name) 
  }
  r.readAsDataURL(file)
}
```

---

## Vulnerability #3: User-controlled filename in alt/title (Low Risk ✓ MITIGATED)
**Location:** Lines 1094-1095  
**Risk Level:** ✅ LOW (React handles this safely)

```typescript
alt={evidencePreview.name}  // ← User-provided filename
title={evidencePreview.name}  // ← User-provided filename
```

**Status:** ✅ **SAFE** - React automatically escapes attribute values

---

## Audit Questions Code Status
**Audit questions implementation:** ✅ **SECURE**

- ✓ No `innerHTML` usage
- ✓ No `dangerouslySetInnerHTML`
- ✓ All user data passed through React JSX (auto-escaped)
- ✓ Textarea values safely handled
- ✓ No eval or dynamic code execution

```typescript
// Example: Safe rendering of user comment
<textarea
  value={auditAnswers[idx]?.customerComment ?? answer.customerComment ?? ""}
  onChange={e => updateCustomerComment(idx, e.target.value)}
/>
// ✓ React escapes and sanitizes textarea value
```

---

## Recommendations

### Priority 1 (Fix Now)
1. Add validation to PDF data URL format
2. Add `sandbox` attribute to evidence iframe
3. Validate file types on upload (whitelist: PDF, images only)
4. Reject executable file types

### Priority 2 (Best Practice)
1. Use Content Security Policy (CSP) headers
2. Implement file size limits
3. Add file scanning/virus checking for uploads
4. Use blob URLs instead of data URLs when possible

### Priority 3 (Hardening)
1. Implement CORS headers
2. Add X-Content-Type-Options: nosniff
3. Validate all localStorage data on load
4. Implement integrity checking for PDFs

---

## Files Affected
- ✓ `halal-cms-frontend/src/pages/customer/CustomerApplicationDetailPage.tsx`
  - Lines 723: Agreement PDF iframe
  - Lines 1094-1095: Evidence preview iframe

## Audit Questions Files
- ✓ No vulnerabilities introduced
- ✓ Implementation follows React security best practices
