# RIPIT DOOM Theme - Complete Implementation Guide

This guide contains everything needed to transform your Tailwind app into a DOOM-themed experience. All textures, patterns, and effects are implemented using pure CSS - no external image dependencies needed.

## Table of Contents
1. [Core Setup](#core-setup)
2. [Textures & Backgrounds](#textures--backgrounds)
3. [Typography](#typography)
4. [Shapes & Borders](#shapes--borders)
5. [Buttons & Interactive Elements](#buttons--interactive-elements)
6. [Cards & Containers](#cards--containers)
7. [Workout State Styles](#workout-state-styles)
8. [Icons & Symbols](#icons--symbols)
9. [Animations](#animations)
10. [Component Examples](#component-examples)

---

## Core Setup

### 1. Add Custom CSS File
Create `src/styles/doom-theme.css`:

```css
/* ============================================
   RIPIT DOOM THEME - BASE STYLES
   ============================================ */

/* Root variables for easy tweaking */
:root {
  --doom-orange: #EA580C;
  --doom-orange-light: #F97316;
  --doom-orange-dark: #C2410C;
  --doom-red: #DC2626;
  --doom-green: #22C55E;
  --doom-green-dark: #15803D;
  --doom-zinc-950: #09090B;
  --doom-zinc-900: #18181B;
  --doom-zinc-800: #27272A;
  --doom-zinc-700: #3F3F46;
  --doom-zinc-600: #52525B;
  
  /* Animation speeds */
  --doom-transition-fast: 0.1s;
  --doom-transition-medium: 0.3s;
  --doom-transition-slow: 0.6s;
}

/* Base body setup */
body {
  font-family: 'Rajdhani', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: 0.02em;
}

/* Smooth scroll for better UX */
html {
  scroll-behavior: smooth;
}
```

### 2. Import Google Font
Add to your `index.html` or main layout:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap" rel="stylesheet">
```

Or in your CSS:
```css
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap');
```

---

## Textures & Backgrounds

### Noise Texture Overlay
Adds subtle grain to prevent flat, digital look:

```css
.doom-noise {
  position: relative;
}

.doom-noise::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 1;
}

.doom-noise > * {
  position: relative;
  z-index: 2;
}
```

**Usage:** Add `doom-noise` class to cards, containers, or the body element.

---

### Scanline Effect
Classic CRT monitor scanlines:

```css
.doom-scanlines {
  position: relative;
}

.doom-scanlines::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.1) 4px
  );
  pointer-events: none;
  z-index: 10;
  opacity: 0.3;
}
```

**Usage:** Add `doom-scanlines` to full-screen containers or modals for retro effect.

---

### Brushed Metal Texture
Industrial metallic surface:

```css
.doom-metal {
  background: 
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(255, 255, 255, 0.05) 50%,
      transparent 100%
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255, 255, 255, 0.02) 2px,
      rgba(255, 255, 255, 0.02) 4px
    );
}
```

**Usage:** Background for cards, navigation bars, section headers.

---

### Page Backgrounds
For main page backgrounds, keep it simple:

```css
/* Just use solid colors with optional subtle noise */
body {
  background: var(--doom-zinc-900);
}

/* OR with very subtle texture */
body {
  background: var(--doom-zinc-900);
}
body.doom-noise::before {
  /* noise overlay already defined above */
}
```

**Usage:** Don't over-texture. Let the shapes, glows, and typography carry the aesthetic.

---

## Typography

### Heading Styles

```css
/* Main page titles - AGGRESSIVE */
.doom-title {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  text-shadow: 
    2px 2px 0 rgba(0, 0, 0, 0.5),
    0 0 20px rgba(234, 88, 12, 0.3);
}

/* Section headings - Bold but smaller */
.doom-heading {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

/* Labels - Subtle uppercase */
.doom-label {
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.75rem;
}
```

**Tailwind Integration:**
```jsx
<h1 className="text-4xl doom-title text-orange-50">FULL BODY 4</h1>
<h2 className="text-2xl doom-heading text-orange-50">LEG CURL</h2>
<label className="doom-label text-zinc-400">Set</label>
```

---

### Number Display (Stats/Metrics)
Big, bold numbers for reps, weight, etc:

```css
.doom-stat {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
```

**Usage:**
```jsx
<span className="text-5xl doom-stat text-orange-500">225</span>
```

---

## Shapes & Borders

### Angular Corners (Clipped)
Remove soft rounded corners:

```css
.doom-angular {
  border-radius: 0;
  clip-path: polygon(
    0% 8px,
    8px 0%,
    calc(100% - 8px) 0%,
    100% 8px,
    100% calc(100% - 8px),
    calc(100% - 8px) 100%,
    8px 100%,
    0% calc(100% - 8px)
  );
}
```

**Usage:** Replace `rounded-lg` with `doom-angular` on cards.

---

### Notched Corners (UAC Style)

```css
.doom-notched {
  position: relative;
  background-clip: padding-box;
}

.doom-notched::before {
  content: '';
  position: absolute;
  inset: 0;
  background: inherit;
  clip-path: polygon(
    12px 0%, 
    100% 0%, 
    100% calc(100% - 12px), 
    calc(100% - 12px) 100%, 
    0% 100%, 
    0% 12px
  );
  z-index: -1;
}
```

---

### Beveled Edges (3D Inset/Outset)

```css
/* Raised bevel */
.doom-bevel-raised {
  border: 2px solid;
  border-color: rgba(255, 255, 255, 0.15) rgba(0, 0, 0, 0.3) rgba(0, 0, 0, 0.3) rgba(255, 255, 255, 0.15);
  box-shadow: 
    inset 1px 1px 0 rgba(255, 255, 255, 0.1),
    inset -1px -1px 0 rgba(0, 0, 0, 0.3);
}

/* Inset bevel */
.doom-bevel-inset {
  border: 2px solid;
  border-color: rgba(0, 0, 0, 0.3) rgba(255, 255, 255, 0.15) rgba(255, 255, 255, 0.15) rgba(0, 0, 0, 0.3);
  box-shadow: 
    inset -1px -1px 0 rgba(255, 255, 255, 0.05),
    inset 1px 1px 2px rgba(0, 0, 0, 0.5);
}
```

---

### Corner Accents (Pentagrams/Lines)

```css
.doom-corners {
  position: relative;
}

/* Top-left corner */
.doom-corners::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 16px;
  height: 16px;
  border-top: 3px solid var(--doom-orange);
  border-left: 3px solid var(--doom-orange);
}

/* Bottom-right corner */
.doom-corners::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 16px;
  height: 16px;
  border-bottom: 3px solid var(--doom-orange);
  border-right: 3px solid var(--doom-orange);
}
```

---

## Buttons & Interactive Elements

### Primary Button (3D Pressed Effect)

```css
.doom-button {
  position: relative;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(180deg, #EA580C 0%, #C2410C 100%);
  border: none;
  color: white;
  cursor: pointer;
  transition: all var(--doom-transition-fast) ease;
  
  /* 3D depth */
  box-shadow: 
    0 4px 0 #92400E,
    0 6px 8px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  
  transform: translateY(0);
}

.doom-button:hover {
  background: linear-gradient(180deg, #F97316 0%, #EA580C 100%);
  box-shadow: 
    0 4px 0 #92400E,
    0 0 30px rgba(234, 88, 12, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.doom-button:active {
  transform: translateY(4px);
  box-shadow: 
    0 0 0 #92400E,
    0 2px 4px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.doom-button:disabled {
  background: linear-gradient(180deg, #52525B 0%, #3F3F46 100%);
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.5;
}
```

---

### Secondary Button (Gray)

```css
.doom-button-secondary {
  position: relative;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(180deg, #52525B 0%, #3F3F46 100%);
  border: 1px solid #71717A;
  color: #D4D4D8;
  cursor: pointer;
  transition: all var(--doom-transition-fast) ease;
  
  box-shadow: 
    0 2px 0 #27272A,
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.doom-button-secondary:hover {
  background: linear-gradient(180deg, #71717A 0%, #52525B 100%);
  border-color: #A1A1AA;
  color: #FFF7ED;
}
```

---

### Link Styles

```css
.doom-link {
  color: var(--doom-orange-light);
  text-decoration: none;
  font-weight: 600;
  transition: all var(--doom-transition-medium) ease;
  position: relative;
}

.doom-link::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--doom-orange);
  transition: width var(--doom-transition-medium) ease;
}

.doom-link:hover {
  color: #FB923C;
}

.doom-link:hover::after {
  width: 100%;
}
```

---

## Cards & Containers

### Basic DOOM Card

```css
.doom-card {
  background: var(--doom-zinc-800);
  border: 1px solid var(--doom-zinc-700);
  position: relative;
  overflow: hidden;
  transition: all var(--doom-transition-medium) ease;
}

.doom-card:hover {
  border-color: rgba(234, 88, 12, 0.5);
  box-shadow: 0 0 20px rgba(234, 88, 12, 0.2);
}
```

**Combine with other classes:**
```jsx
<div className="doom-card doom-noise doom-corners p-6">
  {/* Card content */}
</div>
```

---

### Glowing Card Border

```css
.doom-card-glow {
  position: relative;
  background: var(--doom-zinc-800);
  border: 2px solid transparent;
  background-clip: padding-box;
}

.doom-card-glow::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(135deg, var(--doom-orange), var(--doom-red));
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.5;
  transition: opacity var(--doom-transition-medium) ease;
}

.doom-card-glow:hover::before {
  opacity: 1;
}
```

---

### Section Header Bar

```css
.doom-section-header {
  background: linear-gradient(
    90deg,
    transparent,
    var(--doom-orange) 20%,
    var(--doom-orange) 80%,
    transparent
  );
  height: 2px;
  position: relative;
  margin: 2rem 0;
}

.doom-section-header::before {
  content: '◆';
  position: absolute;
  left: 50%;
  top: -10px;
  transform: translateX(-50%);
  color: var(--doom-orange);
  font-size: 1.2rem;
  background: var(--doom-zinc-900);
  padding: 0 1rem;
}
```

---

## Workout State Styles

### Completed Workout Card

```css
.doom-workout-completed {
  background: 
    linear-gradient(135deg, 
      rgba(21, 128, 61, 0.15) 0%, 
      rgba(21, 128, 61, 0.05) 100%
    ),
    var(--doom-zinc-800);
  border: 2px solid var(--doom-green-dark);
  box-shadow: 
    0 0 20px rgba(34, 197, 94, 0.3),
    inset 0 1px 0 rgba(34, 197, 94, 0.1);
  transition: all var(--doom-transition-medium) ease;
}

.doom-workout-completed:hover {
  border-color: var(--doom-green);
  box-shadow: 
    0 0 30px rgba(34, 197, 94, 0.5),
    inset 0 1px 0 rgba(34, 197, 94, 0.2);
}
```

---

### In-Progress Workout Card

```css
.doom-workout-progress {
  background: 
    linear-gradient(135deg, 
      rgba(234, 88, 12, 0.15) 0%, 
      rgba(234, 88, 12, 0.05) 100%
    ),
    var(--doom-zinc-800);
  border: 2px solid var(--doom-orange);
  animation: doom-pulse 2s ease-in-out infinite;
  box-shadow: 
    0 0 20px rgba(234, 88, 12, 0.3),
    inset 0 1px 0 rgba(234, 88, 12, 0.1);
}

@keyframes doom-pulse {
  0%, 100% { 
    box-shadow: 
      0 0 20px rgba(234, 88, 12, 0.3),
      inset 0 1px 0 rgba(234, 88, 12, 0.1);
  }
  50% { 
    box-shadow: 
      0 0 40px rgba(234, 88, 12, 0.6),
      inset 0 1px 0 rgba(234, 88, 12, 0.2);
  }
}
```

---

### Pending Workout Card

```css
.doom-workout-pending {
  background: var(--doom-zinc-700);
  border: 1px solid var(--doom-zinc-600);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.3);
  opacity: 0.7;
  transition: opacity var(--doom-transition-medium) ease;
}

.doom-workout-pending:hover {
  opacity: 1;
}
```

---

### Status Badges

```css
.doom-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border-radius: 0;
  clip-path: polygon(4px 0%, 100% 0%, calc(100% - 4px) 100%, 0% 100%);
}

.doom-badge-completed {
  background: var(--doom-green);
  color: white;
  box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
}

.doom-badge-progress {
  background: var(--doom-orange);
  color: white;
  box-shadow: 0 0 10px rgba(234, 88, 12, 0.5);
  animation: doom-badge-pulse 1.5s ease-in-out infinite;
}

@keyframes doom-badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.doom-badge-pending {
  background: var(--doom-zinc-600);
  color: var(--doom-zinc-300);
}
```

---

## Icons & Symbols

### SVG Pentagram Component

```jsx
// Pentagram.jsx
export const Pentagram = ({ className, size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path 
      d="M12 2L14.5 9.5H22L16 14L18.5 21.5L12 17L5.5 21.5L8 14L2 9.5H9.5L12 2Z" 
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Usage:
<Pentagram className="text-orange-600" size={32} />
```

---

### CSS-Only Loading Spinner

```css
.doom-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--doom-zinc-700);
  border-top-color: var(--doom-orange);
  border-radius: 50%;
  animation: doom-spin 0.8s linear infinite;
}

@keyframes doom-spin {
  to { transform: rotate(360deg); }
}
```

---

### Checkmark Icon (Completed)

```jsx
export const DoomCheck = ({ className, size = 24 }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
  >
    <path 
      d="M20 6L9 17L4 12" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </svg>
);
```

---

## Animations

### Screen Shake (On PR)

```css
@keyframes doom-shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.doom-shake {
  animation: doom-shake 0.5s ease-in-out;
}
```

**Trigger with JS:**
```jsx
const handlePR = () => {
  document.body.classList.add('doom-shake');
  setTimeout(() => document.body.classList.remove('doom-shake'), 500);
};
```

---

### Glory Kill Flash (Completion)

```css
@keyframes doom-glory-flash {
  0% { 
    opacity: 0;
    transform: scale(0.8);
  }
  50% { 
    opacity: 1;
    transform: scale(1.2);
  }
  100% { 
    opacity: 0;
    transform: scale(1);
  }
}

.doom-glory-flash {
  animation: doom-glory-flash 0.6s ease-out;
}
```

---

### Number Count-Up Animation

```jsx
// useCountUp hook
import { useEffect, useState } from 'react';

export const useCountUp = (end, duration = 1000) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.ceil(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [end, duration]);
  
  return count;
};

// Usage:
const displayWeight = useCountUp(225, 800);
<span className="doom-stat text-5xl">{displayWeight}</span>
```

---

### Hover Glow Effect

```css
.doom-hover-glow {
  transition: all var(--doom-transition-medium) ease;
}

.doom-hover-glow:hover {
  filter: drop-shadow(0 0 20px rgba(234, 88, 12, 0.6));
}
```

---

## Component Examples

### Complete Workout Card Component

```jsx
const DoomWorkoutCard = ({ workout, status, date }) => {
  const statusClasses = {
    completed: 'doom-workout-completed',
    progress: 'doom-workout-progress',
    pending: 'doom-workout-pending'
  };
  
  const badgeClasses = {
    completed: 'doom-badge-completed',
    progress: 'doom-badge-progress',
    pending: 'doom-badge-pending'
  };
  
  return (
    <div className={`doom-card doom-noise doom-corners p-6 ${statusClasses[status]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {status === 'completed' && (
              <DoomCheck className="text-green-400" size={24} />
            )}
            <span className={`doom-badge ${badgeClasses[status]}`}>
              {status === 'completed' && 'COMPLETED'}
              {status === 'progress' && 'IN PROGRESS'}
              {status === 'pending' && 'PENDING'}
            </span>
          </div>
          
          <h3 className="doom-heading text-2xl text-orange-50 mb-1">
            {workout.name}
          </h3>
          
          {date && (
            <p className="doom-label text-sm">
              {status === 'completed' ? 'Completed' : 'Started'} on {date}
            </p>
          )}
        </div>
        
        <span className="text-zinc-600 text-2xl">→</span>
      </div>
    </div>
  );
};
```

---

### DOOM Button Component

```jsx
const DoomButton = ({ 
  children, 
  variant = 'primary', 
  disabled = false, 
  onClick,
  ...props 
}) => {
  const baseClass = variant === 'primary' 
    ? 'doom-button' 
    : 'doom-button-secondary';
  
  return (
    <button
      className={baseClass}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Usage:
<DoomButton onClick={handleSubmit}>
  RIP IT
</DoomButton>
```

---

### Exercise Card with Table

```jsx
const DoomExerciseCard = ({ exercise, sets }) => {
  return (
    <div className="doom-card doom-metal overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-zinc-700 doom-bevel-raised">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center doom-bevel-raised">
            <span className="text-white font-bold text-xl">
              {exercise.number}
            </span>
          </div>
          <div>
            <h3 className="doom-heading text-2xl text-orange-50">
              {exercise.name}
            </h3>
            {exercise.notes && (
              <p className="text-zinc-400 text-sm mt-1">
                {exercise.notes}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-900 border-b border-zinc-700">
              <th className="text-left p-4 doom-label text-zinc-300">Set</th>
              <th className="text-left p-4 doom-label text-zinc-300">Reps</th>
              <th className="text-left p-4 doom-label text-zinc-300">Weight</th>
              <th className="text-left p-4 doom-label text-zinc-300">RPE</th>
            </tr>
          </thead>
          <tbody>
            {sets.map((set, idx) => (
              <tr 
                key={idx}
                className="border-b border-zinc-700 hover:bg-zinc-750 transition"
              >
                <td className="p-4 doom-stat text-orange-50">{set.number}</td>
                <td className="p-4 doom-stat text-orange-50">{set.reps}</td>
                <td className="p-4 text-zinc-400">{set.weight || '-'}</td>
                <td className="p-4 doom-stat text-orange-50">{set.rpe}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

---

## Quick Start Checklist

1. ✅ Add Rajdhani font to project
2. ✅ Create `doom-theme.css` with all styles above
3. ✅ Import CSS file in your main app
4. ✅ Replace `rounded-lg` with `doom-angular` on cards
5. ✅ Add `doom-noise` to major containers
6. ✅ Replace button classes with `doom-button`
7. ✅ Add `doom-heading` and `doom-title` to text
8. ✅ Update workout cards with state-specific classes
9. ✅ Add corner accents with `doom-corners`
10. ✅ Test hover states and interactions

---

## Performance Notes

- All effects are CSS-only (no image files to load)
- Animations use `transform` and `opacity` (GPU-accelerated)
- Textures use inline SVG data URIs (no HTTP requests)
- Compatible with Tailwind's JIT compiler
- Works with dark mode system preferences

---

## Customization

All colors are defined as CSS variables at the top of the file. To adjust:

```css
:root {
  --doom-orange: #YOUR_COLOR; /* Change primary accent */
  --doom-green: #YOUR_COLOR;  /* Change completion color */
  /* etc */
}
```

---

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (15+)
- Mobile: Full support (iOS 15+, Android 10+)

Clip-path and backdrop-filter have excellent modern browser support.

---

## What's Next?

Once base styles are implemented:
1. Add more pentagram decorations
2. Create custom loading animations
3. Add sound effects (optional)
4. Implement parallax scrolling for backgrounds
5. Add particle effects on completion
6. Create custom cursors

---

Built for RIPIT 🐸💪
