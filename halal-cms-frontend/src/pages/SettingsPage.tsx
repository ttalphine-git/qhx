import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RotateCcw, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getColorSettings, updateColorSettings, resetColorSettings, type ColorSettings } from '@/api/settings'
import { toast } from 'react-hot-toast'

const F = '"Segoe UI", sans-serif'

export default function SettingsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [colors, setColors] = useState<ColorSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const { data: currentColors, isLoading } = useQuery({
    queryKey: ['color-settings'],
    queryFn: getColorSettings,
  })

  useEffect(() => {
    if (currentColors) {
      setColors(currentColors)
    }
  }, [currentColors])

  const handleColorChange = (key: keyof ColorSettings, value: string) => {
    setColors(prev => prev ? { ...prev, [key]: value } : null)
  }

  const handleSave = async () => {
    if (!colors) return
    setIsSaving(true)
    try {
      await updateColorSettings(colors)
      queryClient.invalidateQueries({ queryKey: ['color-settings'] })
      toast.success('Color settings saved successfully!')
      // Reload to apply new colors
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      toast.error('Failed to save color settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Reset all colors to default? This cannot be undone.')) return
    setIsSaving(true)
    try {
      const reset = await resetColorSettings()
      setColors(reset)
      queryClient.invalidateQueries({ queryKey: ['color-settings'] })
      toast.success('Colors reset to default!')
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      toast.error('Failed to reset colors')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading || !colors) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: F }}>
        Loading settings...
      </div>
    )
  }

  const colorInputs = [
    { key: 'topBarBackground', label: 'Top Bar Background', description: 'Main navigation bar background color' },
    { key: 'topBarText', label: 'Top Bar Text', description: 'Top bar text and icons color' },
    { key: 'buttonPrimary', label: 'Button Primary Color', description: 'Main action button color' },
    { key: 'buttonPrimaryHover', label: 'Button Primary Hover', description: 'Button color on hover' },
    { key: 'buttonSecondary', label: 'Button Secondary Color', description: 'Secondary button color' },
    { key: 'buttonSecondaryHover', label: 'Button Secondary Hover', description: 'Secondary button hover color' },
    { key: 'accentColor', label: 'Accent Color', description: 'Highlight and accent color' },
    { key: 'borderColor', label: 'Border Color', description: 'Border and divider color' },
  ] as const

  return (
    <div style={{ fontFamily: F, minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: colors.topBarBackground, color: colors.topBarText, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: colors.topBarText, cursor: 'pointer', fontSize: 20, padding: 8 }}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Color Settings</h1>
            <p style={{ margin: '4px 0 0', fontSize: 12, opacity: 0.8 }}>Customize portal colors globally</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${colors.borderColor}`, overflow: 'hidden' }}>
          {/* Color Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 0 }}>
            {colorInputs.map(({ key, label, description }) => (
              <div key={key} style={{ padding: 24, borderRight: `1px solid ${colors.borderColor}`, borderBottom: `1px solid ${colors.borderColor}` }}>
                <label style={{ display: 'block', marginBottom: 8 }}>
                  <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                    {label}
                  </span>
                  <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                    {description}
                  </span>
                </label>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 8,
                      background: colors[key],
                      border: `2px solid ${colors.borderColor}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      const input = document.getElementById(`color-${key}`) as HTMLInputElement
                      if (input) input.click()
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <input
                      id={`color-${key}`}
                      type="color"
                      value={colors[key]}
                      onChange={(e) => handleColorChange(key, e.target.value)}
                      style={{ width: '100%', height: 44, borderRadius: 6, border: `1px solid ${colors.borderColor}`, cursor: 'pointer' }}
                    />
                    <span style={{ display: 'block', fontSize: 11, color: '#94a3b8', marginTop: 6, fontFamily: 'monospace' }}>
                      {colors[key]}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ padding: 24, background: '#f8fafc', borderTop: `1px solid ${colors.borderColor}`, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              onClick={handleReset}
              disabled={isSaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 8,
                border: `1px solid ${colors.borderColor}`,
                background: '#fff',
                color: colors.buttonSecondary,
                fontSize: 13,
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.6 : 1,
              }}
            >
              <RotateCcw size={16} />
              Reset to Default
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: colors.buttonPrimary,
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Preview Section */}
        <div style={{ marginTop: 32, background: '#fff', borderRadius: 12, border: `1px solid ${colors.borderColor}`, overflow: 'hidden' }}>
          <div style={{ padding: 24, borderBottom: `1px solid ${colors.borderColor}` }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Preview</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: colors.buttonPrimary, color: '#fff', fontWeight: 600, cursor: 'default' }}>
                Primary Button
              </button>
              <button style={{ padding: '10px 20px', borderRadius: 6, border: 'none', background: colors.buttonSecondary, color: '#fff', fontWeight: 600, cursor: 'default' }}>
                Secondary Button
              </button>
              <div style={{ padding: '10px 12px', borderRadius: 6, border: `1px solid ${colors.borderColor}`, background: '#f8fafc', color: '#0f172a', fontWeight: 600 }}>
                Bordered Element
              </div>
            </div>
          </div>
          <div style={{ padding: 24, background: colors.topBarBackground }}>
            <p style={{ margin: 0, color: colors.topBarText, fontSize: 14, fontWeight: 600 }}>
              This is how the top bar will look with your selected colors
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
