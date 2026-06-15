# Plan: 100% Button Standardization

## Goal

Migrate the last 6 files (7 unique button patterns) with native `<button>` to the shared `<Button>` component. Build must pass after each file.

## Active Constraint

Button.tsx uses `cn()` to merge classes: `baseClasses + variantClasses + sizeClasses + disabledClasses + className`. `className` comes last so it overrides Tailwind conflicts.

## Files & Patterns

### 1. `src/features/auth/pages/TermsPage.tsx` — "Leer términos completos" link

```tsx
// AS-IS (L114)
<button onClick={() => setShowFull(!showFull)}
  className="text-primary hover:underline text-xs font-medium">
  {showFull ? 'Mostrar menos' : 'Leer términos completos'}
</button>

// TO-BE
<Button variant="ghost" size="sm"
  className="p-0 text-primary hover:underline hover:bg-transparent"
  onClick={() => setShowFull(!showFull)}>
  {showFull ? 'Mostrar menos' : 'Leer términos completos'}
</Button>
```

**Variant mapping**: ghost is closest (no bg, text color). Override padding `p-0`, force `text-primary`, restore `hover:underline`, suppress ghost's `hover:bg-neutral-10`.

---

### 2. `src/features/auth/pages/LoginPage.tsx` — 3 button patterns

#### 2a. User selection card (L260)

```tsx
// AS-IS
<button key={u.id} onClick={() => { ... }}
  className="w-full flex items-center justify-between p-4 rounded-xl border border-neutral-20
    dark:border-neutral-70 hover:border-primary/40 hover:bg-primary/5
    dark:hover:bg-primary/10 transition-all group text-left">

// TO-BE
<Button key={u.id} variant="ghost" size="md"
  className="w-full justify-between p-4 rounded-xl border border-neutral-20
    dark:border-neutral-70 hover:border-primary/40 hover:bg-primary/5
    dark:hover:bg-primary/10 text-left group"
  onClick={() => { ... }}>
```

**Key overrides**: `justify-between` (vs default `justify-center`), `p-4` (vs `px-4 py-2`), `rounded-xl` (vs `rounded-lg`), `text-left`. Border + hover classes replace ghost's defaults via className order.

#### 2b. Copy secret button (L374)

```tsx
// AS-IS
<button onClick={handleCopy}
  className="p-2 rounded-lg hover:bg-neutral-20 dark:hover:bg-neutral-70
    transition-colors shrink-0" title="Copiar">

// TO-BE
<Button variant="ghost" size="sm" className="p-2 shrink-0"
  title="Copiar" onClick={handleCopy}>
```

**Variant mapping**: ghost matches hover behavior (`hover:bg-neutral`). `p-2` overrides size padding.

#### 2c. OTP submit buttons — setup (L407) + login (L510)

```tsx
// AS-IS
<button type="submit" disabled={otp.length !== 6 || verifying}
  className="w-full flex items-center justify-center gap-2 px-6 py-3.5
    bg-primary text-white rounded-xl font-semibold text-base
    hover:bg-primary-dark transition-colors disabled:opacity-50
    shadow-lg shadow-primary/25">

// TO-BE
<Button type="submit" variant="primary" size="lg"
  disabled={otp.length !== 6 || verifying}
  className="w-full rounded-xl font-semibold shadow-lg shadow-primary/25">
```

**Variant mapping**: `primary` gives `bg-primary text-white hover:bg-primary/90` (close enough — `hover:bg-primary-dark` vs `hover:bg-primary/90` are visually similar). `size="lg"` gives `px-5 py-2.5 text-base`, but original is `px-6 py-3.5`. Override `rounded-xl` (vs `rounded-lg`), `font-semibold` (vs `font-medium`).

**NOTE**: The original `hover:bg-primary-dark` is a custom color. Button's `hover:bg-primary/90` will be slightly different — visually acceptable but worth checking after build.

---

### 3. `src/features/obsolescence/pages/ObsolescencePage.tsx` — 6 stat-card filters

