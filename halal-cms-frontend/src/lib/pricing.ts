export const PRICING_STORAGE = "hcs_pricing_config"

export const CURRENCIES = [
  { code: "USD", symbol: "$",   name: "US Dollar"         },
  { code: "EUR", symbol: "€",   name: "Euro"              },
  { code: "GBP", symbol: "£",   name: "British Pound"     },
  { code: "MYR", symbol: "RM",  name: "Malaysian Ringgit" },
  { code: "SAR", symbol: "﷼",   name: "Saudi Riyal"       },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham"        },
  { code: "SGD", symbol: "S$",  name: "Singapore Dollar"  },
  { code: "BDT", symbol: "৳",   name: "Bangladeshi Taka"  },
  { code: "PKR", symbol: "₨",   name: "Pakistani Rupee"   },
  { code: "IDR", symbol: "Rp",  name: "Indonesian Rupiah" },
  { code: "QAR", symbol: "ر.ق", name: "Qatari Riyal"      },
  { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar"     },
  { code: "TRY", symbol: "₺",   name: "Turkish Lira"      },
  { code: "INR", symbol: "₹",   name: "Indian Rupee"      },
]

export interface PricingConfig {
  auditDayCost: number
  currency: string
  vatPct: number
}

const DEFAULT_PRICING: PricingConfig = { auditDayCost: 0, currency: "USD", vatPct: 0 }

export function loadPricing(): PricingConfig {
  try {
    return { ...DEFAULT_PRICING, ...JSON.parse(localStorage.getItem(PRICING_STORAGE) || "{}") }
  } catch {
    return DEFAULT_PRICING
  }
}

export function getSystemCurrency(): string {
  return loadPricing().currency
}

export function getCurrencySymbol(code: string): string {
  return CURRENCIES.find(c => c.code === code)?.symbol ?? code
}

export function formatPrice(amount: number, currencyCode?: string): string {
  const code = currencyCode ?? getSystemCurrency()
  const symbol = getCurrencySymbol(code)
  return `${code} ${symbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
