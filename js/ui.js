/* =============================================
   ui.js — Everything that touches the HTML page
   (showing/hiding elements, building cards, etc.)
   ============================================= */

// ── Grab all the page elements we'll need ─────
var movieGrid = document.getElementById("movieGrid");
var loadingOverlay = document.getElementById("loadingOverlay");
var errorSection = document.getElementById("errorState");
var errorMessage = document.getElementById("errorMsg");
var emptySection = document.getElementById("emptyState");
var resultsLabel = document.getElementById("resultsCount");
var paginationBar = document.getElementById("pagination");
var prevButton = document.getElementById("prevPage");
var nextButton = document.getElementById("nextPage");
var pageLabel = document.getElementById("pageInfo");
var modalBackdrop = document.getElementById("modalBackdrop");
var modalBody = document.getElementById("modalInner");
var toastBox = document.getElementById("toast");
var genreDropdown = document.getElementById("genreFilter");
var yearDropdown = document.getElementById("yearFilter");

// This object maps genre ID numbers to their name strings
// e.g. { 28: "Action", 35: "Comedy" }
var genreMap = {};

// ── Loading / Error / Empty helpers ───────────

function showLoading() {
  // Show the spinner and hide everything else
  loadingOverlay.classList.remove("hidden");
  errorSection.classList.add("hidden");
  emptySection.classList.add("hidden");
  movieGrid.innerHTML = "";
  paginationBar.style.visibility = "hidden";
}

function hideLoading() {
  loadingOverlay.classList.add("hidden");
}

function showError(message) {
  if (!message) {
    message = "Could not load movies. Please try again.";
  }
  hideLoading();
  errorMessage.textContent = message;
  errorSection.classList.remove("hidden");
  paginationBar.style.visibility = "hidden";
}

function showEmpty() {
  emptySection.classList.remove("hidden");
  paginationBar.style.visibility = "hidden";
}

function hideEmpty() {
  emptySection.classList.add("hidden");
}

// ── Genre dropdown helpers ─────────────────────

// Store all genres in the map so we can look them up by ID later
function saveGenreMap(genreList) {
  // Reset the map first
  genreMap = {};
  // Loop through each genre and store it
  genreList.forEach(function (genre) {
    genreMap[genre.id] = genre.name;
  });
}

// Given a genre ID number, return the name (e.g. 28 → "Action")
function getGenreName(genreId) {
  return genreMap[genreId] || "";
}

// Fill the genre <select> dropdown with all available genres
function fillGenreDropdown(genreList) {
  genreDropdown.innerHTML = '<option value="">All Genres</option>';

  // Sort alphabetically before adding — .slice() so we don't change the original
  var sorted = genreList.slice().sort(function (a, b) {
    return a.name.localeCompare(b.name);
  });

  // .map() builds an array of <option> elements, then we append each one
  var optionElements = sorted.map(function (genre) {
    var option = document.createElement("option");
    option.value = genre.id;
    option.textContent = genre.name;
    return option;
  });

  optionElements.forEach(function (option) {
    genreDropdown.appendChild(option);
  });
}

// Fill the year <select> dropdown
function fillYearDropdown(yearList) {
  yearDropdown.innerHTML = '<option value="">Any Year</option>';

  var optionElements = yearList.map(function (year) {
    var option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    return option;
  });

  optionElements.forEach(function (option) {
    yearDropdown.appendChild(option);
  });
}

// ── Results count label ───────────────────────

function updateResultsCount(count) {
  if (count === 0) {
    resultsLabel.textContent = "No results";
  } else if (count === 1) {
    resultsLabel.textContent = "1 film found";
  } else {
    resultsLabel.textContent = count + " films found";
  }
}

// ── Movie grid ────────────────────────────────

