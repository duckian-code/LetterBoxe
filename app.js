const express = require("express");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, "data");
const DATA_PATH = path.join(DATA_DIR, "film_submissions.json");

app.set("view engine", "ejs");

app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded());

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
    res.render("index");
});

app.get("/film", (req, res) => {
    res.render("film");
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
        } catch (readErr) {
            orders = [];
        }

        orders.push(newOrder);
        await fs.writeFile(DATA_PATH, JSON.stringify(orders, null, 2), "utf-8");
    } catch (err) {
        console.error("Failed to save film:", err);
    }

    res.redirect("/index");
});

app.get("/profile", (req, res) => {
    res.render("profile");
});


app.listen(PORT, () => {
    console.log(`Express is listening on http://localhost:${PORT}`);
});
