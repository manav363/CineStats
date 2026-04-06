/* =============================================
   filters.js — All the search, filter, and sort logic
   Uses .filter() and .map() a lot!
   ============================================= */

// ── Search filter ─────────────────────────────

// Keeps only movies whose title contains the search text
function filterBySearch(movieList, searchText) {
  // If nothing was typed, return all movies unchanged
  if (!searchText || searchText.trim() === "") {
    return movieList;
  }

  // Make it lowercase so "avengers" also matches "Avengers"
  var lowerSearch = searchText.trim().toLowerCase();

  // .filter() goes through each movie and only keeps ones where the title matches
  var results = movieList.filter(function (movie) {
    var lowerTitle = movie.title.toLowerCase();
    return lowerTitle.includes(lowerSearch);
  });

  return results;
}

// ── Genre filter ──────────────────────────────

// Keeps only movies that belong to the chosen genre
function filterByGenre(movieList, genreId) {
  // If no genre is selected, return all movies
  if (!genreId) {
    return movieList;
  }

  // Convert to a number because the API stores genre IDs as numbers
  var genreNumber = Number(genreId);

  // .filter() keeps only movies that have this genre in their list
  var results = movieList.filter(function (movie) {
    // movie.genre_ids is an array like [28, 12, 878]
    // .includes() checks if our genre number is in there
    return movie.genre_ids && movie.genre_ids.includes(genreNumber);
  });

  return results;
}

// ── Rating filter ─────────────────────────────

// Keeps only movies with a rating at least as high as the minimum
function filterByRating(movieList, minimumRating) {
  // If no minimum rating is set, return all movies
  if (!minimumRating) {
    return movieList;
  }

  var minNumber = parseFloat(minimumRating);

  // .filter() keeps only movies where the rating is good enough
  var results = movieList.filter(function (movie) {
    return movie.vote_average >= minNumber;
  });

  return results;
}

// ── Year filter ───────────────────────────────

// Keeps only movies that came out in the chosen year
function filterByYear(movieList, chosenYear) {
  // If no year is chosen, return all movies
  if (!chosenYear) {
    return movieList;
  }

  // .filter() keeps only movies from that year
  var results = movieList.filter(function (movie) {
    // release_date looks like "2023-07-15", so we take the first 4 characters
    var movieYear = movie.release_date ? movie.release_date.slice(0, 4) : "";
    return movieYear === String(chosenYear);
  });

  return results;
}

// ── Sorting ───────────────────────────────────

// Sorts the movies in a given order
function sortMovies(movieList, sortOption) {
  // Make a copy of the array so we don't change the original
  var copyOfList = movieList.slice();

  if (sortOption === "rating_desc") {
    // Highest rating first
    copyOfList.sort(function (a, b) {
      return b.vote_average - a.vote_average;
    });

  } else if (sortOption === "rating_asc") {
    // Lowest rating first
    copyOfList.sort(function (a, b) {
      return a.vote_average - b.vote_average;
    });

  } else if (sortOption === "title_asc") {
    // A to Z
    copyOfList.sort(function (a, b) {
      return a.title.localeCompare(b.title);
    });

  } else if (sortOption === "title_desc") {
    // Z to A
    copyOfList.sort(function (a, b) {
      return b.title.localeCompare(a.title);
    });

  } else if (sortOption === "date_desc") {
    // Newest first
    copyOfList.sort(function (a, b) {
      return new Date(b.release_date || 0) - new Date(a.release_date || 0);
    });

  } else if (sortOption === "date_asc") {
    // Oldest first
    copyOfList.sort(function (a, b) {
      return new Date(a.release_date || 0) - new Date(b.release_date || 0);
    });
  }

  // For "default", we just return the copy without sorting
  return copyOfList;
}

// ── Run all filters at once ───────────────────

// This runs all four filters and the sort in the right order
function applyAllFilters(movieList, options) {
  // Start with the full list
  var result = movieList;

  // Apply each filter one at a time
  result = filterBySearch(result, options.search);
  result = filterByGenre(result, options.genre);
  result = filterByRating(result, options.minRating);
  result = filterByYear(result, options.year);

  // Finally sort whatever is left
  result = sortMovies(result, options.sortBy);

  return result;
}

// ── Extract years from movie list ─────────────

// Looks at all movies and collects the unique years (for the year dropdown)
function getUniqueYears(movieList) {
  // .map() turns each movie into just its year string (or null)
  var allYears = movieList.map(function (movie) {
    if (movie.release_date && movie.release_date.length >= 4) {
      return movie.release_date.slice(0, 4);
    }
    return null;
  });

  // .filter() removes the nulls
  var validYears = allYears.filter(function (year) {
    return year !== null;
  });

  // Remove duplicates using a Set, then convert back to an array
  var uniqueYears = Array.from(new Set(validYears));

  // Sort newest year first
  uniqueYears.sort(function (a, b) {
    return b - a;
  });

  return uniqueYears;
}

// ── Debounce helper ───────────────────────────

// Waits until the user stops typing before calling the function.
// This way we don't make 1 API call per keystroke.
function makeDebounced(theFunction, waitTime) {
  if (!waitTime) {
    waitTime = 350;
  }
  var timerHandle = null;

  return function () {
    // Grab all the arguments that were passed in
    var args = arguments;
    // Cancel the previous timer every time a new key is pressed
    clearTimeout(timerHandle);
    // Start a new timer — only fires if user stops typing for `waitTime` ms
    timerHandle = setTimeout(function () {
      theFunction.apply(null, args);
    }, waitTime);
  };
}
