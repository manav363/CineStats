/* =============================================
   api.js — Talks to the TMDB movie database API
   GET YOUR FREE KEY: https://www.themoviedb.org/settings/api
   ============================================= */

// These are the building blocks for every URL we make
var MY_API_KEY = "37120ccb3e1b799352e129c79154a9e9";
var BASE_URL = "https://api.themoviedb.org/3";
var IMAGE_URL = "https://image.tmdb.org/t/p";

// ── Image URL helpers ─────────────────────────

// Takes a poster path like "/abc.jpg" and returns the full URL
function getPosterUrl(path, size) {
  // If no size is given, use w500 (a medium size)
  if (!size) {
    size = "w500";
  }
  // If there is no poster image, return null
  if (!path) {
    return null;
  }
  return IMAGE_URL + "/" + size + path;
}

// Same thing but for the big background (backdrop) images
function getBackdropUrl(path, size) {
  if (!size) {
    size = "w1280";
  }
  if (!path) {
    return null;
  }
  return IMAGE_URL + "/" + size + path;
}

// ── Main fetch function ───────────────────────

// This one function handles ALL network requests to TMDB
// It always adds our API key and language automatically
async function fetchFromTMDB(endpoint, extraParams) {
  // Build the full URL from the base + the specific endpoint
  var fullUrl = new URL(BASE_URL + endpoint);

  // Every request needs our API key and language
  fullUrl.searchParams.set("api_key", MY_API_KEY);
  fullUrl.searchParams.set("language", "en-US");

  // Add any extra options (like page number, query text, etc.)
  if (extraParams) {
    var paramKeys = Object.keys(extraParams);
    for (var i = 0; i < paramKeys.length; i++) {
      var key = paramKeys[i];
      var value = extraParams[key];
      // Skip empty values so we don't send blank parameters
      if (value !== "" && value !== null && value !== undefined) {
        fullUrl.searchParams.set(key, value);
      }
    }
  }

  // Actually make the network request (async/await)
  var response = await fetch(fullUrl.toString());

  // If something went wrong, throw a clear error message
  if (!response.ok) {
    var errorData = await response.json().catch(function () { return {}; });
    throw new Error(errorData.status_message || "Request failed: " + response.status);
  }

  // Everything is fine — return the JSON data
  var data = await response.json();
  return data;
}

// ── Specific API calls ────────────────────────

// Get trending movies this week
async function getTrending(pageNumber) {
  if (!pageNumber) {
    pageNumber = 1;
  }
  var data = await fetchFromTMDB("/trending/movie/week", { page: pageNumber });
  return data;
}

// Get movies with the highest ratings ever
async function getTopRated(pageNumber) {
  if (!pageNumber) {
    pageNumber = 1;
  }
  var data = await fetchFromTMDB("/movie/top_rated", { page: pageNumber });
  return data;
}

// Get movies coming out soon
async function getUpcoming(pageNumber) {
  if (!pageNumber) {
    pageNumber = 1;
  }
  var data = await fetchFromTMDB("/movie/upcoming", { page: pageNumber });
  return data;
}

// Search for movies by text (what the user typed)
async function searchMovies(searchText, pageNumber) {
  if (!pageNumber) {
    pageNumber = 1;
  }
  var data = await fetchFromTMDB("/search/movie", { query: searchText, page: pageNumber });
  return data;
}

// Get all the details about one specific movie (by its ID number)
async function getMovieDetails(movieId) {
  var data = await fetchFromTMDB("/movie/" + movieId);
  return data;
}

// Get the full list of all movie genres (Action, Comedy, etc.)
async function getGenres() {
  var data = await fetchFromTMDB("/genre/movie/list");
  return data;
}
