const API_KEY = "db55323b8d3e4154498498a75642b381";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const DEFAULT_MOVIE_LIMIT = 5;
const MAX_MOVIE_LIMIT = 10;

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
        title: rawMovie.original_title || "Untitled",
        poster: rawMovie.poster_path ? `${IMAGE_BASE_URL}${rawMovie.poster_path}` : "",
        releaseDate: rawMovie.release_date || "",
        voteAverage: rawMovie.vote_average || 0,
    };
}

async function getMovies(category, limit = DEFAULT_MOVIE_LIMIT) {
    let endpoint = "";

    switch (category) {
        case "latest":
            endpoint = "/movie/now_playing";
            break;
        case "popular":
            endpoint = "/movie/popular";
            break;
        default:
            endpoint = "/movie/popular";
            break;
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${API_KEY}`);
        if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`);
        }

        const data = await response.json();
        const safeResults = Array.isArray(data.results) ? data.results : [];
        const max = getLimit(limit);

        return safeResults.slice(0, max).map(toMovie);
    } catch (error) {
        console.error(`ERROR FETCHING ${category.toUpperCase()} MOVIES:`, error);
        return [];
    }
}

function renderFilmRow(container, movies, metaTextBuilder) {
    if (!container) {
        return;
    }

    if (!movies.length) {
        container.innerHTML = '<p class="empty-state">No movies available.</p>';
        return;
    }

    container.innerHTML = movies.map((movie) => {
        const metaText = metaTextBuilder(movie);
        return `
            <div class="film-card">
                <img src="${movie.poster}" alt="${movie.title}">
                <p>${movie.title}</p>
                <span class="film-year">${metaText}</span>
            </div>
        `;
    }).join("");
}

function renderPopularMovies(container, movies) {
    renderFilmRow(container, movies, (movie) => getReleaseYear(movie.releaseDate));
}

async function populateIndexMovies() {
    const newReleasesContainer = document.querySelector("#new-releases-list");
    const popularMoviesContainer = document.querySelector("#popular-movies-list");

    if (!newReleasesContainer && !popularMoviesContainer) {
        return;
    }

    const [latestMovies, popularMovies] = await Promise.all([
        getMovies("latest", DEFAULT_MOVIE_LIMIT),
        getMovies("popular", DEFAULT_MOVIE_LIMIT),
    ]);

    renderFilmRow(newReleasesContainer, latestMovies, (movie) => getReleaseYear(movie.releaseDate));
    renderPopularMovies(popularMoviesContainer, popularMovies);
}

populateIndexMovies();
