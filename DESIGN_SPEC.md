# KVB Login Page — Design Specification

**Source of truth:** `https://mms.kenyavetboard.or.ke/site/login` (KVB Professional Regulatory Portal login)

This specification defines the visual identity, color system, typography, layout, and component behavior the inspection portal login page must match.

---

## 1. Color Palette (CSS Custom Properties)

All colors are taken directly from the target site's `:root` variables.

| Variable | Hex / Value | Usage |
|---|---|---|
| `--kvb-green-dark` | `#0f5132` | Left-panel gradient start, right-title gradient start, primary button gradient start, "forgot password" link color |
| `--kvb-green` | `#1a7b32` | Left-panel gradient mid, right-title gradient mid, primary button gradient mid, field-label icon color, input focus border |
| `--kvb-green-soft` | `#1d8b4a` | Secondary green accent |
| `--kvb-green-light` | `rgba(26, 123, 50, 0.16)` | Forgot-password link hover background |
| `--kvb-red` | `#dc2626` | Left-panel gradient late-stop, support link color, error states |
| `--kvb-red-dark` | `#b91c1c` | Support link hover color |
| `--kvb-red-light` | `rgba(220, 38, 38, 0.14)` | Support link hover background, error shadow |
| `--kvb-black` | `#0f172a` | Left-panel gradient end, right-title gradient end, text-main |
| `--kvb-gold` | `#d4af37` | Service-title icon color, left-footer icon color |
| `--text-main` | `#0f172a` | Primary body text, field labels |
| `--text-muted` | `#6b7280` | Secondary text, subtitle, form helper text |
| `--card-radius` | `26px` | Auth card border-radius |
| `--shadow-sm` | `0 4px 15px rgba(15, 23, 42, 0.08)` | Input focus shadow, date pill shadow |
| `--shadow-md` | `0 10px 30px rgba(15, 23, 42, 0.12)` | Button outline hover shadow |
| `--shadow-lg` | `0 30px 80px rgba(15, 23, 42, 0.22)` | Auth card shadow |
| `--transition` | `all 0.22s cubic-bezier(0.4, 0, 0.2, 1)` | Standard easing for hover/focus transitions |

---

## 2. Typography

