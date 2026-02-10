const express = require

const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.render("home")
});

