/* =============================================
   app.js — The main brain of the app.
   Wires all the other files together.
   ============================================= */

// ── App State ─────────────────────────────────
// These variables remember what the user is doing right now

var currentSection = "trending"; // which tab is active
var allMovies = [];         // the movies loaded from the API
var currentPage = 1;
var totalPages = 1;
var searchQuery = "";
var selectedGenre = "";
var minimumRating = "";
var selectedYear = "";
var sortOption = "default";
var savedFavourites = new Set();  // a Set of movie IDs the user has saved

// ── LocalStorage helpers ──────────────────────
// LocalStorage lets us remember the user's favourites even after they close the tab

var FAV_KEY = "cinestats_favourites";
var THEME_KEY = "cinestats_theme";

function loadFavouritesFromStorage() {
  try {
    var saved = localStorage.getItem(FAV_KEY);
    if (saved) {
      // JSON.parse turns the saved string back into an array, then we make it a Set
      return new Set(JSON.parse(saved));
    }
    return new Set();
  } catch (error) {
    // If anything goes wrong just start with an empty Set
    return new Set();
  }
}

function saveFavouritesToStorage() {
  try {
    // We can't store a Set directly, so we spread it into an array first
    localStorage.setItem(FAV_KEY, JSON.stringify([...savedFavourites]));
  } catch (error) {
    // Ignore errors (e.g. storage is full)
  }
}

function loadThemeFromStorage() {
  return localStorage.getItem(THEME_KEY) || "dark";
}