- **Font family:** `Poppins` (Google Fonts, weights 300–800)
- **Fallback:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif`
- **Rendering:** `-webkit-font-smoothing: antialiased`

| Element | Size | Weight | Notes |
|---|---|---|---|
| `kvb-logo-pill-text-main` | `1.25rem` | 800 | Uppercase, letter-spacing 0.06em |
| `kvb-logo-pill-text-sub` | `0.9rem` | 400 | Opacity 0.92 |
| `kvb-left-title` | `2.5rem` | 800 | Line-height 1.05, text-shadow |
| `kvb-left-sub` | `0.98rem` | 400 | Opacity 0.96, max-width 380px |
| `kvb-services-title` | `1.1rem` | 700 | Flex row with icon gap |
| `kvb-service-text h4` | `0.94rem` | 700 | |
| `kvb-service-text p` | `0.84rem` | 400 | Opacity 0.9 |
| `kvb-right-title` | `2.16rem` | 800 | Gradient text clip |
| `kvb-right-sub` | `0.98rem` | 500 | Text-muted color |
| `kvb-field-label` | `0.9rem` | 700 | Flex row with icon gap |
| `kvb-input-wrap input` | `1.05rem` | 500 | Height 64px |
| `kvb-right-header` title | `2.16rem` | 800 | |
| `kvb-btn` | `0.96rem` | 700 | Full width, 15px padding |
| `kvb-date-pill` | `0.84rem` | 600 | |
| `kvb-support` | `0.84rem` | 400 | |
| `invalid-feedback` | `0.8rem` | 500 | Red color |

---

## 3. Background & Decorative Elements

**Page background:**
```
radial-gradient(circle at top left, rgba(15,81,50,0.22) 0%, transparent 55%),
radial-gradient(circle at bottom right, rgba(220,38,38,0.18) 0%, transparent 55%),
linear-gradient(135deg, #e5f0ff, #f9fafb)
```

**Floating blobs** (`position: absolute`, `filter: blur(55px)`, `opacity: 0.22`, `z-index: -1`, `animation: float 27s infinite ease-in-out`):

| Blob | Size | Position | Background |
|---|---|---|---|
| `.blob-1` | 360×360px | top: -140px, left: -120px | `radial-gradient(circle, #16a34a, transparent)` |
| `.blob-2` | 420×420px | bottom: -160px, right: -140px | `radial-gradient(circle, #dc2626, transparent)` |
| `.blob-3` | 320×320px | top: 38%, left: 68% | `radial-gradient(circle, #0f5132, transparent)` |

**Float animation:**
```
0%, 100% { transform: translate(0,0) scale(1); }
33%      { transform: translate(18px,-16px) scale(1.05); }
66%      { transform: translate(-14px,12px) scale(0.97); }
```

---

## 4. Auth Card Layout

**Container:** `.kvb-auth-shell`
- `width: 100%`, `max-width: 1180px`, `padding: 20px`
- Flex center alignment

**Card:** `.kvb-auth-card`
- `background: rgba(255,255,255,0.98)`
- `backdrop-filter: blur(18px)`
- `border-radius: var(--card-radius)` (26px)
- `border: 1px solid rgba(255,255,255,0.7)`
- `box-shadow: var(--shadow-lg)`
- `overflow: hidden`
- `display: grid`, `grid-template-columns: 1.03fr 1.17fr`
- `min-height: 620px`
- Entrance: `opacity: 0`, `transform: translateY(16px)`, transition 0.5s → mounted state `opacity: 1`, `transform: translateY(0)`
- Hover: `box-shadow: 0 35px 100px rgba(15,23,42,0.26)`, `transform: translateY(-2px)`

---

## 5. Left Panel (.kvb-left)

**Background:**
```
radial-gradient(circle at 0% 0%, rgba(255,255,255,0.05) 0%, transparent 55%),
linear-gradient(145deg, #0f5132 0%, #15803d 48%, #dc2626 88%, #020617 100%)
```
- `padding: 38px 34px 30px`, `color: #ffffff`
- `display: flex`, `flex-direction: column`, `justify-content: space-between`
- `position: relative`, `overflow: hidden`

**Overlay (`::before`):**
- `inset: 0`, `z-index: 1`
```
radial-gradient(circle at 16% 82%, rgba(220,38,38,0.28) 0%, transparent 50%),
radial-gradient(circle at 78% 14%, rgba(22,163,74,0.26) 0%, transparent 50%),
radial-gradient(circle at 48% 48%, rgba(15,23,42,0.5) 0%, transparent 60%)
```

**Logo pill (`.kvb-logo-pill`):**
- `display: inline-flex`, `align-items: center`, `gap: 18px`
- `padding: 18px 24px`, `border-radius: 999px`
- Background: radial-gradient white-at-top-left + `rgba(15,23,42,0.78)`
- `box-shadow: 0 18px 45px rgba(0,0,0,0.55)`
- `backdrop-filter: blur(18px)`
- `border: 1px solid rgba(255,255,255,0.18)`
- Hover: `transform: translateY(-2px) scale(1.01)`, shadow intensifies

**Logo icon (`.kvb-logo-pill-icon`):**
- `86×86px`, `border-radius: 24px`
- Background: `linear-gradient(135deg,#ffffff,#f1f5f9)`
- Flex center, `flex-shrink: 0`, shadow `0 14px 34px rgba(0,0,0,0.3)`
- Image max-width 64px

**Service section (`.kvb-services-merged`):**
- `margin-top: 24px`, `padding: 22px 22px 20px`
- `border-radius: 20px`, `background: rgba(15,23,42,0.52)`
- `box-shadow: 0 18px 40px rgba(0,0,0,0.45)`
- `backdrop-filter: blur(18px)`
- `border: 1px solid rgba(255,255,255,0.18)`

**Service items (`.kvb-service-item`):**
- `display: flex`, `align-items: flex-start`, `gap: 12px`
- `padding: 13px 14px`, `border-radius: 16px`
- Background: `linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))`
- `border: 1px solid rgba(255,255,255,0.22)`, `backdrop-filter: blur(14px)`
- Hover: `background: rgba(255,255,255,0.18)`, `transform: translateX(4px)`

**Service icon (`.kvb-service-icon`):**
- `26×26px`, `border-radius: 8px`
- Background: `linear-gradient(135deg,#16a34a,#dc2626,#111827)` (green → red → navy tri-color)
- Flex center, `flex-shrink: 0`, `margin-top: 1px`
- Icon color: `#ffffff`, `font-size: 0.82rem`

**Left footer (`.kvb-left-footer`):**
- `position: relative`, `z-index: 2`
- `display: flex`, `flex-wrap: wrap`, `gap: 10px`
- `margin-top: 28px`, `font-size: 0.82rem`
- Each span: inline-flex, `padding: 7px 12px`, `border-radius: 999px`, `background: rgba(15,23,42,0.75)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255,255,255,0.18)`, `white-space: nowrap`
- Footer icons: `color: var(--kvb-gold)`

---

## 6. Right Panel (.kvb-right)

- `padding: 34px 44px 30px`, `position: relative`
- `display: flex`, `flex-direction: column`
- `background: #f9fafb`

**Date pill (`.kvb-date-pill`):**
- `position: absolute`, `top: 20px`, `right: 26px`
- `background: #ffffff`, `padding: 8px 14px`, `border-radius: 18px`
- `font-size: 0.84rem`, `font-weight: 600`, `color: var(--text-muted)`
- `border: 1px solid #e5e7eb`, `box-shadow: var(--shadow-sm)`
- `display: inline-flex`, `align-items: center`, `gap: 7px`

**Header (`.kvb-right-header`):**
- `margin-top: 34px`, `margin-bottom: 20px`

**Title (`.kvb-right-title`):**
- `font-size: 2.16rem`, `font-weight: 800`
- Background: `linear-gradient(135deg,#0f5132,#1a7b32,#111827)`
- `-webkit-background-clip: text`, `-webkit-text-fill-color: transparent`, `background-clip: text`
- `margin-bottom: 8px`

**Subtitle (`.kvb-right-sub`):**
- `font-size: 0.98rem`, `color: var(--text-muted)`, `font-weight: 500`

**Form body (`.kvb-form-body`):**
- `flex-grow: 1`, `flex-direction: column`
- `max-width: 700px`, `background: #ffffff`
- `border-radius: 20px`, `border: 1px solid #e5e7eb`
- `padding: 24px 24px 18px`
- `box-shadow: 0 14px 32px rgba(15,23,42,0.06)`

---

## 7. Form Fields

**Field label (`.kvb-field-label`):**
- `font-size: 0.9rem`, `font-weight: 700`, `color: var(--text-main)`
- `margin-bottom: 8px`, `display: flex`, `align-items: center`, `gap: 8px`
- Icon: `color: var(--kvb-green)`, `font-size: 0.9rem`

**Input wrapper (`.kvb-input-wrap`):**
- `position: relative`

**Input icon (`.kvb-input-icon`):**
- `position: absolute`, `left: 20px`, `top: 50%`, `transform: translateY(-50%)`
- `color: #94a3b8`, `font-size: 1.2rem`, `pointer-events: none`

**Input (`.form-control`):**
- `height: 64px`, `width: 100%`, `border-radius: 16px`
- `border: 2px solid #e2e8f0`
- `padding-left: 54px`, `padding-right: 60px`
- `font-size: 1.05rem`, `font-weight: 500`
- `background: #f9fafb`
- Transition on all

**Focus state:**
- `border-color: var(--kvb-green)`
- `background: #ffffff`
- `box-shadow: 0 0 0 4px rgba(26,123,50,0.22)`
- `transform: translateY(-1px)`

**Password toggle (`.password-toggle`):**
- `position: absolute`, `right: 18px`, `top: 50%`, `transform: translateY(-50%)`
- `font-size: 1.2rem`, `color: #94a3b8`, `cursor: pointer`, `z-index: 3`
- Hover: `color: var(--kvb-green)`

**Error states:**
- `.has-error .form-control`: `border-color: var(--kvb-red)`, `box-shadow: 0 0 0 3px var(--kvb-red-light)`, `background: #fef2f2`
- `.has-error .kvb-input-icon`: `color: var(--kvb-red)`
- `.invalid-feedback`: `font-size: 0.8rem`, `color: var(--kvb-red)`, `margin-top: 6px`, `font-weight: 500`

**Remember Me (`.form-check-input`):**
- `18×18px`, `border-radius: 4px`, `border: 2px solid #cbd5e1`
- Checked: `background-color: var(--kvb-green)`, `border-color: var(--kvb-green)`
- Focus: `box-shadow: 0 0 0 2px rgba(26,123,50,0.25)`

---

## 8. Buttons

**Base (`.kvb-btn`):**
- `width: 100%`, `padding: 15px 0`, `border-radius: 14px`
- `border: none`, `font-size: 0.96rem`, `font-weight: 700`
- `cursor: pointer`, `margin-bottom: 10px`
- `display: flex`, `align-items: center`, `justify-content: center`, `gap: 10px`
- Transition on all

**Primary (`.kvb-btn-primary`):**
- `background: linear-gradient(135deg,#0f5132,#1a7b32,#111827)`
- `color: #ffffff`
- `box-shadow: 0 10px 30px rgba(26,123,50,0.4)`
- Hover: `background: linear-gradient(135deg,#16a34a,#22c55e,#0f5132)`, shadow intensifies, `transform: translateY(-2px)`

**Outline (`.kvb-btn-outline`):**
- `background: #ffffff`, `border: 2px solid #e2e8f0`
- `color: var(--text-main)`, `box-shadow: var(--shadow-sm)`
- Hover: `border-color: var(--kvb-green)`, `color: var(--kvb-green)`, `background: #f8fafc`, shadow md, `transform: translateY(-2px)`

**Loading spinner (`.kvb-loading`):**
- `18×18px`, `border-radius: 50%`, `border: 2px solid transparent`, `border-top-color: #ffffff`
- `animation: spin 1s linear infinite`

---

## 9. Support Section (`.kvb-support`)

- `margin-top: 12px`, `font-size: 0.84rem`, `color: var(--text-muted)`
- `text-align: center`, `padding: 10px 12px`
- `background: #f9fafb`, `border-radius: 12px`, `border: 1px solid #e5e7eb`
- Link: `color: var(--kvb-red)`, `font-weight: 700`, hover `color: var(--kvb-red-dark)`, `background: var(--kvb-red-light)`

---

## 10. Responsive Breakpoints

**@media (max-width: 1024px):**
- Card: `grid-template-columns: minmax(0,1fr)`, `max-width: 580px`, `min-height: auto`
- Left panel: `display: none`
- Right: `padding: 26px 22px 24px`
- Date pill: `position: static`, `align-self: flex-end`, `margin-bottom: 12px`
- Right header: `margin-top: 0`
- Form body: `max-width: 100%`

**@media (max-width: 640px):**
- Shell: `padding: 12px`
- Right: `padding: 22px 16px 20px`
- Right title: `font-size: 1.8rem`
- Form footer top: `flex-direction: column`, `align-items: flex-start`, `gap: 8px`
- Buttons: `font-size: 0.94rem`

---

## 11. Interaction Behaviors

1. **Entrance animation:** Card fades in and slides up on mount via `requestAnimationFrame`.
2. **Submit state:** Button text changes to "Signing in...", spinner shows, button disables on form submit.
3. **Password toggle:** Clicking eye icon toggles `type="password"`/`type="text"` and swaps `fa-eye`/`fa-eye-slash`.
4. **Input focus:** Green border, white background, subtle lift transform, green ring shadow.
