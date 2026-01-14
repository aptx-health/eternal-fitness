# RIPIT DOOM THEME - QUICK REFERENCE

## Most Important Classes (Use These First)

### Typography
```jsx
<h1 className="doom-title">         // Page titles - aggressive uppercase
<h2 className="doom-heading">       // Section headings
<label className="doom-label">      // Form labels, table headers
<span className="doom-stat">        // Numbers (reps, weight, stats)
```

### Buttons
```jsx
<button className="doom-button">           // Primary orange button
<button className="doom-button-secondary"> // Gray secondary button
```

### Cards
```jsx
<div className="doom-card doom-noise">                    // Basic card
<div className="doom-card doom-noise doom-corners">       // Card with corner accents
<div className="doom-card doom-angular">                  // Card with clipped corners
<div className="doom-card doom-metal">                    // Card with metal texture
```

### Workout States
```jsx
<div className="doom-workout-completed doom-noise doom-corners">  // Completed
<div className="doom-workout-progress doom-noise doom-corners">   // In progress (pulsing)
<div className="doom-workout-pending">                            // Pending
```

### Badges
```jsx
<span className="doom-badge doom-badge-completed">  // Green "COMPLETED"
<span className="doom-badge doom-badge-progress">   // Orange "IN PROGRESS" (pulsing)
<span className="doom-badge doom-badge-pending">    // Gray "PENDING"
```

### Textures (Add to containers)
```jsx
doom-noise       // Subtle grain texture
doom-metal       // Brushed metal (for nav bars, headers)
doom-scanlines   // CRT scanlines (optional, subtle)
doom-corners     // Orange corner accents
doom-angular     // Clipped polygon corners
```

### Shapes
```jsx
doom-bevel-raised  // 3D raised effect
doom-corners       // Corner accent lines
doom-angular       // Clip-path corners
```

---

## Color Reference (Tailwind Classes)

### Backgrounds
- `bg-zinc-950` - Darkest (nav bar, table headers)
- `bg-zinc-900` - Very dark (page background)
- `bg-zinc-800` - Dark (card background)
- `bg-zinc-700` - Medium dark (nested sections)

### Text
- `text-orange-50` - Primary text (almost white, warm)
- `text-zinc-300` - Secondary text
- `text-zinc-400` - Tertiary text
- `text-zinc-500` - Muted text

### Accents
- `text-orange-500` - Primary links, branding
- `text-orange-600` - Primary buttons
- `text-green-400` - Completed state
- `text-orange-400` - In-progress state

### Borders
- `border-zinc-700` - Standard borders
- `border-zinc-600` - Input borders
- `border-orange-600` - Active/hover borders
- `border-green-700` - Completed workout borders

---

## Common Patterns

### Workout Card (Completed)
```jsx
<div className="doom-workout-completed doom-noise doom-corners p-6">
  <div className="flex items-center justify-between">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <CheckIcon className="text-green-400" />
        <span className="doom-badge doom-badge-completed">COMPLETED</span>
      </div>
      <h3 className="doom-heading text-2xl text-orange-50">
        {workout.name}
      </h3>
      <p className="text-green-400 text-sm font-semibold">
        COMPLETED ON {date}
      </p>
    </div>
  </div>
</div>
```

### Exercise Card
```jsx
<div className="doom-card doom-metal overflow-hidden">
  <div className="p-5 border-b border-zinc-700 doom-bevel-raised">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 bg-orange-600 flex items-center justify-center doom-bevel-raised">
        <span className="text-white font-bold text-xl">{number}</span>
      </div>
      <div>
        <h3 className="doom-heading text-2xl text-orange-50">{name}</h3>
      </div>
    </div>
  </div>
  <table className="w-full">
    <thead>
      <tr className="bg-zinc-950 border-b border-zinc-700">
        <th className="text-left p-4 doom-label text-zinc-300">SET</th>
        {/* ... */}
      </tr>
    </thead>
  </table>
</div>
```

### Primary Button
```jsx
<button className="doom-button" onClick={handleSubmit}>
  RIP IT
</button>
```

### Stat Display
```jsx
<div className="doom-card doom-metal doom-corners p-6 text-center">
  <p className="doom-label text-zinc-400 mb-2">TOTAL WORKOUTS</p>
  <p className="doom-stat text-5xl text-orange-500">{count}</p>
</div>
```

---

## Installation Steps

1. **Add font to HTML:**
```html
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet">
```

2. **Create CSS file:** `src/styles/doom-theme.css` (copy from IMPLEMENTATION_GUIDE.md)

3. **Import in your app:**
```jsx
import './styles/doom-theme.css';
```

4. **Update Tailwind config** (if using custom colors):
```js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Rajdhani', 'sans-serif'],
      },
    },
  },
}
```

---

## Replace These Common Classes

| Old (Generic) | New (DOOM) |
|--------------|------------|
| `rounded-lg` | `doom-angular` or remove |
| `bg-white` | `bg-zinc-800 doom-noise` |
| `bg-gray-50` | `bg-zinc-700` |
| `text-gray-900` | `text-orange-50` |
| `text-blue-600` | `text-orange-500` |
| `border-gray-200` | `border-zinc-700` |
| Button classes | `doom-button` |

---

## Performance Tips

- All effects are CSS-only (no images)
- Textures use inline SVG (no HTTP requests)
- Animations use GPU-accelerated properties
- Compatible with Tailwind JIT

---

## Troubleshooting

**Textures not showing?**
- Check that parent has `position: relative`
- Ensure `doom-noise > *` elements have `position: relative` and `z-index: 2`

**Corners cut off?**
- Add `overflow: visible` to parent
- Check clip-path isn't being overridden

**Buttons not 3D?**
- Ensure no conflicting box-shadow styles
- Check transform isn't disabled

**Animations jerky?**
- Use `will-change: transform` for animated elements
- Reduce number of simultaneous animations

---

Built for RIPIT 🐸💪
