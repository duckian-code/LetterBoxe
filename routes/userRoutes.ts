import {Router} from 'express';

const router = Router();

router.get('/:id', async (req, res) => {
    const userId = req.params.id;
    const API_KEY = process.env.API_KEY;
    console.log(userId);

    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/$%7BmovieId%7D?api_key=${API_KEY}`);
        const userData = await response.json();

        res.render('usersTable', { usersTable: userData });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error fetching user details');
    }
})

export default router;