import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = drizzle(process.env.DATABASE_URL!);
const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, "data");
const DATA_PATH = path.join(DATA_DIR, "film_submissions.json");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded());

const currentUser = {
    username: "",
    avatar: ""
};

app.locals.popularMovies = [
    { title: "Dune: Part Two", year: 2024 },
    { title: "The Holdovers", year: 2023 },
    { title: "Oppenheimer", year: 2023 },
    { title: "Past Lives", year: 2023 },
    { title: "Spider-Man: Across the Spider-Verse", year: 2023 },
];

app.locals.popularReviews = [
    { title: "Dune: Part Two", author: "Ava M.", snippet: "A massive, elegant sci-fi epic." },
    { title: "The Holdovers", author: "Jules R.", snippet: "Warm, funny, and quietly moving." },
    { title: "Oppenheimer", author: "Priya S.", snippet: "Tense and mesmerizing from start to end." },
    { title: "Past Lives", author: "Marco L.", snippet: "A tender story that lingers." },
    { title: "Across the Spider-Verse", author: "Nina K.", snippet: "Inventive visuals and huge heart." },
];


app.get("/", (req, res) => {
    res.render("index", {
        currentUser,
        newMovies: [],
        oscarMovies: []
    });
});

app.get("/film", (req, res) => {
    res.render("film", {
        currentUser,
        movie: {
            title: "",
            year: "",
            director: "",
            runtime: "",
            genres: [],
            synopsis: "",
            poster: "",
            avgRating: "",
            watchCount: 0,
            listCount: 0,
            userRating: 0,
            reviews: [],
            similar: []
        }
    });
});

app.post("/film", async (req, res) => {
    const newOrder = {
        name: req.body.name || "",
        email: req.body.email || "",
        message: req.body.message || "",
        createdAt: new Date().toISOString(),
    };

    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        let orders = [];
        try {
            const existing = await fs.readFile(DATA_PATH, "utf-8");
            orders = JSON.parse(existing);
        } catch {
            orders = [];
        }
        orders.push(newOrder);
        await fs.writeFile(DATA_PATH, JSON.stringify(orders, null, 2), "utf-8");
    } catch (err) {
        console.error("Failed to save film:", err);
    }

    res.redirect("/");
});

app.get("/profile", (req, res) => {
    res.render("profile", {
        currentUser,
        profile: {
            username: currentUser.username,
            avatar: currentUser.avatar,
            watchedCount: 0,
            followers: 0,
            following: 0,
            recentActivity: [],
            favorites: [],
            watchlist: [],
            liked: []
        }
    });
});

app.get("/movies", (req, res) =>
{
    res.render("movies", {
            currentUser,
            /* placeholder movie to ensure movies.ejs displays correctly */
            movies: [
                {_id: 1, title: "oppenheimer", year: 2023, poster: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8FFJNBaIXvhEwqXXw40rYYDci8jPlYxWfy9082flliYoZ-SqqZjy0az-G5rIWuSJp2pn7xQ&s=10"}
            ]
        }

    )
});

app.listen(PORT, () => {
    console.log(`LetterBoxe running on http://localhost:${PORT}`);
});

