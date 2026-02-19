import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { usersTable } from './public/db/schema.js';
import {and, eq} from "drizzle-orm";
import {
    userLikesTable,
    userWatchlistTable,
    userWatchedTable,
} from "./public/db/schema.js";

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
app.use('/film', filmRoutes);

app.use("/users")

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

app.get("/api/users/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).send("Invalid user ID.");
    }

    try {
        const users = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, id))
            .limit(1);

        if (users.length === 0) {
            return res.status(404).send("User not found.");
        }

        res.json(users[0]);
    } catch (err) {
        console.error("Failed to fetch users: ", err);
        res.status(500).send("Failed to fetch users.");
    }
});

app.post("/api/users", async (req, res) => {
    try {
        await db.insert(usersTable).values(req.body).execute();
        res.status(201).send("User created successfully.");
    } catch (err) {
        console.error("Failed to create user: ", err);
        res.status(500).send("Failed to create user.");
    }
});

app.put("/api/users/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).send("Invalid user ID.");
    }

    try {
        await db.update(usersTable).set(req.body).where(eq(usersTable.id, id)).execute();
        res.status(204).send("User updated successfully.");
    } catch (err) {
        console.error("Failed to update user: ", err);
    }
});

app.delete("/api/users/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
        return res.status(400).send("Invalid user ID.");
    }

    try {
        await db.delete(usersTable).where(eq(usersTable.id, id)).execute();
        res.status(204).send("User deleted successfully.");
    } catch (err) {
        console.error("Failed to delete user: ", err);
    }
});

app.get("/api/users/:id/likes", async (req, res) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
        return res.status(400).send("Invalid user ID.");
    }

    const likes = await db
        .select()
        .from(userLikesTable)
        .where(eq(userLikesTable.userId, userId));
    res.json(likes);
});

app.post("/api/users/:id/likes", async (req, res) => {
    const userId = Number(req.params.id);
    const filmId = Number(req.body.filmId);

    if(!Number.isInteger(userId) || !Number.isInteger(filmId)) {
        return res.status(400).send("Invalid user ID or film ID.");
    }

    await db.insert(userLikesTable).values({
        userId: req.body.userId,
        filmId: req.body.filmId,
        createdAt: req.body.createdAt
    });
    res.status(201).send("Film added to watchlist.");

});

app.delete("/api/users/:id/watchlist/:filmId", async (req, res) => {
    const userId = Number(req.params.id);
    const filmId = Number(req.params.filmId);
    if(!Number.isInteger(userId) || !Number.isInteger(filmId)) {
        return res.status(400).send("Invalid user ID or film ID.");
    }

    await db
        .delete(userWatchlistTable)
        .where(and(eq(userWatchlistTable.userId, userId), eq(userWatchlistTable.filmId, filmId)));
    res.json({ message: "Film removed from watchlist." });
});

app.get("/api/users/:id/watched", async (req, res) => {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) {
        return res.status(400).send("Invalid user ID.");
    }

    const watched = await db
        .select()
        .from(userWatchedTable)
        .where(eq(userWatchedTable.userId, userId));
    res.json(watched);
});

app.post("/api/users/:id/watched", async (req, res) => {
    const userId = Number(req.params.id);
    const filmId = Number(req.body.filmId);
    const watchedAt = req.body.watchedAt ? new Date(req.body.watchedAt) : new Date();

    if(!Number.isInteger(userId) || !Number.isInteger(filmId)) {
        return res.status(400).send("Invalid user ID or film ID.");
    }

    await db.insert(userWatchedTable).values({
        userId: req.body.userId,
        filmId: req.body.filmId,
        watchedAt: req.body.watchedAt,
    });
    res.status(201).send("Marked as watched.");

});

app.delete("/api/users/:id/watched/:filmId", async (req, res) => {
    const userId = Number(req.params.id);
    const filmId = Number(req.params.filmId);
    if(!Number.isInteger(userId) || !Number.isInteger(filmId)) {
        return res.status(400).send("Invalid user ID or film ID.");
    }

    await db
        .delete(userWatchedTable)
        .where(and(eq(userWatchedTable.userId, userId), eq(userWatchedTable.filmId, filmId)));
    res.json({ message: "Film removed from watched." });
});



app.listen(PORT, () => {
    console.log(`LetterBoxe running on http://localhost:${PORT}`);
});

