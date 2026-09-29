require("dotenv").config();
const { MongoClient } = require("mongodb");
const client = new MongoClient(process.env.MONGO_URI);
const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

async function connectDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Could not connect to MongoDB");
        console.error(error);
    }
}

app.get("/", (req, res) => {
    res.json({
        message: "Server is running"
    });
});

app.listen(9000, () => {
    console.log("Server running on port 9000");
});

connectDatabase();

// Sign in route
app.post("/signup", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Missing information" });
    }

    try {
        const user = await users.findOne({ username });

        if (user) {
            return res.status(409).json({ message: "Username already exists" });
        }

        await users.insertOne({ username, password });

        res.status(201).json({ message: "User created successfully" });
    } 
    catch {
        res.status(500).json({ message: "Server error" });
    }
});

// Log in route
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Missing information" });
    }

    try {
        const user = await users.findOne({ username });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Invalid login" });
        }

        res.status(200).json({ message: "Login successful" });
    } 
    catch {
        res.status(500).json({ message: "Server error" });
    }
});