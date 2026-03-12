const API_KEY = "db55323b8d3e4154498498a75642b381";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const DEFAULT_MOVIE_LIMIT = 16;
const MAX_MOVIE_LIMIT = 32;
const MOVIE_GENRES = {
    12: "Adventure",
    14: "Fantasy",
    16: "Animation",
    18: "Drama",
    27: "Horror",
    28: "Action",
    35: "Comedy",
    36: "History",
    37: "Western",
    53: "Thriller",
    80: "Crime",
    99: "Documentary",
    10402: "Music",
    10749: "Romance",
    10751: "Family",
    10752: "War",
    10770: "TV Movie",
    878: "Science Fiction",
    9648: "Mystery",
};

function getLimit(limit = DEFAULT_MOVIE_LIMIT) {
    return Math.min(Math.max(1, limit), MAX_MOVIE_LIMIT);
}

function getReleaseYear(releaseDate) {
    if (!releaseDate) {
        return "TBA";
    }
    return releaseDate.slice(0, 4);
}

function toMovie(rawMovie) {
    return {
        id: rawMovie.id,
        title: rawMovie.original_title || rawMovie.title || "Untitled",
        poster: rawMovie.poster_path ? `${IMAGE_BASE_URL}${rawMovie.poster_path}` : "",
        releaseDate: rawMovie.release_date || "",
        voteAverage: rawMovie.vote_average || 0,
        genreIds: Array.isArray(rawMovie.genre_ids)
            ? rawMovie.genre_ids
            : Array.isArray(rawMovie.genres)
                ? rawMovie.genres.map((genre) => genre.id)
                : [],
    };
}

function sortMoviesByTitle(movies) {
    const normalizeTitleForSort = (title) => title.replace(/^the\s+/i, "").trim();
    return [...movies].sort((a, b) =>
        normalizeTitleForSort(a.title).localeCompare(normalizeTitleForSort(b.title), undefined, { sensitivity: "base" })
    );
}

async function fetchMovieResults(endpoint, params = {}) {
    try {
        const searchParams = new URLSearchParams({
            api_key: API_KEY,
            ...params,
        });
        const response = await fetch(`${BASE_URL}${endpoint}?${searchParams.toString()}`);
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        const data = await response.json();
        const safeResults = Array.isArray(data.results) ? data.results : [];
        return safeResults.map(toMovie);
    } catch (error) {
        console.error(`ERROR FETCHING MOVIES FROM ${endpoint}:`, error);
        return [];
    }
}

async function getMovies(category, limit = DEFAULT_MOVIE_LIMIT) {
    let endpoint = "/movie/popular";
    let params = {};

    switch (category) {
        case "latest":
            endpoint = "/movie/now_playing";
            break;
        case "popular":
            endpoint = "/movie/popular";
            break;
        case "random":
            endpoint = "/discover/movie";
            params = {
                page: String(Math.floor(Math.random() * 500) + 1),
                "vote_count.gte": "100",
            };
            break;
        default:
            break;
    }

    const max = getLimit(limit);
    const movies = await fetchMovieResults(endpoint, params);
    return movies.slice(0, max);
}

async function searchMovies(searchTerm) {
    return fetchMovieResults("/search/movie", {
        query: searchTerm,
        include_adult: "false",
        language: "en-US",
        page: "1",
    });
}

async function getMoviesByGenre(genreId) {
    return fetchMovieResults("/discover/movie", {
        with_genres: String(genreId),
        include_adult: "false",
        language: "en-US",
        page: "1",
        sort_by: "popularity.desc",
    });
}

async function getMoviesForFilters(searchTerm, selectedCategory) {
    const moviesPageLimit = getLimit(DEFAULT_MOVIE_LIMIT);
    const hasSearch = Boolean(searchTerm);
    const hasCategory = selectedCategory !== "all";

    if (hasSearch && hasCategory) {
        const [searchResults, categoryResults] = await Promise.all([
            searchMovies(searchTerm),
            getMoviesByGenre(selectedCategory),
        ]);
        const categoryIds = new Set(categoryResults.map((movie) => movie.id));
        return searchResults.filter((movie) => categoryIds.has(movie.id)).slice(0, moviesPageLimit);
    }

    if (hasSearch) {
        const results = await searchMovies(searchTerm);
        return results.slice(0, moviesPageLimit);
    }

    if (hasCategory) {
        const results = await getMoviesByGenre(selectedCategory);
        return results.slice(0, moviesPageLimit);
    }

    const results = await fetchMovieResults("/movie/popular", {
        language: "en-US",
        page: "1",
    });
    return results.slice(0, moviesPageLimit);
}

