/* =============================================
   api.js — Handles all TMDB API calls
   GET YOUR FREE KEY: https://www.themoviedb.org/settings/api
   ============================================= */

const API_KEY  = "37120ccb3e1b799352e129c79154a9e9";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

const API = {

  // Returns a full image URL for a poster
  posterUrl(path, size) {
    size = size || "w500";
    if (!path) return null;
    return IMG_BASE + "/" + size + path;
  },

  // Returns a full image URL for a backdrop
  backdropUrl(path, size) {
    size = size || "w1280";
    if (!path) return null;
    return IMG_BASE + "/" + size + path;
  },

  // Shared fetch function used by all endpoints
  async get(endpoint, params) {
    params = params || {};

    const url = new URL(BASE_URL + endpoint);
    url.searchParams.set("api_key", API_KEY);
    url.searchParams.set("language", "en-US");

    // Add any extra params passed in
    for (const key in params) {
      if (params[key] !== "" && params[key] !== null && params[key] !== undefined) {
        url.searchParams.set(key, params[key]);
      }
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.status_message || "Request failed: " + response.status);
    }

    return response.json();
  },

  // Get trending movies (this week)
  async getTrending(page) {
    page = page || 1;
    return this.get("/trending/movie/week", { page: page });
  },

  // Get top rated movies
  async getTopRated(page) {
    page = page || 1;
    return this.get("/movie/top_rated", { page: page });
  },

  // Get upcoming movies
  async getUpcoming(page) {
    page = page || 1;
    return this.get("/movie/upcoming", { page: page });
  },

  // Search movies by a text query
  async searchMovies(query, page) {
    page = page || 1;
    return this.get("/search/movie", { query: query, page: page });
  },

  // Get full details for a single movie
  async getMovieDetails(id) {
    return this.get("/movie/" + id);
  },

  // Get the list of all genres
  async getGenres() {
    return this.get("/genre/movie/list");
  }

};