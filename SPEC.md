# Nexlands - Educational Game Platform

## 1. Project Overview

**Project Name:** Nexlands  
**Type:** Educational Game Website (Single Page)  
**Core Functionality:** A gamified learning platform combining quiz mechanics (Kahoot-style) with story-driven adventures - making education both fun and engaging.  
**Target Users:** Students (ages 8-18), Teachers, Schools

---

## 2. UI/UX Specification

### Layout Structure

**Sections:**
1. **Navigation Bar** - Fixed top, logo + nav links + CTA buttons
2. **Hero Section** - Full viewport, animated headline, game preview visual
3. **Features Section** - 3-column grid showing game modes
4. **How It Works** - 4-step horizontal process
5. **Testimonials** - Carousel of user quotes
6. **Stats Section** - Animated counters (students, games, questions)
7. **CTA Section** - Call to action for starting
8. **Footer** - Links, social, copyright

**Responsive Breakpoints:**
- Mobile: < 768px (single column, stacked)
- Tablet: 768px - 1024px (2 columns)
- Desktop: > 1024px (full layout)

### Visual Design

**Color Palette:**
- Primary: `#6366F1` (Indigo - main brand)
- Secondary: `#10B981` (Emerald - success/correct)
- Accent: `#F59E0B` (Amber - attention/stars)
- Error: `#EF4444` (Red - wrong answers)
- Dark: `#1E1B4B` (Deep indigo - backgrounds)
- Light: `#F8FAFC` (Off-white - text bg)
- Text Primary: `#FFFFFF`
- Text Secondary: `#94A3B8`

**Typography:**
- Headings: 'Outfit', sans-serif (bold, 700)
- Body: 'DM Sans', sans-serif (400, 500)
- Hero Title: 64px desktop, 36px mobile
- Section Titles: 40px desktop, 28px mobile
- Body: 18px

**Spacing System:**
- Section padding: 100px vertical desktop, 60px mobile
- Card padding: 32px
- Gap between elements: 24px

**Visual Effects:**
- Glassmorphism cards with backdrop-blur
- Gradient mesh background (indigo to purple to pink)
- Floating particle animation in hero
- Hover scale (1.05) with box-shadow on cards
- Smooth scroll behavior

### Components

**Navigation:**
- Logo (text-based "Nexlands" with icon)
- Links: Oyunlar, Özellikler, Nasıl Çalışır, İletişim
- Buttons: Giriş Yap (outline), Hemen Başla (filled)

**Hero:**
- Large animated headline with gradient text
- Subheadline describing the game
- Two CTA buttons
- Abstract game illustration (CSS shapes)

**Feature Cards (3):**
1. Quiz Modu - Lightning icon, quiz description
2. Hikaye Modu - Book icon, story mode description
3. Sınıf Yönetimi - Users icon, classroom features

**Step Cards (4):**
1. Kaydol - Register
2. Oyun Oluştur - Create game
3. Öğrencilerini Davet Et - Invite students
4. Oyna ve Öğren - Play and learn

**Stats Counter:**
- 50,000+ Öğrenci
- 1,000+ Oyun
- 100,000+ Soru

---

## 3. Functionality Specification

### Core Features
- Smooth scroll navigation
- Animated statistics counter on scroll
- Hover animations on all interactive elements
- Mobile hamburger menu
- Button hover/active states

### User Interactions
- Click nav links → smooth scroll to section
- Click "Hemen Başla" → anchor to features
- Hover cards → scale + glow effect
- Mobile menu toggle

### Animations
- Hero text fade-in on load (staggered)
- Feature cards slide-up on scroll
- Stats count up animation when visible
- Floating shapes in background (CSS keyframes)

---

## 4. Acceptance Criteria

- [ ] Page loads without errors
- [ ] All sections visible and properly styled
- [ ] Navigation works (smooth scroll)
- [ ] Mobile responsive (hamburger menu works)
- [ ] Animations trigger correctly
- [ ] Colors match exact hex codes specified
- [ ] Typography uses specified fonts
- [ ] All interactive elements have hover states