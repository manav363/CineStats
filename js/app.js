/* =============================================
   app.js — Main entry point. Wires events and
   manages the app state.
   ============================================= */

// ── App State ────────────────────────────────────
// All the data the app needs to remember
const State = {
  section:     "trending",  // which tab is active
  allMovies:   [],          // movies loaded from the API
  currentPage: 1,
  totalPages:  1,
  searchQuery: "",
  genre:       "",
  minRating:   "",
  year:        "",
  sortBy:      "default",
  favourites:  new Set()    // movie IDs the user saved
};

// ── LocalStorage helpers ─────────────────────────
const Storage = {

  FAV_KEY:   "cinestats_favourites",
  THEME_KEY: "cinestats_theme",

  loadFavourites() {
    try {
      const saved = localStorage.getItem(this.FAV_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  },

  saveFavourites(favSet) {
    try {
      localStorage.setItem(this.FAV_KEY, JSON.stringify([...favSet]));
    } catch {
      // Ignore if storage is full
    }
  },

  loadTheme() {
    return localStorage.getItem(this.THEME_KEY) || "dark";
  },

  saveTheme(theme) {
    localStorage.setItem(this.THEME_KEY, theme);
  }
};

// ── App Initialisation ───────────────────────────
async function init() {

  // Apply saved theme
  const savedTheme = Storage.loadTheme();
  document.documentElement.setAttribute("data-theme", savedTheme);
  const themeIcon = document.querySelector(".theme-icon");
  if (themeIcon) {
    themeIcon.textContent = savedTheme === "dark" ? "☽" : "☀";
  }

  // Restore saved favourites
  State.favourites = Storage.loadFavourites();

  // Load genre list and populate the filter dropdown
  try {
    const genreData = await API.getGenres();
    UI.setGenreMap(genreData.genres || []);
    UI.populateGenreFilter(genreData.genres || []);
  } catch (error) {
    console.warn("Could not load genres:", error.message);
  }

  // Load the first batch of movies
  await loadMovies();

  // Attach all event listeners
  bindEvents();
}

// ── Load Movies ──────────────────────────────────
async function loadMovies() {
  UI.showLoading();

  try {

    // Favourites tab is handled differently
    if (State.section === "favourites") {
      await renderFavourites();
      return;
    }

    let data;

    if (State.searchQuery.trim() !== "") {
      // User is searching
      data = await API.searchMovies(State.searchQuery, State.currentPage);
    } else {
      // Load based on the active nav tab
      if (State.section === "top_rated") {
        data = await API.getTopRated(State.currentPage);
      } else if (State.section === "upcoming") {
        data = await API.getUpcoming(State.currentPage);
      } else {
        data = await API.getTrending(State.currentPage);
      }
    }

    State.allMovies  = data.results || [];
    State.totalPages = data.total_pages || 1;

    // Update year dropdown from the current results
    const years = Filters.extractYears(State.allMovies);
    UI.populateYearFilter(years);

    renderFiltered();

  } catch (error) {
    UI.showError(error.message || "Failed to load movies.");
  } finally {
    UI.hideLoading();
  }
}

// ── Apply Filters & Render ───────────────────────
function renderFiltered() {
  // When the user searched via the API, skip re-filtering by search
  // to avoid filtering an already-filtered result set
  const searchForFilter = State.searchQuery.trim() ? "" : State.searchQuery;

  const filtered = Filters.applyAll(State.allMovies, {
    search:    searchForFilter,
    genre:     State.genre,
    minRating: State.minRating,
    year:      State.year,
    sortBy:    State.sortBy
  });

  UI.updateCount(filtered.length);
  UI.renderGrid(filtered, State.favourites);
  UI.updatePagination(State.currentPage, State.totalPages);
}

// ── Render Favourites Tab ────────────────────────
async function renderFavourites() {
  UI.hideLoading();

  if (State.favourites.size === 0) {
    UI.updateCount(0);
    UI.renderGrid([], State.favourites);
    return;
  }

  try {
    // Fetch details for each saved movie
    const requests = [...State.favourites].map(id => API.getMovieDetails(id));
    const movies   = await Promise.all(requests);
    State.allMovies = movies;

    const filtered = Filters.applyAll(movies, {
      search:    State.searchQuery,
      genre:     State.genre,
      minRating: State.minRating,
      year:      State.year,
      sortBy:    State.sortBy
    });

    UI.updateCount(filtered.length);
    UI.renderGrid(filtered, State.favourites);
    UI.updatePagination(1, 1);

  } catch (error) {
    UI.showError("Could not load favourites.");
  }
}

// ── Toggle Favourite ─────────────────────────────
function toggleFavourite(movieId) {
  const id = Number(movieId);

  if (State.favourites.has(id)) {
    State.favourites.delete(id);
    UI.showToast("Removed from favourites", "red");
  } else {
    State.favourites.add(id);
    UI.showToast("Added to favourites ♥", "gold");
  }

  Storage.saveFavourites(State.favourites);

  // If we're on the favourites tab, reload the list
  if (State.section === "favourites") {
    loadMovies();
    return;
  }

  // Otherwise just update the heart button on any visible cards
  document.querySelectorAll('.fav-btn[data-id="' + id + '"]').forEach(function(btn) {
    const isFav = State.favourites.has(id);
    btn.className = "fav-btn " + (isFav ? "active" : "");
    btn.textContent = isFav ? "♥" : "♡";
    btn.title = isFav ? "Remove from favourites" : "Add to favourites";
  });

  // Also update the button inside the modal if it's open
  const modalFavBtn = document.querySelector('.modal-fav-btn[data-id="' + id + '"]');
  if (modalFavBtn) {
    const isFav = State.favourites.has(id);
    modalFavBtn.className = "modal-fav-btn " + (isFav ? "remove" : "");
    modalFavBtn.textContent = isFav ? "♥ Remove from Favourites" : "♡ Add to Favourites";
  }
}

// ── Debounced Search Handler ─────────────────────
const debouncedSearch = Filters.debounce(async function(query) {
  State.searchQuery = query;
  State.currentPage = 1;

  // Show/hide the X clear button
  const clearBtn = document.getElementById("searchClear");
  if (query.length > 0) {
    clearBtn.classList.add("visible");
  } else {
    clearBtn.classList.remove("visible");
  }

  await loadMovies();
}, 400);

// ── Event Listeners ──────────────────────────────
function bindEvents() {

  // Nav tabs
  document.querySelectorAll(".nav-tab").forEach(function(tab) {
    tab.addEventListener("click", async function() {
      // Deactivate all tabs
      document.querySelectorAll(".nav-tab").forEach(function(t) {
        t.classList.remove("active");
        t.setAttribute("aria-pressed", "false");
      });

      // Activate clicked tab
      tab.classList.add("active");
      tab.setAttribute("aria-pressed", "true");

      State.section     = tab.dataset.section;
      State.currentPage = 1;
      await loadMovies();
    });
  });

  // Search input
  document.getElementById("searchInput").addEventListener("input", function(e) {
    debouncedSearch(e.target.value);
  });

  // Clear search button
  document.getElementById("searchClear").addEventListener("click", function() {
    document.getElementById("searchInput").value = "";
    debouncedSearch("");
  });

  // Genre filter
  document.getElementById("genreFilter").addEventListener("change", function(e) {
    State.genre       = e.target.value;
    State.currentPage = 1;
    renderFiltered();
  });

  // Rating filter
  document.getElementById("ratingFilter").addEventListener("change", function(e) {
    State.minRating   = e.target.value;
    State.currentPage = 1;
    renderFiltered();
  });

  // Year filter
  document.getElementById("yearFilter").addEventListener("change", function(e) {
    State.year        = e.target.value;
    State.currentPage = 1;
    renderFiltered();
  });

  // Sort dropdown
  document.getElementById("sortSelect").addEventListener("change", function(e) {
    State.sortBy = e.target.value;
    renderFiltered();
  });

  // Reset all filters button
  document.getElementById("resetFilters").addEventListener("click", function() {
    State.searchQuery = "";
    State.genre       = "";
    State.minRating   = "";
    State.year        = "";
    State.sortBy      = "default";
    State.currentPage = 1;

    document.getElementById("searchInput").value  = "";
    document.getElementById("genreFilter").value  = "";
    document.getElementById("ratingFilter").value = "";
    document.getElementById("yearFilter").value   = "";
    document.getElementById("sortSelect").value   = "default";
    document.getElementById("searchClear").classList.remove("visible");

    loadMovies();
  });

  // Pagination — previous page
  document.getElementById("prevPage").addEventListener("click", async function() {
    if (State.currentPage > 1) {
      State.currentPage--;
      await loadMovies();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // Pagination — next page
  document.getElementById("nextPage").addEventListener("click", async function() {
    if (State.currentPage < State.totalPages) {
      State.currentPage++;
      await loadMovies();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // Movie grid — click delegation
  document.getElementById("movieGrid").addEventListener("click", function(e) {

    // If the heart button was clicked
    const favBtn = e.target.closest(".fav-btn");
    if (favBtn) {
      e.stopPropagation();
      toggleFavourite(favBtn.dataset.id);
      return;
    }

    // If the card itself was clicked
    const card = e.target.closest(".movie-card");
    if (card) {
      UI.showModal(card.dataset.id, State.favourites);
    }
  });

  // Close modal button
  document.getElementById("modalClose").addEventListener("click", function() {
    UI.closeModal();
  });

  // Click on the dark backdrop to close modal
  document.getElementById("modalBackdrop").addEventListener("click", function(e) {
    if (e.target === document.getElementById("modalBackdrop")) {
      UI.closeModal();
    }
  });

  // Favourite button inside the modal
  document.getElementById("movieModal").addEventListener("click", function(e) {
    const favBtn = e.target.closest(".modal-fav-btn");
    if (favBtn) {
      toggleFavourite(favBtn.dataset.id);
    }
  });

  // Press Escape to close modal
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      UI.closeModal();
    }
  });

  // Basic focus trap: keep Tab key inside the modal
  const modal = document.getElementById("movieModal");
  const focusableSelectors = "button, [href], input, select, textarea";

  document.addEventListener("keydown", function(e) {
    const isModalOpen = !document.getElementById("modalBackdrop").classList.contains("hidden");
    if (!isModalOpen || e.key !== "Tab") return;

    const focusable = Array.from(modal.querySelectorAll(focusableSelectors));
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Retry button on error screen
  document.getElementById("retryBtn").addEventListener("click", loadMovies);

  // Theme toggle button
  document.getElementById("themeToggle").addEventListener("click", function() {
    const current = document.documentElement.getAttribute("data-theme");
    const next    = current === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", next);
    document.querySelector(".theme-icon").textContent = next === "dark" ? "☽" : "☀";
    Storage.saveTheme(next);
  });
}

// ── Start the App ────────────────────────────────
document.addEventListener("DOMContentLoaded", init);