function renderFilmRow(container, movies, metaTextBuilder) {
    if (!container) {
        return;
    }

    if (!movies.length) {
        container.innerHTML = '<p class="empty-state">No movies available.</p>';
        return;
    }

    const sortedMovies = sortMoviesByTitle(movies);
    container.innerHTML = sortedMovies.map((movie) => {
        const metaText = metaTextBuilder(movie);
        return `
            <div class="film-card">
                <a href="/film?id=${encodeURIComponent(movie.id)}" class="film-link">
                    <img src="${movie.poster}" alt="${movie.title}">
                    <p>${movie.title}</p>
                    <span class="film-year">${metaText}</span>
                </a>
            </div>
        `;
    }).join("");
}

function renderMoviesGrid(container, movies) {
    if (!container) {
        return;
    }

    if (!movies.length) {
        container.innerHTML = '<p class="empty-state">No movies match your filters.</p>';
        return;
    }

    const sortedMovies = sortMoviesByTitle(movies);
    container.innerHTML = sortedMovies.map((movie) => `
        <div class="film-card">
            <a href="/film?id=${encodeURIComponent(movie.id)}" class="film-link">
                <img src="${movie.poster}" alt="${movie.title}">
                <p>${movie.title}</p>
                <span class="film-year">${getReleaseYear(movie.releaseDate)}</span>
            </a>
        </div>
    `).join("");
}

function renderPopularMovies(container, movies) {
    renderFilmRow(container, movies, (movie) => getReleaseYear(movie.releaseDate));
}

function getMovieYear(movie) {
    const year = Number.parseInt((movie.releaseDate || "").slice(0, 4), 10);
    return Number.isNaN(year) ? null : year;
}

function getGenreName(genreId) {
    return MOVIE_GENRES[genreId] || `Genre ${genreId}`;
}

function populateSimilarGenreFilterOptions(selectElement, movies) {
    if (!selectElement) {
        return;
    }

    const genreIds = new Set();
    movies.forEach((movie) => {
        movie.genreIds.forEach((genreId) => genreIds.add(genreId));
    });

    [...genreIds].sort((a, b) => getGenreName(a).localeCompare(getGenreName(b))).forEach((genreId) => {
        if (selectElement.querySelector(`option[value="${genreId}"]`)) return;
        const option = document.createElement("option");
        option.value = String(genreId);
        option.textContent = getGenreName(genreId);
        selectElement.append(option);
    });
}

function setupMoviesPageFilters() {
    const moviesGrid = document.querySelector("#movies-grid");
    const searchInput = document.querySelector("#movie-search");
    const categorySelect = document.querySelector("#movie-category");
    const moviesHeading = document.querySelector("#movies-page h1");

    if (!moviesGrid || !searchInput || !categorySelect) {
        return;
    }

    Object.keys(MOVIE_GENRES)
        .map(Number)
        .sort((a, b) => MOVIE_GENRES[a].localeCompare(MOVIE_GENRES[b]))
        .forEach((genreId) => {
            const option = document.createElement("option");
            option.value = String(genreId);
            option.textContent = MOVIE_GENRES[genreId];
            categorySelect.append(option);
        });

    const params = new URLSearchParams(window.location.search);
    const initialCategory = params.get("category");
    if (initialCategory && categorySelect.querySelector(`option[value="${initialCategory}"]`)) {
        categorySelect.value = initialCategory;
    }

    let requestId = 0;
    let debounceTimer;

    const updateMoviesHeading = (selectedCategory) => {
        if (!moviesHeading) {
            return;
        }

        if (selectedCategory === "all") {
            moviesHeading.innerText = "All Movies";
            return;
        }

        const categoryName = MOVIE_GENRES[Number(selectedCategory)];
        moviesHeading.innerText = categoryName ? `${categoryName} Movies` : "All Movies";
    };

    const applyFilters = async () => {
        const currentRequestId = ++requestId;
        const searchTerm = searchInput.value.trim();
        const selectedCategory = categorySelect.value;
        updateMoviesHeading(selectedCategory);
        moviesGrid.innerHTML = '<p class="empty-state">Loading movies...</p>';

        const filteredMovies = await getMoviesForFilters(searchTerm, selectedCategory);
        if (currentRequestId !== requestId) {
            return;
        }

        renderMoviesGrid(moviesGrid, filteredMovies);
    };

    searchInput.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(applyFilters, 300);
    });
    categorySelect.addEventListener("change", applyFilters);
    void applyFilters();
}