// Draws all the movie cards on screen
function renderMovieGrid(movieList, savedFavouriteIds) {
  if (!savedFavouriteIds) {
    savedFavouriteIds = new Set();
  }

  // Clear whatever was there before
  movieGrid.innerHTML = "";
  hideEmpty();

  // If there's nothing to show, display the empty state message
  if (!movieList || movieList.length === 0) {
    showEmpty();
    return;
  }

  // .map() turns each movie object into an HTML card element
  var cardElements = movieList.map(function (movie, index) {
    // Skip any broken/empty movie objects
    if (!movie || !movie.id) {
      return null;
    }
    var isFav = savedFavouriteIds.has(movie.id);
    return buildMovieCard(movie, isFav, index);
  });

  // .filter() removes any nulls from the list
  var validCards = cardElements.filter(function (card) {
    return card !== null;
  });

  // Now add each card to the page
  validCards.forEach(function (card) {
    movieGrid.appendChild(card);
  });
}

// Builds one movie card element and returns it
function buildMovieCard(movie, isFav, cardIndex) {
  if (!isFav) isFav = false;
  if (!cardIndex) cardIndex = 0;

  var card = document.createElement("article");
  card.className = "movie-card";
  // Stagger the animation so cards appear one after another
  card.style.animationDelay = Math.min(cardIndex * 40, 400) + "ms";
  card.dataset.id = movie.id;

  var posterUrl = getPosterUrl(movie.poster_path, "w342");
  // Grab just the year from the date string "2023-07-15" → "2023"
  var releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : "—";
  // Format the rating to 1 decimal place
  var rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";

  // Get the first genre name for this movie
  var firstGenreId = movie.genre_ids && movie.genre_ids[0];
  var genreName = firstGenreId ? getGenreName(firstGenreId) : "";

  // Build the poster image (or a placeholder if there's no poster)
  var posterHTML;
  if (posterUrl) {
    posterHTML = '<img src="' + posterUrl + '" alt="' + escapeHtml(movie.title) + '" loading="lazy" />';
  } else {
    posterHTML = '<div class="poster-placeholder">🎬</div>';
  }

  // Build the genre badge (only if we have a genre)
  var genreHTML = "";
  if (genreName) {
    genreHTML = '<span class="card-genre">' + genreName + '</span>';
  }

  // Put together the full card HTML
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
      <h3 class="card-title" title="${escapeHtml(movie.title)}">${escapeHtml(movie.title)}</h3>
      <div class="card-meta">
        <span class="card-year">${releaseYear}</span>
        ${genreHTML}
      </div>
    </div>
  `;

  return card;
}

// ── Pagination controls ───────────────────────

function updatePagination(currentPage, totalPages) {
  // Hide pagination if there's only one page
  if (totalPages <= 1) {
    paginationBar.style.visibility = "hidden";
    return;
  }

  paginationBar.style.visibility = "visible";
  prevButton.disabled = (currentPage <= 1);
  nextButton.disabled = (currentPage >= totalPages);

  // TMDB caps at 500 pages
  var displayTotal = Math.min(totalPages, 500);
  pageLabel.textContent = currentPage + " / " + displayTotal;
}

// ── Movie detail modal ────────────────────────

// Opens the modal and loads the movie's full details
async function openMovieModal(movieId, savedFavouriteIds) {
  // Show the modal backdrop
  modalBackdrop.classList.remove("hidden");
  // Prevent the page behind from scrolling
  document.body.style.overflow = "hidden";

  // Show a mini loading spinner while we fetch the data
  modalBody.innerHTML = `
    <div style="text-align:center; padding:80px 0;">
      <div class="reel" style="width:40px; height:40px; margin:0 auto 12px;"></div>
      <p style="color:var(--text-3); font-size:13px; letter-spacing:2px;">Loading…</p>
    </div>
  `;

  // Fetch the full movie details from the API
  try {
    var movieDetails = await getMovieDetails(movieId);
    renderModalContent(movieDetails, savedFavouriteIds);
  } catch (error) {
    // Show an error inside the modal if something went wrong
    modalBody.innerHTML = `
      <div style="text-align:center; padding:60px 24px;">
        <div style="font-size:40px; margin-bottom:12px;">⚠</div>
        <p style="color:var(--text-2);">Could not load details.</p>
      </div>
    `;
  }
}

// Builds and inserts the full movie detail HTML into the modal
function renderModalContent(movie, savedFavouriteIds) {
  var backdropUrl = getBackdropUrl(movie.backdrop_path);
  var posterUrl = getPosterUrl(movie.poster_path, "w342");
  var releaseYear = movie.release_date ? movie.release_date.slice(0, 4) : "—";
  var rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
  var isFav = savedFavouriteIds.has(movie.id);

  // Build genre tags using .map() on the genres array
  var genreTagsHTML = "";
  if (movie.genres && movie.genres.length > 0) {
    var genreTags = movie.genres.map(function (genre) {
      return '<span class="genre-tag">' + genre.name + '</span>';
    });
    genreTagsHTML = genreTags.join("");
  }

  // Backdrop image (or placeholder)
  var backdropHTML;
  if (backdropUrl) {
    backdropHTML = '<img class="modal-backdrop-img" src="' + backdropUrl + '" alt="" />';
  } else {
    backdropHTML = '<div class="modal-backdrop-placeholder">🎬</div>';
  }

  // Poster image (or placeholder)
  var posterHTML;
  if (posterUrl) {
    posterHTML = '<img class="modal-poster" src="' + posterUrl + '" alt="' + escapeHtml(movie.title) + '" />';
  } else {
    posterHTML = '<div class="modal-poster-placeholder">🎬</div>';
  }

  // Runtime chip — only show if we have runtime info
  var runtimeHTML = "";
  if (movie.runtime) {
    runtimeHTML = '<span class="stat-chip">⏱ ' + movie.runtime + ' min</span>';
  }

  // Votes chip — only show if we have vote count
  var votesHTML = "";
  if (movie.vote_count) {
    votesHTML = '<span class="stat-chip">👥 ' + movie.vote_count.toLocaleString() + ' votes</span>';
  }

  // Tagline — only show if the movie has one
  var taglineHTML = "";
  if (movie.tagline) {
    taglineHTML = '<p class="modal-tagline">' + escapeHtml(movie.tagline) + '</p>';
  }

  // Overview paragraph — only show if there is one
  var overviewHTML = "";
  if (movie.overview) {
    overviewHTML = `
      <div class="modal-overview">
        <h4>Overview</h4>
        <p>${escapeHtml(movie.overview)}</p>
      </div>
    `;
  }

  // Favourite button label changes depending on whether it's saved
  var favButtonClass = isFav ? "modal-fav-btn remove" : "modal-fav-btn";
  var favButtonText = isFav ? "♥ Remove from Favourites" : "♡ Add to Favourites";

  // Put it all together inside the modal
  modalBody.innerHTML = `
    ${backdropHTML}
    <div class="modal-body">
      ${posterHTML}
      <div class="modal-info">
        <h2 class="modal-title" id="movieModalTitle">${escapeHtml(movie.title)}</h2>
        ${taglineHTML}
        <div class="modal-stats">
          <span class="stat-chip gold">★ ${rating}</span>
          <span class="stat-chip">📅 ${releaseYear}</span>
          ${runtimeHTML}
          ${votesHTML}
        </div>
        <div class="modal-genres">${genreTagsHTML}</div>
      </div>
    </div>
    ${overviewHTML}
    <button class="${favButtonClass}" data-id="${movie.id}">
      ${favButtonText}
    </button>
  `;
}

// Closes the modal
function closeMovieModal() {
  modalBackdrop.classList.add("hidden");
  document.body.style.overflow = "";
}

// ── Toast notification ────────────────────────

var toastTimer = null;

// Shows a small popup message at the bottom of the screen
function showToast(message, colorType) {
  if (!colorType) colorType = "";

  // Cancel any toast that's currently showing
  clearTimeout(toastTimer);

  toastBox.textContent = message;
  toastBox.className = "toast show " + colorType;

  // Automatically hide after 2.8 seconds
  toastTimer = setTimeout(function () {
    toastBox.classList.remove("show");
  }, 2800);
}

// ── Utility ───────────────────────────────────

// Converts special characters to safe HTML so users can't inject code
// e.g. "<script>" becomes "&lt;script&gt;"
function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
