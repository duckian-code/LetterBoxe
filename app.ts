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
import filmRoutes from "./routes/filmRoutes.js";

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
/*app.use('/film', filmRoutes);

app.use("/users")*/

app.get("/", (req, res) => {
    res.render("index");
});

app.get("/film", (req, res) => {
    res.render("film", {
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
            rating: 0,
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

app.get("/movies", (req, res) =>
{
    res.render("movies", {
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
