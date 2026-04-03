/* =============================================
   ui.js — DOM rendering and UI helper functions
   ============================================= */

const UI = {

  // Grab all the elements we'll need
  grid:          document.getElementById("movieGrid"),
  loadingOverlay: document.getElementById("loadingOverlay"),
  errorState:    document.getElementById("errorState"),
  errorMsg:      document.getElementById("errorMsg"),
  emptyState:    document.getElementById("emptyState"),
  resultsCount:  document.getElementById("resultsCount"),
  pagination:    document.getElementById("pagination"),
  prevBtn:       document.getElementById("prevPage"),
  nextBtn:       document.getElementById("nextPage"),
  pageInfo:      document.getElementById("pageInfo"),
  modalBackdrop: document.getElementById("modalBackdrop"),
  modalInner:    document.getElementById("modalInner"),
  toast:         document.getElementById("toast"),
  genreFilter:   document.getElementById("genreFilter"),
  yearFilter:    document.getElementById("yearFilter"),

  // Stores genre id -> name, e.g. { 28: "Action" }
  genreMap: {},

  // ── Loading / Error / Empty ──────────────────────

  showLoading() {
    this.loadingOverlay.classList.remove("hidden");
    this.errorState.classList.add("hidden");
    this.emptyState.classList.add("hidden");
    this.grid.innerHTML = "";
    this.pagination.style.visibility = "hidden";
  },

  hideLoading() {
    this.loadingOverlay.classList.add("hidden");
  },

  showError(message) {
    message = message || "Could not load movies. Please try again.";
    this.hideLoading();
    this.errorMsg.textContent = message;
    this.errorState.classList.remove("hidden");
    this.pagination.style.visibility = "hidden";
  },

  showEmpty() {
    this.emptyState.classList.remove("hidden");
    this.pagination.style.visibility = "hidden";
  },

  hideEmpty() {
    this.emptyState.classList.add("hidden");
  },

  // ── Genre helpers ────────────────────────────────

  setGenreMap(genres) {
    this.genreMap = {};
    genres.forEach(function(g) {
      UI.genreMap[g.id] = g.name;
    });
  },

  genreName(id) {
    return this.genreMap[id] || "";
  },

  populateGenreFilter(genres) {
    this.genreFilter.innerHTML = '<option value="">All Genres</option>';

    // Sort alphabetically before adding
    const sorted = genres.slice().sort((a, b) => a.name.localeCompare(b.name));

    sorted.forEach(function(g) {
      const option = document.createElement("option");
      option.value = g.id;
      option.textContent = g.name;
      UI.genreFilter.appendChild(option);
    });
  },

  populateYearFilter(years) {
    this.yearFilter.innerHTML = '<option value="">Any Year</option>';

    years.forEach(function(year) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      UI.yearFilter.appendChild(option);
    });
  },

  // ── Results count ────────────────────────────────

  updateCount(count) {
    if (count === 0) {
      this.resultsCount.textContent = "No results";
    } else {
      this.resultsCount.textContent = count + " film" + (count !== 1 ? "s" : "") + " found";
    }
  },

  // ── Movie grid ───────────────────────────────────

  renderGrid(movies, favIds) {
    favIds = favIds || new Set();
    this.grid.innerHTML = "";
    this.hideEmpty();

    if (!movies || movies.length === 0) {
      this.showEmpty();
      return;
    }

    movies.forEach(function(movie, index) {
      if (movie && movie.id) {
        const card = UI.createCard(movie, favIds.has(movie.id), index);
        UI.grid.appendChild(card);
      }
    });
  },

  createCard(movie, isFav, index) {
    isFav = isFav || false;
    index = index || 0;

    const card = document.createElement("article");
    card.className = "movie-card";
    card.style.animationDelay = (Math.min(index * 40, 400)) + "ms";
    card.dataset.id = movie.id;

    const posterUrl = API.posterUrl(movie.poster_path, "w342");
    const year      = movie.release_date ? movie.release_date.slice(0, 4) : "—";
    const rating    = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

    // Get the first genre name
    const firstGenreId = movie.genre_ids && movie.genre_ids[0];
    const genre = firstGenreId ? this.genreName(firstGenreId) : "";

    // Build poster HTML
    let posterHTML;
    if (posterUrl) {
      posterHTML = '<img src="' + posterUrl + '" alt="' + this.escape(movie.title) + '" loading="lazy" />';
    } else {
      posterHTML = '<div class="poster-placeholder">🎬</div>';
    }

    // Build genre tag HTML
    const genreHTML = genre ? '<span class="card-genre">' + genre + '</span>' : "";

    card.innerHTML = `
      <div class="card-poster">
        ${posterHTML}
        <div class="rating-badge">${rating}</div>
        <button class="fav-btn ${isFav ? "active" : ""}" data-id="${movie.id}"
          title="${isFav ? "Remove from favourites" : "Add to favourites"}">
          ${isFav ? "♥" : "♡"}
        </button>
        <div class="card-overlay">
          <span class="overlay-more">View Details</span>
        </div>
      </div>
      <div class="card-body">
        <h3 class="card-title" title="${this.escape(movie.title)}">${this.escape(movie.title)}</h3>
        <div class="card-meta">
          <span class="card-year">${year}</span>
          ${genreHTML}
        </div>
      </div>
    `;

    return card;
  },

  // ── Pagination ───────────────────────────────────

  updatePagination(currentPage, totalPages) {
    if (totalPages <= 1) {
      this.pagination.style.visibility = "hidden";
      return;
    }

    this.pagination.style.visibility = "visible";
    this.prevBtn.disabled = (currentPage <= 1);
    this.nextBtn.disabled = (currentPage >= totalPages);

    const displayTotal = Math.min(totalPages, 500);
    this.pageInfo.textContent = currentPage + " / " + displayTotal;
  },

  // ── Modal ────────────────────────────────────────

  async showModal(movieId, favIds) {
    this.modalBackdrop.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    // Show a loading spinner inside the modal
    this.modalInner.innerHTML = `
      <div style="text-align:center; padding:80px 0;">
        <div class="reel" style="width:40px; height:40px; margin:0 auto 12px;"></div>
        <p style="color:var(--text-3); font-size:13px; letter-spacing:2px;">Loading…</p>
      </div>
    `;

    try {
      const movie = await API.getMovieDetails(movieId);
      this.renderModal(movie, favIds);
    } catch (error) {
      this.modalInner.innerHTML = `
        <div style="text-align:center; padding:60px 24px;">
          <div style="font-size:40px; margin-bottom:12px;">⚠</div>
          <p style="color:var(--text-2);">Could not load details.</p>
        </div>
      `;
    }
  },

  renderModal(movie, favIds) {
    const backdropUrl = API.backdropUrl(movie.backdrop_path);
    const posterUrl   = API.posterUrl(movie.poster_path, "w342");
    const year        = movie.release_date ? movie.release_date.slice(0, 4) : "—";
    const rating      = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
    const runtime     = movie.runtime ? movie.runtime + " min" : null;
    const isFav       = favIds.has(movie.id);

    // Build genres HTML
    let genresHTML = "";
    if (movie.genres && movie.genres.length > 0) {
      genresHTML = movie.genres.map(function(g) {
        return '<span class="genre-tag">' + g.name + '</span>';
      }).join("");
    }

    // Build backdrop/poster HTML
    const backdropHTML = backdropUrl
      ? '<img class="modal-backdrop-img" src="' + backdropUrl + '" alt="" />'
      : '<div class="modal-backdrop-placeholder">🎬</div>';

    const posterHTML = posterUrl
      ? '<img class="modal-poster" src="' + posterUrl + '" alt="' + this.escape(movie.title) + '" />'
      : '<div class="modal-poster-placeholder">🎬</div>';

    // Runtime chip (only if we have it)
    const runtimeHTML = runtime ? '<span class="stat-chip">⏱ ' + runtime + '</span>' : "";

    // Vote count chip (only if we have it)
    const votesHTML = movie.vote_count
      ? '<span class="stat-chip">👥 ' + movie.vote_count.toLocaleString() + ' votes</span>'
      : "";

    // Tagline (only if we have it)
    const taglineHTML = movie.tagline
      ? '<p class="modal-tagline">' + this.escape(movie.tagline) + '</p>'
      : "";

    // Overview (only if we have it)
    const overviewHTML = movie.overview
      ? `<div class="modal-overview">
           <h4>Overview</h4>
           <p>${this.escape(movie.overview)}</p>
         </div>`
      : "";

    const favBtnClass  = isFav ? "modal-fav-btn remove" : "modal-fav-btn";
    const favBtnText   = isFav ? "♥ Remove from Favourites" : "♡ Add to Favourites";

    this.modalInner.innerHTML = `
      ${backdropHTML}
      <div class="modal-body">
        ${posterHTML}
        <div class="modal-info">
          <h2 class="modal-title" id="movieModalTitle">${this.escape(movie.title)}</h2>
          ${taglineHTML}
          <div class="modal-stats">
            <span class="stat-chip gold">★ ${rating}</span>
            <span class="stat-chip">📅 ${year}</span>
            ${runtimeHTML}
            ${votesHTML}
          </div>
          <div class="modal-genres">${genresHTML}</div>
        </div>
      </div>
      ${overviewHTML}
      <button class="${favBtnClass}" data-id="${movie.id}">
        ${favBtnText}
      </button>
    `;
  },

  closeModal() {
    this.modalBackdrop.classList.add("hidden");
    document.body.style.overflow = "";
  },

  // ── Toast notification ───────────────────────────

  toastTimer: null,

  showToast(message, type) {
    type = type || "";
    clearTimeout(this.toastTimer);
    this.toast.textContent = message;
    this.toast.className = "toast show " + type;

    this.toastTimer = setTimeout(() => {
      this.toast.classList.remove("show");
    }, 2800);
  },

  // ── Utility ──────────────────────────────────────

  // Escape special HTML characters to prevent XSS
  escape(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

};