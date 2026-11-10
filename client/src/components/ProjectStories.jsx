import { useEffect, useState } from "react";
const blank = { title: "", description: "", priority: "Medium", assigned_user_id: "" };

function ProjectStories({ project, members, users }) {
    const [stories, setStories] = useState([]);
    const [form, setForm] = useState(blank);
    const [message, setMessage] = useState("");
    const id = project?._id;
    const url = `http://localhost:9000/api/projects/${id}/stories`;
    const name = (uid) => users.find((u) => u._id === String(uid))?.username || "Unassigned";
    const field = (key) => ({ value: form[key], onChange: (e) => setForm({ ...form, [key]: e.target.value }) });

    async function send(path, method, data) {
        const res = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: data && JSON.stringify(data) });
        const json = await res.json();
        if (!res.ok) throw new Error(json.message);
        return json;
    }
    async function run(action) {
        try { await action(); setMessage(""); setStories(await send(url, "GET")); } catch (e) { setMessage(e.message); }
    }
    useEffect(() => { setStories([]); if (id) run(async () => {}); }, [id]);

    if (!project) return <section className="panel"><h2>Project Backlog</h2><p className="help-text">Select a project to see its stories.</p></section>;
    return (
        <section className="panel">
            <h2>Project Backlog: {project.name}</h2>
            <p className="message">{message}</p>
            <form onSubmit={(e) => { e.preventDefault(); run(async () => { await send(url, "POST", { ...form, assigned_user_id: form.assigned_user_id || null }); setForm(blank); }); }}>
                <input placeholder="Title" required {...field("title")} />
                <textarea placeholder="As a ... I want ... so that ..." required {...field("description")} />
                <select {...field("priority")}>{["High", "Medium", "Low"].map((p) => <option key={p}>{p}</option>)}</select>
                <select {...field("assigned_user_id")}><option value="">Unassigned</option>{members.map((m) => <option key={m._id} value={m.user_id}>{name(m.user_id)}</option>)}</select>
                <button type="submit">Add Story</button>
            </form>
            {stories.length === 0 && <p className="help-text">This project has no stories yet.</p>}
            {stories.map((s) => (
                <div key={s._id} className="story-item">
                    <strong>{s.title}</strong> ({s.priority}) - {name(s.assigned_user_id)}
                    <p>{s.description}</p>
                    <select value={s.status} onChange={(e) => run(() => send(`${url}/${s._id}`, "PUT", { ...s, status: e.target.value }))}>{["To Do", "In Progress", "Done"].map((x) => <option key={x}>{x}</option>)}</select>
                    <button type="button" onClick={() => window.confirm(`Delete "${s.title}"?`) && run(() => send(`${url}/${s._id}`, "DELETE"))}>Delete</button>
                </div>
            ))}
        </section>
    );
}

export default ProjectStories;
