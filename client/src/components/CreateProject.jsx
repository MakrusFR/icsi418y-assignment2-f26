import { useState } from "react";

function CreateProject({ users, onCreate }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("Planning");
    const [leadId, setLeadId] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        const created = await onCreate({
            name,
            description,
            status,
            project_lead_id: leadId
        });

        if (created) {
            setName("");
            setDescription("");
            setStatus("Planning");
        }
    }

    return (
        <section className="panel">
            <h2>Create a Project</h2>
            <p className="help-text">Choose a registered user to lead the project.</p>
            <form onSubmit={handleSubmit} className="project-form">
                <label>
                    Project name
                    <input value={name} onChange={(event) => setName(event.target.value)} required />
                </label>
                <label>
                    Description
                    <textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows="3" />
                </label>
                <div className="form-row">
                    <label>
                        Status
                        <select value={status} onChange={(event) => setStatus(event.target.value)}>
                            <option>Planning</option>
                            <option>Active</option>
                            <option>Completed</option>
                        </select>
                    </label>
                    <label>
                        Project lead
                        <select value={leadId} onChange={(event) => setLeadId(event.target.value)} required>
                            <option value="">Select a user</option>
                            {users.map((user) => (
                                <option key={user._id} value={user._id}>{user.username}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <button type="submit">Create Project</button>
            </form>
        </section>
    );
}

export default CreateProject;