All 6 buttons share the exact same structure. Can be batch-replaced with a single edit.

```tsx
// AS-IS (6 instances: L352, L362, L372, L385, L395, L405)
<button onClick={...}
  className="bg-white dark:bg-neutral-80 rounded-2xl border border-neutral-20
    dark:border-neutral-70 p-4 shadow-sm cursor-pointer hover:shadow-md
    transition-all text-left">

// TO-BE
<Button variant="ghost" size="md"
  className="w-full justify-start p-4 rounded-2xl border border-neutral-20
    dark:border-neutral-70 bg-white dark:bg-neutral-80 shadow-sm
    hover:shadow-md text-left"
  onClick={...}>
```

**Variant mapping**: ghost provides no bg/color — perfect since these cards have their own bg (`bg-white dark:bg-neutral-80`). Override `justify-center` → `justify-start`, `rounded-lg` → `rounded-2xl`, add `w-full` for grid layout.

---

### 4. `src/features/obsolescence/pages/TechnologyDetailPage.tsx` — 2 patterns

#### 4a. ImpactCard link button (L685)

```tsx
// AS-IS
<button onClick={onLink}
  className="text-xs text-primary hover:text-primary-dark
    transition-colors flex items-center gap-1">

// TO-BE
<Button variant="ghost" size="sm"
  className="p-0 text-xs text-primary hover:text-primary-dark
    hover:bg-transparent"
  onClick={onLink}>
```

**Variant mapping**: ghost, minimal. Override padding, text size/color, suppress hover-bg.

#### 4b. Tab buttons (L139) — uses template literal for dynamic className

```tsx
// AS-IS
<button key={tab.id} onClick={() => setActiveTab(tab.id)}
  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium
    transition-all border-b-2 -mb-px ${
      activeTab === tab.id
        ? 'border-primary text-primary'
        : 'border-transparent text-neutral-60 dark:text-neutral-40
           hover:text-neutral-90 dark:hover:text-white'
    }`}>

// TO-BE
<Button key={tab.id} variant="ghost" size="md"
  onClick={() => setActiveTab(tab.id)}
  className={`px-4 py-3 border-b-2 -mb-px rounded-none hover:bg-transparent
    ${activeTab === tab.id
      ? 'border-primary text-primary'
      : 'border-transparent text-neutral-60 dark:text-neutral-40
         hover:text-neutral-90 dark:hover:text-white'
    }`}>
```

**Variant mapping**: ghost provides the base text color. Need to override `rounded-lg` → `rounded-none` (tabs shouldn't be rounded), supress ghost's hover-bg with `hover:bg-transparent`. Keep `group` classes from orig Button base? No, tabs don't use `group`. The original base classes had `flex items-center gap-2 text-sm font-medium transition-all` — Button provides these already.

---

### 5. `src/features/shared/components/RelatedEntitiesView.tsx` — 2 components

#### 5a. EntityCard (L206) — internal helper component

```tsx
// AS-IS
<button onClick={onClick}
  className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5
    rounded-lg bg-white dark:bg-neutral-85 border border-neutral-20
    dark:border-neutral-70 hover:border-primary/30 hover:shadow-sm
    transition-all group text-left">

// TO-BE
<Button variant="ghost" size="md"
  className="w-full justify-between px-3.5 py-2.5 rounded-lg border
    border-neutral-20 dark:border-neutral-70 bg-white dark:bg-neutral-85
    hover:border-primary/30 hover:shadow-sm group text-left"
  onClick={onClick}>
