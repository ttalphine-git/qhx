import React, { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getColorSettings, type ColorSettings } from '@/api/settings'

interface ColorContextType {
  colors: ColorSettings | null
  isLoading: boolean
}

const ColorContext = createContext<ColorContextType | undefined>(undefined)

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColors] = useState<ColorSettings | null>(null)

  const { data: fetchedColors, isLoading } = useQuery({
    queryKey: ['color-settings'],
    queryFn: getColorSettings,
    staleTime: Infinity,
    retry: false,
  })

  useEffect(() => {
    if (fetchedColors) {
      setColors(fetchedColors)
      applyColorsToDOM(fetchedColors)
    }
  }, [fetchedColors])

  const applyColorsToDOM = (colorSettings: ColorSettings) => {
    const root = document.documentElement
    root.style.setProperty('--color-top-bar-bg', colorSettings.topBarBackground)
    root.style.setProperty('--color-top-bar-text', colorSettings.topBarText)
    root.style.setProperty('--color-button-primary', colorSettings.buttonPrimary)
    root.style.setProperty('--color-button-primary-hover', colorSettings.buttonPrimaryHover)
    root.style.setProperty('--color-button-secondary', colorSettings.buttonSecondary)
    root.style.setProperty('--color-button-secondary-hover', colorSettings.buttonSecondaryHover)
    root.style.setProperty('--color-accent', colorSettings.accentColor)
    root.style.setProperty('--color-border', colorSettings.borderColor)

    // Apply to common UI elements
    const style = `
      :root {
        --color-top-bar-bg: ${colorSettings.topBarBackground};
        --color-top-bar-text: ${colorSettings.topBarText};
        --color-button-primary: ${colorSettings.buttonPrimary};
        --color-button-primary-hover: ${colorSettings.buttonPrimaryHover};
        --color-button-secondary: ${colorSettings.buttonSecondary};
        --color-button-secondary-hover: ${colorSettings.buttonSecondaryHover};
        --color-accent: ${colorSettings.accentColor};
        --color-border: ${colorSettings.borderColor};
      }
    `
    let styleTag = document.getElementById('color-settings-style')
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = 'color-settings-style'
      document.head.appendChild(styleTag)
    }
    styleTag.textContent = style
  }

  return (
    <ColorContext.Provider value={{ colors, isLoading }}>
      {children}
    </ColorContext.Provider>
  )
}

export function useColors() {
  const context = useContext(ColorContext)
  if (context === undefined) {
    throw new Error('useColors must be used within ColorProvider')
  }
  return context
}
