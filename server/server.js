require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");
const client = new MongoClient(process.env.MONGO_URI);
const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// Required Variables
const PROJ_STATUS = ["Planning", "Active", "Completed"];

let users;
let projects;
let memberships;

// Connect to MongoDB
async function connectDatabase() {
    try {
        await client.connect();
		const db = client.db("client");
		
		users = client.db("client").collection("users");
		projects = db.collection("projects");
        memberships = db.collection("projectmemberships");
		
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

// Project
function validId(id) {
    return typeof id === "string" && ObjectId.isValid(id);
}

// Get registered users, without returning passwords.
app.get("/api/users", async (req, res) => {
    try {
        const registeredUsers = await users.find({}, {
            projection: { username: 1 }
        }).toArray();
        res.json(registeredUsers);
    } catch (error) {
        res.status(500).json({ message: "Could not get users." });
    }
});

// Create a project and automatically make the project lead a member.
app.post("/api/projects", async (req, res) => {
    const { name, description, status, project_lead_id } = req.body;

    if (!name || !name.trim() || !description || !description.trim() ||
        !status || !project_lead_id) {
        return res.status(400).json({ message: "Please fill in every project field." });
    }

    if (!PROJ_STATUS.includes(status)) {
        return res.status(400).json({ message: "Please choose a valid project status." });
    }

    if (!validId(project_lead_id)) {
        return res.status(400).json({ message: "Please select a valid project lead." });
    }

    try {
        const leadId = new ObjectId(project_lead_id);
        const lead = await users.findOne({ _id: leadId });
        if (!lead) {
            return res.status(404).json({ message: "Project lead was not found." });
        }

        const result = await projects.insertOne({
            name: name.trim(),
            description: description.trim(),
            status,
            project_lead_id: leadId
        });

        await memberships.insertOne({
            project_id: result.insertedId,
            user_id: leadId
        });

        res.status(201).json({ message: "Project created successfully." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Could not create project." });
    }
});

// Get all projects.
app.get("/api/projects", async (req, res) => {
    try {
        const allProjects = await projects.find({}).sort({ name: 1 }).toArray();
        res.json(allProjects);
    } catch (error) {
        res.status(500).json({ message: "Could not get projects." });
    }
});

// Get the members of a project.
app.get("/api/projects/:projectId/members", async (req, res) => {
    const { projectId } = req.params;
    if (!validId(projectId)) {
        return res.status(400).json({ message: "Invalid project id." });
    }

    try {
        const id = new ObjectId(projectId);
        const project = await projects.findOne({ _id: id });
        if (!project) {
            return res.status(404).json({ message: "Project was not found." });
        }

        const projectMembers = await memberships.find({ project_id: id }).toArray();
        res.json(projectMembers);
    } catch (error) {
        res.status(500).json({ message: "Could not get project members." });
    }
});

// Add a member to a project.
app.post("/api/projects/:projectId/members", async (req, res) => {
    const { projectId } = req.params;
    const { user_id } = req.body;

    if (!validId(projectId) || !validId(user_id)) {
        return res.status(400).json({ message: "Please select a valid project and user." });
    }

    try {
        const projectObjectId = new ObjectId(projectId);
        const userObjectId = new ObjectId(user_id);

        const project = await projects.findOne({ _id: projectObjectId });
        if (!project) {
            return res.status(404).json({ message: "Project was not found." });
        }

        const user = await users.findOne({ _id: userObjectId });
        if (!user) {
            return res.status(404).json({ message: "User was not found." });
        }

        const existing = await memberships.findOne({
            project_id: projectObjectId,
            user_id: userObjectId
        });
        if (existing) {
            return res.status(409).json({ message: "That user is already a project member." });
        }

        await memberships.insertOne({
            project_id: projectObjectId,
            user_id: userObjectId
        });
        res.status(201).json({ message: "Member added successfully." });
    } catch (error) {
        res.status(500).json({ message: "Could not add member." });
    }
});

// Remove a member, but never allow the project lead to be removed.
app.delete("/api/projects/:projectId/members/:userId", async (req, res) => {
    const { projectId, userId } = req.params;

    if (!validId(projectId) || !validId(userId)) {
        return res.status(400).json({ message: "Invalid project or user id." });
    }

    try {
        const projectObjectId = new ObjectId(projectId);
        const userObjectId = new ObjectId(userId);

        const project = await projects.findOne({ _id: projectObjectId });
        if (!project) {
            return res.status(404).json({ message: "Project was not found." });
        }

        if (project.project_lead_id.toString() === userObjectId.toString()) {
            return res.status(400).json({ message: "The project lead cannot be removed." });
        }

        const result = await memberships.deleteOne({
            project_id: projectObjectId,
            user_id: userObjectId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Membership was not found." });
        }

        res.json({ message: "Member removed successfully." });
    } catch (error) {
        res.status(500).json({ message: "Could not remove member." });
    }
});