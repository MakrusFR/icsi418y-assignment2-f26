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
let stories;

// Connect to MongoDB
async function connectDatabase() {
    try {
        await client.connect();
		const db = client.db("client");
		
		users = client.db("client").collection("users");
		projects = db.collection("projects");
        memberships = db.collection("projectmemberships");
        stories = db.collection("userstories");
		
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

        const assignedStory = await stories.findOne({
            project_id: projectObjectId,
            assigned_user_id: userObjectId
        });
        if (assignedStory) {
            return res.status(409).json({
                message: "Reassign, unassign, or delete this member's stories before removing them."
            });
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

// User Stories
const STORY_PRIORITIES = ["High", "Medium", "Low"];
const STORY_STATUSES = ["To Do", "In Progress", "Done"];

function validStoryText(value) {
    return typeof value === "string" && value.trim().length > 0;
}

async function validateAssignee(projectId, assignedUserId) {
    if (assignedUserId === null) return { valid: true, value: null };
    if (!validId(assignedUserId)) return { valid: false };

    const userId = new ObjectId(assignedUserId);
    const user = await users.findOne({ _id: userId });
    if (!user) return { valid: false };

    const membership = await memberships.findOne({
        project_id: projectId,
        user_id: userId
    });
    if (!membership) return { valid: false };

    return { valid: true, value: userId };
}

// Get all stories belonging to one project.
app.get("/api/projects/:projectId/stories", async (req, res) => {
    if (!validId(req.params.projectId)) {
        return res.status(400).json({ message: "Invalid project id." });
    }

    try {
        const projectId = new ObjectId(req.params.projectId);
        const project = await projects.findOne({ _id: projectId });
        if (!project) return res.status(404).json({ message: "Project was not found." });

        const result = await stories.find({ project_id: projectId }).sort({ _id: -1 }).toArray();
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: "Could not get stories." });
    }
});

// Create a story. New stories always start as To Do.
app.post("/api/projects/:projectId/stories", async (req, res) => {
    const { projectId } = req.params;
    const { title, description, priority, assigned_user_id } = req.body;

    if (!validId(projectId) || !validStoryText(title) || !validStoryText(description) ||
        !STORY_PRIORITIES.includes(priority)) {
        return res.status(400).json({ message: "Enter a title, description, and valid priority." });
    }

    try {
        const projectObjectId = new ObjectId(projectId);
        const project = await projects.findOne({ _id: projectObjectId });
        if (!project) return res.status(404).json({ message: "Project was not found." });

        const assignment = await validateAssignee(projectObjectId,
            assigned_user_id === undefined || assigned_user_id === "" ? null : assigned_user_id);
        if (!assignment.valid) {
            return res.status(400).json({ message: "The assigned user must be a member of this project." });
        }

        const story = {
            project_id: projectObjectId,
            title: title.trim(),
            description: description.trim(),
            priority,
            status: "To Do",
            assigned_user_id: assignment.value
        };
        const result = await stories.insertOne(story);
        res.status(201).json({ ...story, _id: result.insertedId });
    } catch (error) {
        res.status(500).json({ message: "Could not create story." });
    }
});

// Update a story without allowing its project or database id to change.
app.put("/api/projects/:projectId/stories/:storyId", async (req, res) => {
    const { projectId, storyId } = req.params;
    const { title, description, priority, status, assigned_user_id } = req.body;

    if (!validId(projectId) || !validId(storyId) ||
        !validStoryText(title) || !validStoryText(description) ||
        !STORY_PRIORITIES.includes(priority) || !STORY_STATUSES.includes(status)) {
        return res.status(400).json({ message: "Please enter valid story information." });
    }

    try {
        const projectObjectId = new ObjectId(projectId);
        const storyObjectId = new ObjectId(storyId);
        const project = await projects.findOne({ _id: projectObjectId });
        if (!project) return res.status(404).json({ message: "Project was not found." });

        const assignment = await validateAssignee(projectObjectId,
            assigned_user_id === undefined || assigned_user_id === "" ? null : assigned_user_id);
        if (!assignment.valid) {
            return res.status(400).json({ message: "The assigned user must be a member of this project." });
        }

        const result = await stories.updateOne(
            { _id: storyObjectId, project_id: projectObjectId },
            { $set: {
                title: title.trim(),
                description: description.trim(),
                priority,
                status,
                assigned_user_id: assignment.value
            } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Story was not found in this project." });
        }
        res.json({ message: "Story updated successfully." });
    } catch (error) {
        res.status(500).json({ message: "Could not update story." });
    }
});

// Delete a story only when it belongs to the project in the URL.
app.delete("/api/projects/:projectId/stories/:storyId", async (req, res) => {
    if (!validId(req.params.projectId) || !validId(req.params.storyId)) {
        return res.status(400).json({ message: "Invalid project or story id." });
    }

    try {
        const result = await stories.deleteOne({
            _id: new ObjectId(req.params.storyId),
            project_id: new ObjectId(req.params.projectId)
        });
        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Story was not found in this project." });
        }
        res.json({ message: "Story deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Could not delete story." });
    }
});