function saveThemeToStorage(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

// ── Start the app ─────────────────────────────

async function init() {
  // Apply the theme the user had last time
  var savedTheme = loadThemeFromStorage();
  document.documentElement.setAttribute("data-theme", savedTheme);
  var themeIconEl = document.querySelector(".theme-icon");
  if (themeIconEl) {
    themeIconEl.textContent = savedTheme === "dark" ? "☽" : "☀";
  }

  // Restore saved favourites
  savedFavourites = loadFavouritesFromStorage();

  // Load the genre list so we can populate the Genre dropdown
  try {
    var genreData = await getGenres();
    var genreList = genreData.genres || [];
    saveGenreMap(genreList);
    fillGenreDropdown(genreList);
  } catch (error) {
    console.warn("Could not load genres:", error.message);
  }

  // Load the first set of movies
  await loadMovies();

  // Set up all the click/change/input event listeners
  attachEventListeners();
}

// ── Load movies from the API ──────────────────

async function loadMovies() {
  showLoading();

  try {
    // The Favourites tab works differently from the other tabs
    if (currentSection === "favourites") {
      await showFavouriteMovies();
      return;
    }

    var data;

    if (searchQuery.trim() !== "") {
      // The user typed something in the search box — use the search endpoint
      data = await searchMovies(searchQuery, currentPage);
    } else {
      // Load movies based on which tab is active
      if (currentSection === "top_rated") {
        data = await getTopRated(currentPage);
      } else if (currentSection === "upcoming") {
        data = await getUpcoming(currentPage);
      } else {
        // "trending" is the default
        data = await getTrending(currentPage);
      }
    }

    // Save the raw movie list and page info
    allMovies = data.results || [];
    totalPages = data.total_pages || 1;

    // Update the Year dropdown based on what years are in the results
    var years = getUniqueYears(allMovies);
    fillYearDropdown(years);

    // Apply any active filters and draw the cards
    applyFiltersAndRender();

  } catch (error) {
    showError(error.message || "Failed to load movies.");
  } finally {
    // Always hide the loading spinner, even if something went wrong
    hideLoading();
  }
}

// ── Apply filters and draw the grid ──────────

function applyFiltersAndRender() {
  // When the user searched via the API, the results are already filtered by text
  // so we pass an empty string to avoid double-filtering
  var searchForFilter = searchQuery.trim() ? "" : searchQuery;

  // Run all the filters and get back the filtered+sorted list
  var filteredMovies = applyAllFilters(allMovies, {
    search: searchForFilter,
    genre: selectedGenre,
    minRating: minimumRating,
    year: selectedYear,
    sortBy: sortOption
  });

  updateResultsCount(filteredMovies.length);
  renderMovieGrid(filteredMovies, savedFavourites);
  updatePagination(currentPage, totalPages);
}

// ── Favourites tab logic ──────────────────────

async function showFavouriteMovies() {
  hideLoading();

  // If no favourites, show the grid with nothing in it
  if (savedFavourites.size === 0) {
    updateResultsCount(0);
    renderMovieGrid([], savedFavourites);
    return;
  }

  try {
    // Fetch the details for every saved movie ID
    // .map() turns each ID into a fetch Promise, then we wait for all of them
    var fetchRequests = [...savedFavourites].map(function (movieId) {
      return getMovieDetails(movieId);
    });
    var movieDetailsList = await Promise.all(fetchRequests);

    allMovies = movieDetailsList;

    // Run filters on the favourites too, so genre/year/etc. still work
    var filteredMovies = applyAllFilters(movieDetailsList, {
      search: searchQuery,
      genre: selectedGenre,
      minRating: minimumRating,
      year: selectedYear,
      sortBy: sortOption
    });

    updateResultsCount(filteredMovies.length);
    renderMovieGrid(filteredMovies, savedFavourites);
    updatePagination(1, 1);

  } catch (error) {
    showError("Could not load favourites.");
  }
}

// ── Add / Remove a favourite ──────────────────

function toggleFavourite(movieId) {
  var id = Number(movieId);

  if (savedFavourites.has(id)) {
    savedFavourites.delete(id);
    showToast("Removed from favourites", "red");
  } else {
    savedFavourites.add(id);
    showToast("Added to favourites ♥", "gold");
  }

  // Save the updated list to localStorage
  saveFavouritesToStorage();

  // If we're on the Favourites tab, reload the whole list
  if (currentSection === "favourites") {
    loadMovies();
    return;
  }

  // Otherwise, just update the heart button on visible cards
  var heartButtons = document.querySelectorAll('.fav-btn[data-id="' + id + '"]');
  heartButtons.forEach(function (btn) {
    var isNowFav = savedFavourites.has(id);
    btn.className = "fav-btn " + (isNowFav ? "active" : "");
    btn.textContent = isNowFav ? "♥" : "♡";
    btn.title = isNowFav ? "Remove from favourites" : "Add to favourites";
  });

  // Also update the button inside the detail modal if it's open
  var modalFavBtn = document.querySelector('.modal-fav-btn[data-id="' + id + '"]');
  if (modalFavBtn) {
    var isNowFav = savedFavourites.has(id);
    modalFavBtn.className = "modal-fav-btn " + (isNowFav ? "remove" : "");
    modalFavBtn.textContent = isNowFav ? "♥ Remove from Favourites" : "♡ Add to Favourites";
  }
}

// ── Search input with debounce ────────────────

// We wrap the search handler in a debounce so it waits for the user to
// stop typing before calling the API (avoids tons of rapid requests)
var handleSearchInput = makeDebounced(async function (typedText) {
  searchQuery = typedText;
  currentPage = 1;

  // Show or hide the X clear button
  var clearBtn = document.getElementById("searchClear");
  if (typedText.length > 0) {
    clearBtn.classList.add("visible");
  } else {
    clearBtn.classList.remove("visible");
  }

  await loadMovies();
}, 400);

// ── Attach all event listeners ────────────────

function attachEventListeners() {

  // ─ Nav tabs ─
  var allTabs = document.querySelectorAll(".nav-tab");
  allTabs.forEach(function (tab) {
    tab.addEventListener("click", async function () {

      // Deactivate every tab
      allTabs.forEach(function (t) {
        t.classList.remove("active");
        t.setAttribute("aria-pressed", "false");
      });

      // Activate the one that was clicked
      tab.classList.add("active");
      tab.setAttribute("aria-pressed", "true");

      currentSection = tab.dataset.section;
      currentPage = 1;
      await loadMovies();
    });
  });

  // ─ Search box ─
  document.getElementById("searchInput").addEventListener("input", function (event) {
    handleSearchInput(event.target.value);
  });

  // ─ Clear search button (the × icon) ─
  document.getElementById("searchClear").addEventListener("click", function () {
    document.getElementById("searchInput").value = "";
    handleSearchInput("");
  });

  // ─ Genre dropdown ─
  document.getElementById("genreFilter").addEventListener("change", function (event) {
    selectedGenre = event.target.value;
    currentPage = 1;
    applyFiltersAndRender();
  });

  // ─ Rating dropdown ─
  document.getElementById("ratingFilter").addEventListener("change", function (event) {
    minimumRating = event.target.value;
    currentPage = 1;
    applyFiltersAndRender();
  });

  // ─ Year dropdown ─
  document.getElementById("yearFilter").addEventListener("change", function (event) {
    selectedYear = event.target.value;
    currentPage = 1;
    applyFiltersAndRender();
  });

  // ─ Sort dropdown ─
  document.getElementById("sortSelect").addEventListener("change", function (event) {
    sortOption = event.target.value;
    applyFiltersAndRender();
  });

  // ─ Reset button ─
  document.getElementById("resetFilters").addEventListener("click", function () {
    // Reset all state variables
    searchQuery = "";
    selectedGenre = "";
    minimumRating = "";
    selectedYear = "";
    sortOption = "default";
    currentPage = 1;

    // Reset all the form elements to show their default values
    document.getElementById("searchInput").value = "";
    document.getElementById("genreFilter").value = "";
    document.getElementById("ratingFilter").value = "";
    document.getElementById("yearFilter").value = "";
    document.getElementById("sortSelect").value = "default";
    document.getElementById("searchClear").classList.remove("visible");

    loadMovies();
  });

  // ─ Pagination: previous page ─
  document.getElementById("prevPage").addEventListener("click", async function () {
    if (currentPage > 1) {
      currentPage--;
      await loadMovies();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // ─ Pagination: next page ─
  document.getElementById("nextPage").addEventListener("click", async function () {
    if (currentPage < totalPages) {
      currentPage++;
      await loadMovies();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // ─ Movie grid clicks (using event delegation) ─
  // Instead of attaching a listener to every card, we attach one to the grid
  // and check what was actually clicked
  document.getElementById("movieGrid").addEventListener("click", function (event) {

    // Check if the heart button was clicked
    var favButton = event.target.closest(".fav-btn");
    if (favButton) {
      event.stopPropagation(); // don't let it also trigger the card click
      toggleFavourite(favButton.dataset.id);
      return;
    }

    // Check if the card itself was clicked
    var movieCard = event.target.closest(".movie-card");
    if (movieCard) {
      openMovieModal(movieCard.dataset.id, savedFavourites);
    }
  });

  // ─ Close modal button ─
  document.getElementById("modalClose").addEventListener("click", function () {
    closeMovieModal();
  });

  // ─ Click on the dark backdrop to close modal ─
  document.getElementById("modalBackdrop").addEventListener("click", function (event) {
    if (event.target === document.getElementById("modalBackdrop")) {
      closeMovieModal();
    }
  });

  // ─ Favourite button inside the modal ─
  document.getElementById("movieModal").addEventListener("click", function (event) {
    var favBtn = event.target.closest(".modal-fav-btn");
    if (favBtn) {
      toggleFavourite(favBtn.dataset.id);
    }
  });

  // ─ Press Escape key to close the modal ─
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closeMovieModal();
    }
  });

  // ─ Basic focus trap: keep Tab key inside the modal ─
  var modalEl = document.getElementById("movieModal");
  document.addEventListener("keydown", function (event) {
    var isOpen = !document.getElementById("modalBackdrop").classList.contains("hidden");
    if (!isOpen || event.key !== "Tab") return;

    var focusable = Array.from(modalEl.querySelectorAll("button, [href], input, select, textarea"));
    var firstEl = focusable[0];
    var lastEl = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === firstEl) {
      event.preventDefault();
      lastEl.focus();
    } else if (!event.shiftKey && document.activeElement === lastEl) {
      event.preventDefault();
      firstEl.focus();
    }
  });

  // ─ Retry button on the error screen ─
  document.getElementById("retryBtn").addEventListener("click", loadMovies);

  // ─ Theme toggle button ─
  document.getElementById("themeToggle").addEventListener("click", function () {
    var currentTheme = document.documentElement.getAttribute("data-theme");
    var newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    document.querySelector(".theme-icon").textContent = newTheme === "dark" ? "☽" : "☀";
    saveThemeToStorage(newTheme);
  });
}

// ── Run init when the page is ready ──────────
document.addEventListener("DOMContentLoaded", init);
