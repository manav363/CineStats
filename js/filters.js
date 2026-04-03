/* =============================================
   filters.js — Search, filter, and sort logic
   Uses array methods: filter, map, sort
   ============================================= */

const Filters = {

  // Filter movies by title text search
  bySearch(movies, query) {
    if (!query || query.trim() === "") return movies;
    const searchTerm = query.trim().toLowerCase();
    return movies.filter(function(movie) {
      return movie.title.toLowerCase().includes(searchTerm);
    });
  },

  // Filter movies by a genre ID
  byGenre(movies, genreId) {
    if (!genreId) return movies;
    const id = Number(genreId);
    return movies.filter(function(movie) {
      return movie.genre_ids && movie.genre_ids.includes(id);
    });
  },

  // Filter movies by minimum rating
  byMinRating(movies, minRating) {
    if (!minRating) return movies;
    const min = parseFloat(minRating);
    return movies.filter(function(movie) {
      return movie.vote_average >= min;
    });
  },

  // Filter movies by release year
  byYear(movies, year) {
    if (!year) return movies;
    return movies.filter(function(movie) {
      const movieYear = movie.release_date ? movie.release_date.slice(0, 4) : "";
      return movieYear === String(year);
    });
  },

  // Sort movies by the selected option
  sort(movies, sortBy) {
    // Make a copy so we don't change the original array
    const copy = [...movies];

    if (sortBy === "rating_desc") {
      return copy.sort((a, b) => b.vote_average - a.vote_average);
    }
    if (sortBy === "rating_asc") {
      return copy.sort((a, b) => a.vote_average - b.vote_average);
    }
    if (sortBy === "title_asc") {
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    }
    if (sortBy === "title_desc") {
      return copy.sort((a, b) => b.title.localeCompare(a.title));
    }
    if (sortBy === "date_desc") {
      return copy.sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0));
    }
    if (sortBy === "date_asc") {
      return copy.sort((a, b) => new Date(a.release_date || 0) - new Date(b.release_date || 0));
    }

    return copy; // "default" — no sorting
  },

  // Run all filters + sort at once
  applyAll(movies, options) {
    let result = movies;
    result = this.bySearch(result, options.search);
    result = this.byGenre(result, options.genre);
    result = this.byMinRating(result, options.minRating);
    result = this.byYear(result, options.year);
    result = this.sort(result, options.sortBy);
    return result;
  },

  // Get a unique sorted list of years from movies
  extractYears(movies) {
    const years = movies
      .map(function(movie) {
        return movie.release_date ? movie.release_date.slice(0, 4) : null;
      })
      .filter(function(year) {
        return year && year.length === 4;
      });

    // Remove duplicates and sort newest first
    const unique = [...new Set(years)];
    return unique.sort((a, b) => b - a);
  },

  // Debounce: waits until user stops typing before calling the function
  debounce(fn, delay) {
    delay = delay || 350;
    let timer = null;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn(...args);
      }, delay);
    };
  }

};