async function populateIndexMovies() {
    const newReleasesContainer = document.querySelector("#new-movies-list");
    const popularMoviesContainer = document.querySelector("#popular-movies-list");
    const moviesGrid = document.querySelector("#movies-grid");

    if (!newReleasesContainer && !popularMoviesContainer && !moviesGrid) {
        return;
    }

    const [latestMovies, popularMovies] = await Promise.all([
        getMovies("latest", DEFAULT_MOVIE_LIMIT),
        getMovies("popular", DEFAULT_MOVIE_LIMIT)
    ]);

    renderFilmRow(newReleasesContainer, latestMovies, (movie) => getReleaseYear(movie.releaseDate));
    renderPopularMovies(popularMoviesContainer, popularMovies);

    if (moviesGrid) {
        setupMoviesPageFilters();
    }
}

async function populateRandomMovieDetails() {
    const filmHero = document.querySelector(".film-hero");
    if (!filmHero) return;

    try {
        const params = new URLSearchParams(window.location.search);
        const selectedMovieId = params.get("id");

        let detailUrl = "";
        if (selectedMovieId) {
            detailUrl = `${BASE_URL}/movie/${selectedMovieId}?api_key=${API_KEY}&append_to_response=similar`;
        } else {
            const randomPage = Math.floor(Math.random() * 500) + 1;
            const response = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&page=${randomPage}&vote_count.gte=500&language=en-US`);
            const data = await response.json();
            const randomIndex = Math.floor(Math.random() * data.results.length);
            const randomMovie = data.results[randomIndex];
            detailUrl = `${BASE_URL}/movie/${randomMovie.id}?api_key=${API_KEY}&append_to_response=similar`;
        }

        const detailResponse = await fetch(detailUrl);
        const movie = await detailResponse.json();

        document.querySelectorAll("h1").forEach(h1 => h1.innerText = movie.title);

        document.querySelectorAll("img[src*='poster_path'], .film-poster").forEach(img => {
            img.src = `${IMAGE_BASE_URL}${movie.poster_path}`;
            img.alt = movie.title;
        });

        const voteAverage = Number(movie.vote_average || 0);
        const normalizedVoteAverage = Number(voteAverage.toFixed(1));
        const releaseYear = getReleaseYear(movie.release_date || "");
        const runtimeText = movie.runtime ? `${movie.runtime} mins` : "Runtime N/A";
        const overviewText = `${releaseYear} • ${runtimeText} • ${normalizedVoteAverage.toFixed(1)}/10`;
        const metaElement = document.querySelector(".film-meta");
        if (metaElement) metaElement.innerText = overviewText;

        const synopsisElement = document.querySelector(".film-synopsis");
        if (synopsisElement) synopsisElement.innerText = movie.overview;

        const providersElement = document.querySelector(".watch-providers-list");
        if (providersElement) {
            const providersResponse = await fetch(`${BASE_URL}/movie/${movie.id}/watch/providers?api_key=${API_KEY}`);
            const providersData = await providersResponse.json();
            const providerResults = providersData.results || {};
            const regionCode = providerResults.US ? "US" : Object.keys(providerResults)[0];

            if (!regionCode) {
                providersElement.innerText = "Not currently available to stream.";
            } else {
                const regionProviders = providerResults[regionCode];
                const allProviders = [
                    ...(regionProviders.flatrate || []),
                    ...(regionProviders.rent || []),
                    ...(regionProviders.buy || []),
                ];
                const uniqueProviderNames = [...new Set(allProviders.map((provider) => provider.provider_name))];

                if (!uniqueProviderNames.length) {
                    providersElement.innerText = "Not currently available to stream.";
                } else if (regionProviders.link) {
                    providersElement.innerHTML = `${uniqueProviderNames.join(", ")} <a href="${regionProviders.link}" target="_blank" rel="noopener noreferrer">(View options)</a>`;
                } else {
                    providersElement.innerText = uniqueProviderNames.join(", ");
                }
            }
        }
        const genreContainer = document.querySelector(".genre-tags");
        if (genreContainer && movie.genres) {
            genreContainer.innerHTML = movie.genres.map((g) =>
                `<a class="tag" href="/movies?category=${encodeURIComponent(g.id)}">${g.name}</a>`
            ).join("");
        }

        const similarContainer = document.querySelector("#similar-movies-list");
        const similarGenreFilter = document.querySelector("#similar-genre-filter");
        const similarMinRatingInput = document.querySelector("#similar-min-rating");
        const similarYearFromInput = document.querySelector("#similar-year-from");
        const similarYearToInput = document.querySelector("#similar-year-to");
        const resetSimilarFiltersButton = document.querySelector("#similar-filters-reset");

        const allSimilarMovies = Array.isArray(movie.similar?.results)
            ? movie.similar.results.map(toMovie)
            : [];

        const selectedMovieGenreIds = new Set(
            Array.isArray(movie.genres) ? movie.genres.map((genre) => genre.id) : []
        );

        if (similarGenreFilter) {
            populateSimilarGenreFilterOptions(similarGenreFilter, allSimilarMovies);
            similarGenreFilter.value = selectedMovieGenreIds.size ? "shared" : "all";
        }

        const applySimilarFilters = () => {
            if (!similarContainer) {
                return;
            }

            const selectedGenre = similarGenreFilter ? similarGenreFilter.value : "all";
            const minRating = Number.parseFloat(similarMinRatingInput ? similarMinRatingInput.value : "");
            const yearFrom = Number.parseInt(similarYearFromInput ? similarYearFromInput.value : "", 10);
            const yearTo = Number.parseInt(similarYearToInput ? similarYearToInput.value : "", 10);

            const filteredMovies = allSimilarMovies.filter((similarMovie) => {
                if (selectedGenre === "shared" && selectedMovieGenreIds.size > 0) {
                    const sharesGenre = similarMovie.genreIds.some((genreId) => selectedMovieGenreIds.has(genreId));
                    if (!sharesGenre) return false;
                } else if (selectedGenre !== "all") {
                    const requiredGenreId = Number.parseInt(selectedGenre, 10);
                    if (!similarMovie.genreIds.includes(requiredGenreId)) return false;
                }

                if (!Number.isNaN(minRating) && similarMovie.voteAverage < minRating) {
                    return false;
                }

                const releaseYear = getMovieYear(similarMovie);
                if (!Number.isNaN(yearFrom) && (releaseYear === null || releaseYear < yearFrom)) {
                    return false;
                }
                if (!Number.isNaN(yearTo) && (releaseYear === null || releaseYear > yearTo)) {
                    return false;
                }

                return true;
            }).slice(0, DEFAULT_MOVIE_LIMIT);

            renderFilmRow(
                similarContainer,
                filteredMovies,
                (similarMovie) =>
                    `${getReleaseYear(similarMovie.releaseDate)} • ${Number(similarMovie.voteAverage || 0).toFixed(1)}/10`
            );
        };

        if (similarGenreFilter) {
            similarGenreFilter.addEventListener("change", applySimilarFilters);
        }

        [similarMinRatingInput, similarYearFromInput, similarYearToInput].forEach((input) => {
            if (input) {
                input.addEventListener("input", applySimilarFilters);
            }
        });

        if (resetSimilarFiltersButton) {
            resetSimilarFiltersButton.addEventListener("click", () => {
                if (similarGenreFilter) {
                    similarGenreFilter.value = selectedMovieGenreIds.size ? "shared" : "all";
                }
                if (similarMinRatingInput) {
                    similarMinRatingInput.value = "";
                }
                if (similarYearFromInput) {
                    similarYearFromInput.value = "";
                }
                if (similarYearToInput) {
                    similarYearToInput.value = "";
                }
                applySimilarFilters();
            });
        }

        applySimilarFilters();


        const stars = document.querySelectorAll(".star-rating .star");
        const fiveStarRating = normalizedVoteAverage / 2;
        const fullStars = Math.floor(fiveStarRating);
        const hasHalfStar = fiveStarRating - fullStars >= 0.5;

        stars.forEach((star, index) => {
            star.classList.remove("active", "half");
            if (index < fullStars) {
                star.classList.add("active");
            } else if (index === fullStars && hasHalfStar) {
                star.classList.add("half");
            }
        });

    } catch (error) {
        console.error("Error populating random movie:", error);
    }
}

populateIndexMovies();
populateRandomMovieDetails();
