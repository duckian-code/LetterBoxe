const API_KEY = "db55323b8d3e4154498498a75642b381";
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; // for poster cards

async function getMovies(category) {
    let endpoint = '';

    switch (category) {
        case 'latest':
            endpoint = '/movie/now_playing';
            break;
        case 'popular':
            endpoint = '/movie/popular';
            break;
        case 'oscars':
            endpoint = '/discover/movie?with_keywords=291079';
            break;
        default:
            endpoint = '/movie/popular';
            break;
    }

    try {
        // URL construction from Gemini
        // endpoint.includes('?') - check if endpoint already contains question mark
        // ?'&' if TRUE, use an & symbol
        // :'?' if false, use a question mark to start parameters
        const response = await fetch(`${BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${API_KEY}`);
        const data = await response.json();

        return data.results.map(movie => ({
            id: movie.id,
            title: movie.title,
            poster: `${IMAGE_BASE_URL}${movie.poster_path}`,
            rating: movie.vote_average, // TODO: replace built in rating with API ratings
            releaseDate: movie.release_date,
            description: movie.overview
        }));
    } catch (error) {
        console.error("ERROR FETCHING MOVIES: " + error);
    }
}

console.log(getMovies("latest"));