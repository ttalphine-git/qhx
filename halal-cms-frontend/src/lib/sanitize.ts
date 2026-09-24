// Input sanitization utilities
// Prevents XSS attacks by escaping HTML special characters

export function sanitizeHtml(input: string): string {
  const div = document.createElement('div')
  div.textContent = input
  return div.innerHTML
}

export function sanitizeAttribute(input: string): string {
  return input
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\//g, '&#x2F;')
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url, window.location.href)
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:']
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '#'
    }
    return parsed.toString()
  } catch {
    return '#'
  }
}
