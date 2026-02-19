const express = require("express");
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
const db = drizzle(process.env.DATABASE_URL);

const app = express();
const PORT = 3001;

app.set("view engine", "ejs");

app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded());


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
