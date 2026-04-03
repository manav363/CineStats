# CineStats 🎬
> **A premium cinematic movie discovery dashboard** — search, filter, sort, and save films with sleek dark UI, smooth 3D animations, and advanced filtering powered by TMDB.

[![Made with Vanilla JS](https://img.shields.io/badge/Made%20with-Vanilla%20JS-F7DF1E?style=flat-square)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TMDB API](https://img.shields.io/badge/Powered%20by-TMDB%20API-01B4F1?style=flat-square)](https://www.themoviedb.org/documentation/api)
[![Responsive Design](https://img.shields.io/badge/Responsive-Mobile%20%7C%20Tablet%20%7C%20Desktop-brightgreen?style=flat-square)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](#-license)

---

## 🎯 Overview

**CineStats** is a full-featured movie discovery application built with vanilla JavaScript, HTML5, and CSS3. It demonstrates professional-grade front-end development practices including:
- **Real-time API integration** with The Movie Database (TMDB)
- **Advanced filtering & search** using only Array Higher-Order Functions
- **Premium UI/UX** with smooth animations, 3D effects, and dark/light themes
- **Accessibility-first** design (WCAG compliant, keyboard navigation, focus management)
- **Production-ready code** with error handling, debouncing, and state management

---

## ✨ Core Features

| Feature | Description | Implementation |
|---------|-------------|-----------------|
| 🔎 **Smart Search** | Live search by title with debouncing (400ms) | Filters results client-side using `Array.filter()` |
| 🎛️ **Genre Filter** | Filter by movie genres from TMDB's master list | Dynamic dropdown populated from API |
| ⭐ **Rating Filter** | Show only films above minimum rating (5-9 stars) | Uses `Array.filter()` with numeric comparison |
| 📅 **Year Filter** | Browse movies by release year | Years extracted dynamically from results |
| 📊 **Advanced Sort** | Sort by rating, title (A-Z), or date | Uses `Array.sort()` with custom comparators |
| ❤️ **Favourites** | Save films with one click, persisted locally | Stored in `localStorage` as JSON array |
| 🌙 **Dark/Light Mode** | Toggle themes with preference saved | CSS custom properties + localStorage |
| 📄 **Pagination** | Browse through result pages (up to 500 pages) | Native TMDB pagination support |
| ⚙️ **3D Animations** | Cinematic 3D card flips, depth effects, parallax | CSS 3D transforms + GPU acceleration |
| 🎨 **Responsive Design** | Optimized for mobile, tablet, and desktop | CSS Grid + mobile-first breakpoints |
| ⚠️ **Error Handling** | Graceful error states with retry button | Network error handling + user feedback |
| ♿ **Accessibility** | Keyboard navigation, focus management, ARIA labels | WCAG 2.1 AA compliant |

---

## 🏗️ Architecture & Code Quality

### **Separation of Concerns**
```
js/
├── api.js       → All TMDB API calls (async/await, error handling)
├── filters.js   → Pure functions for search/filter/sort (HOFs only)
├── ui.js        → DOM rendering & state display (no business logic)
└── app.js       → Application state & event binding (orchestration)
```

### **Key Design Patterns**
- **Module Pattern** — Each JS file is self-contained with clear exports
- **Observer Pattern** — Event listeners delegate from document root
- **Singleton Pattern** — `UI`, `API`, `Filters`, `Storage` objects
- **Debouncing** — Search input debounced to prevent API spam
- **Higher-Order Functions** — All filtering/sorting uses `.filter()`, `.sort()`, `.map()`

### **Array HOFs (No Traditional Loops)**
✅ **Strictly enforced** — No `for`, `while`, or `for...of` in filters.js
```javascript
// ✅ Good: Using HOFs
bySearch(movies, query) {
  return movies.filter(m => m.title.toLowerCase().includes(q));
}

// ❌ Bad: Traditional loop (NOT USED)
// for (let i = 0; i < movies.length; i++) { ... }
```

---

## 🌐 API Integration

### **TMDB API Details**
- **Service:** [The Movie Database API v3](https://www.themoviedb.org/documentation/api)
- **Authentication:** Free API key (no payment required)
- **Rate Limit:** 40 requests per 10 seconds
- **Data Format:** JSON

### **Endpoints Used**
| Endpoint | Purpose |
|----------|---------|
| `/trending/movie/{window}` | Get trending movies (week/day) |
| `/movie/top_rated` | Top-rated films of all time |
| `/movie/upcoming` | Upcoming movie releases |
| `/search/movie` | Search by title |
| `/movie/{id}` | Get full movie details (genres, runtime, overview) |
| `/genre/movie/list` | Fetch genre master list |

### **Error Handling**
- Network errors caught with try-catch
- Invalid responses handled gracefully
- User-friendly error messages displayed
- Retry button for failed requests

---

## 🛠️ Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) | Semantic markup, CSS Grid/Flexbox |
| **API** | TMDB v3 (REST) | Fetch API with async/await |
| **State Management** | localStorage | Favourites + theme preference |
| **Styling** | CSS Custom Properties | 100+ CSS variables for theming |
| **Animations** | CSS 3D Transforms, Keyframes | GPU-accelerated, 60fps |
| **Build** | None | Pure vanilla — no webpack/bundlers |
| **Dependencies** | Zero external libraries | 100% vanilla JS |

---

## 🎨 Design Features

### **Color Scheme (Dark Mode)**
- **Background:** Pure black `#0a0a0a`
- **Cards:** Dark grey `#1f1f1f` with glassmorphism
- **Accents:** Silver `#c0c0c0` & light grey `#e8e8e8`
- **Text:** Light grey `#f0f0f0` for contrast

### **Animations**
- **3D Card Flips** — `rotateX()`, `rotateY()` on hover
- **Parallax Depth** — Hero background at different Z-planes
- **Modal Entrance** — Complex 3D transforms (blur, scale, rotate)
- **Heart Flip** — 3D rotation when adding to favourites
- **Micro-interactions** — Buttons, badges, focus states

### **Responsive Breakpoints**
- **1100px** — 4 → 3 column grid
- **900px** — 3 → 2 column grid
- **780px** — Tablet optimized layout
- **520px** — Single column mobile
- **380px** — Extra small phones

---

## 🚀 Quick Start

### **1️⃣ Get TMDB API Key**
1. Sign up for free at [themoviedb.org](https://www.themoviedb.org/signup)
2. Navigate to **Settings → API**
3. Copy your **API Key (v3 auth)**

### **2️⃣ Add Your API Key**
Edit `js/api.js` (line 7):
```javascript
const API_KEY = "YOUR_TMDB_API_KEY_HERE";
```

### **3️⃣ Run Locally**
**Option A: Browser**
- Simply open `index.html` in your browser ✅

**Option B: Live Server (Recommended)**
```bash
# Install Live Server extension in VS Code
# Then right-click index.html → "Open with Live Server"
```

**Option C: Local Server**
```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server
```
Then visit `http://localhost:8000`

---

## 📁 Project Structure

```
CineStats/
├── 📄 index.html              ← Entry point (semantic HTML5)
├── 📄 README.md               ← This file
├── 📁 css/
│   └── style.css              ← All styling (1400+ lines)
│                                 - CSS variables for theming
│                                 - Grid/Flexbox layouts
│                                 - 3D animations & keyframes
│                                 - Responsive breakpoints
│                                 - Accessibility (focus states)
├── 📁 js/
│   ├── api.js                 ← TMDB API wrapper (async/await)
│   ├── filters.js             ← Pure HOF logic (no loops)
│   ├── ui.js                  ← DOM rendering & templates
│   └── app.js                 ← State & event orchestration
└── 📁 assets/
    └── favicon.ico            ← App icon
```

### **File Sizes**
- `index.html` — ~7 KB
- `css/style.css` — ~45 KB (minifiable)
- `js/api.js` — ~2 KB
- `js/filters.js` — ~3 KB
- `js/ui.js` — ~12 KB
- `js/app.js` — ~12 KB
- **Total:** ~80 KB (uncompressed)

---

## 💡 Usage Examples

### **Search Movies**
Type in the search box — results are debounced and filtered client-side.

### **Filter by Genre**
Select a genre from the dropdown to show only movies in that category.

### **Sort Results**
Choose sort option: Rating (high→low), Title (A-Z), or Date (newest first).

### **Save Favourites**
Click the heart icon (♡) on any movie card to add to favourites. Saved to localStorage.

### **View Details**
Click on any movie card to open a full-screen modal with details, ratings, genres, and overview.

### **Switch Theme**
Click the theme toggle (☽/☀) in the header to switch between dark and light modes.

---

## ⭐ Bonus Features

✅ **Debouncing** — Search input throttled at 400ms to reduce API calls  
✅ **Local Storage** — Favourites and theme preference persist across sessions  
✅ **Loading States** — Animated spinner during API requests  
✅ **Pagination** — Navigate through multiple pages of results  
✅ **3D Animations** — Premium cinematic effects with GPU acceleration  
✅ **Accessibility** — Keyboard navigation, focus trapping, ARIA labels  
✅ **Error Recovery** — Network error handling with retry button  
✅ **Responsive Design** — Mobile-first approach, tested on all screen sizes  

---

## 🔧 Development Notes

### **Browser Support**
- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### **Performance**
- **No external dependencies** — Pure vanilla JS (~80 KB total)
- **GPU-accelerated animations** — 3D transforms use `will-change` & `transform: translateZ(0)`
- **Efficient DOM rendering** — Card animation delays use CSS, not JS
- **Debounced search** — Prevents API spam
- **Lazy image loading** — `loading="lazy"` on movie posters

### **Testing Locally**
```javascript
// Open DevTools console and test:
console.log(State);           // View app state
console.log(Storage.loadFavourites()); // Check saved favourites
API.getTrending().then(d => console.log(d)); // Test API
Filters.bySearch(State.allMovies, "Batman"); // Test search
```

---

## 📚 Learning Resources

**JavaScript Concepts Demonstrated:**
- ES6+ (arrow functions, destructuring, spread operator, const/let)
- Async/await & Promises
- Higher-Order Functions (map, filter, sort)
- Event delegation & bubbling
- localStorage API
- Fetch API & HTTP status handling
- DOM manipulation & classList
- Set data structure

**CSS Concepts:**
- CSS Custom Properties (variables)
- CSS Grid & Flexbox
- CSS 3D Transforms
- Keyframe animations
- Media queries & responsive design
- Backdrop filters & blend modes
- Focus states & accessibility

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **API key error** | Check that API key is correctly pasted in `js/api.js` line 7 |
| **No movies showing** | Check browser console for network errors; verify API key is valid |
| **Favourites not saving** | Check localStorage is enabled; clear cache and retry |
| **Animations lagging** | Disable in DevTools performance tab or reduce motion settings |
| **Search not working** | Clear browser cache; check debounce timer in console |

---

## 🤝 Contributing

Found a bug or have a feature request? Feel free to:
1. Test the app and note any issues
2. Suggest improvements or new features
3. Optimize performance or accessibility
4. Add more filter options

---

## � License
MIT License — Free to use, modify, and distribute. See LICENSE file for details.

---

## 👨‍💻 Author
Built by MANAV GARG as a demonstration of professional front-end development practices.

---
