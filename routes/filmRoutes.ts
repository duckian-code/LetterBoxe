import {Router} from 'express';

const router = Router();

app.get('/film/:id', async (req, res) => {
    const movieId = req.params.id;
    const API_KEY = process.env.API_KEY;

    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieID}?api_key=${API_KEY}`);
        const movieData = await response.json();

        res.render('film', { movie: movieData });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error fetching movie details');
    }
})