```

**Variant mapping**: ghost. Override `justify-center` → `justify-between`, keep `group` for child hover effects.

#### 5b. SimpleCard (L220) — conditional button/div

Current code:
```tsx
function SimpleCard({ title, subtitle, onClick }) {
  const Comp = onClick ? 'button' : 'div'
  return (
    <Comp onClick={onClick}
      className={...}>
      <span>{title}</span>
      <span>{subtitle}</span>
    </Comp>
  )
}
```

This is the trickiest case because `Comp` is dynamic. Approach: extract content and use conditional rendering.

```tsx
// TO-BE
function SimpleCard({ title, subtitle, onClick }) {
  const content = (
    <>
      <span className={`text-sm truncate min-w-0 flex-1 ${onClick ? 'group-hover:text-primary transition-colors' : 'text-neutral-90 dark:text-white'}`}>
        {title}
      </span>
      <span className="text-xs text-neutral-50 shrink-0 ml-2">{subtitle}</span>
    </>
  )

  if (onClick) {
    return (
      <Button variant="ghost" size="md"
        className="w-full justify-between px-3.5 py-2 rounded-lg border
          border-neutral-20 dark:border-neutral-70 bg-white dark:bg-neutral-85
          hover:border-primary/30 hover:shadow-sm group"
        onClick={onClick}>
        {content}
      </Button>
    )
  }

  return (
    <div className="w-full flex items-center justify-between px-3.5 py-2
      rounded-lg bg-white dark:bg-neutral-85 border border-neutral-20
      dark:border-neutral-70">
      {content}
    </div>
  )
}
```

---

### 6. `src/features/admin/pages/AdminPage.tsx` — ActionCard with `cn()`

```tsx
// AS-IS
<button onClick={onClick} disabled={disabled}
  className={cn(
    'flex flex-col items-center gap-2 p-5 rounded-2xl border
     bg-white dark:bg-neutral-80 transition-all duration-200
     disabled:opacity-50',
    colors[color] ?? colors.primary,
    onClick && !disabled && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
  )}>

// TO-BE
<Button variant="ghost" size="md" onClick={onClick} disabled={disabled}
  className={cn(
    'flex-col p-5 rounded-2xl border bg-white dark:bg-neutral-80
     transition-all duration-200 disabled:opacity-50',
    colors[color] ?? colors.primary,
    onClick && !disabled && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md'
  )}>
```

**Variant mapping**: ghost. Base Button provides `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors`. Override `justify-center` → not needed (flex-col handles direction), `rounded-lg` → `rounded-2xl`. The `flex-col` replaces `flex-row` (from Button's `inline-flex items-center` — actually `flex-col` overrides the flex direction). The `gap-2` from Button base is correct. `transition-colors` from base plus `transition-all` from className → both apply (Tailwind merges them). But there's a possible conflict: `transition-colors transition-all` — `transition-all` is more specific and wins. Good.

**NOTE**: With Button's `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors` base, the ActionCard will get `font-medium` added to its text (currently no font-weight on the text). This might subtly change appearance. Check after build.

## Migration Order (dependencies → risk)

| # | File | Risk | Complexity |
|---|------|------|------------|
| 1 | TermsPage.tsx | Low | 1 button, simple |
| 2 | TechnologyDetailPage.tsx (link) | Low | 1 button, simple |
| 3 | LoginPage.tsx (copy btn) | Low | 1 button, matches ghost well |
| 4 | ObsolescencePage.tsx (6 stat-cards) | Medium | 6 identical, batch |
| 5 | LoginPage.tsx (OTP submit) | Medium | 2 submit buttons |
| 6 | TechnologyDetailPage.tsx (tabs) | Medium | Uses template literal |
| 7 | LoginPage.tsx (user cards) | High | Card-like, complex overrides |
| 8 | AdminPage.tsx (ActionCard) | High | cn() + dynamic colors |
| 9 | Shared/EntityCard + SimpleCard | High | Conditional rendering |
| 10 | RelatedEntitiesView EntityCard | Medium | Matches TDP EntityCard |

## Verification Steps

After each file:
1. `npm run build` — must pass with 0 errors
2. Visual check (browser) — verify button looks and behaves identically
3. If 2 consecutive failures → REVERT file, note the issue, try alternative mapping

## Final Verification

- [ ] `grep -r "<button[ >]" src/features --include="*.tsx"` → 0 matches
- [ ] `npm run build` → ✓ built in Ns
- [ ] Cada botón migrado se ve y funciona igual
