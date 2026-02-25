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
        case "random":
            const randomPage = Math.floor(Math.random() * 500) + 1;
            endpoint = `/discover/movie?page=${randomPage}&vote_count.gte=100`;
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
    const newReleasesContainer = document.querySelector("#new-movies-list");
    const popularMoviesContainer = document.querySelector("#popular-movies-list");
    const moviesContainer = document.querySelector("#movies-page");

    if (!newReleasesContainer && !popularMoviesContainer && !moviesContainer) {
        return;
    }

    const [latestMovies, popularMovies, allMovies] = await Promise.all([
        getMovies("latest", DEFAULT_MOVIE_LIMIT),
        getMovies("popular", DEFAULT_MOVIE_LIMIT),
        getMovies("random", DEFAULT_MOVIE_LIMIT * 2)
    ]);

    renderFilmRow(newReleasesContainer, latestMovies, (movie) => getReleaseYear(movie.releaseDate));
    renderPopularMovies(popularMoviesContainer, popularMovies);
    renderFilmRow(moviesContainer, allMovies, (movie) => getReleaseYear(movie.releaseDate));
}

async function populateRandomMovieDetails() {
    const filmHero = document.querySelector(".film-hero");
    if (!filmHero) return;

    try {
        const randomPage = Math.floor(Math.random() * 500) + 1;
        const response = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&page=${randomPage}&vote_count.gte=500&language=en-US`);
        const data = await response.json();
        
        const randomIndex = Math.floor(Math.random() * data.results.length);
        const randomMovie = data.results[randomIndex];

        const detailResponse = await fetch(`${BASE_URL}/movie/${randomMovie.id}?api_key=${API_KEY}&append_to_response=similar`);
        const movie = await detailResponse.json();

        document.querySelectorAll("h1").forEach(h1 => h1.innerText = movie.title);
        
        document.querySelectorAll("img[src*='poster_path'], .film-poster").forEach(img => {
            img.src = `${IMAGE_BASE_URL}${movie.poster_path}`;
            img.alt = movie.title;
        });

        const overviewText = `${movie.release_date.slice(0, 4)} • ${movie.runtime} mins • ${movie.vote_average}/10`;
        const metaElement = document.querySelector(".film-meta");
        if (metaElement) metaElement.innerText = overviewText;

        const synopsisElement = document.querySelector(".film-synopsis");
        if (synopsisElement) synopsisElement.innerText = movie.overview;

        const genreContainer = document.querySelector(".genre-tags");
        if (genreContainer && movie.genres) {
            genreContainer.innerHTML = movie.genres.map(g => `<span class="tag">${g.name}</span>`).join("");
        }

        const similarContainer = document.querySelector(".film-row");
        if (similarContainer && movie.similar) {
            renderFilmRow(similarContainer, movie.similar.results.slice(0, 5).map(toMovie), (m) => getReleaseYear(m.releaseDate));
        }

        
    const ratingOutOfFive = Math.round(movie.vote_average / 2);


    const stars = document.querySelectorAll(".star-rating .star");


    stars.forEach((star, index) => {
        if (index < ratingOutOfFive) {
            star.classList.add("active");
        } else {
            star.classList.remove("active");
        }
    });

    } catch (error) {
        console.error("Error populating random movie:", error);
    }
}

populateIndexMovies();
populateRandomMovieDetails();
