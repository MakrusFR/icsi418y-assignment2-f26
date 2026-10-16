function ProjectList({ projects, users, selectedProjectId, onSelectProject }) {
    function getUsername(userId) {
        const user = users.find((item) => item._id === String(userId));
        return user ? user.username : "Unknown user";
    }

    return (
        <section className="panel">
            <h2>All Projects</h2>
            {projects.length === 0 ? (
                <p className="help-text">No projects yet. Create one above.</p>
            ) : (
                <div className="project-list">
                    {projects.map((project) => (
                        <button
                            type="button"
                            key={project._id}
                            className={`project-item ${selectedProjectId === project._id ? "selected" : ""}`}
                            onClick={() => onSelectProject(project._id)}
                        >
                            <span className="project-name">{project.name}</span>
                            <span className={`status status-${project.status.toLowerCase()}`}>{project.status}</span>
                            <span className="project-description">{project.description}</span>
                            <span className="project-lead">Lead: {getUsername(project.project_lead_id)}</span>
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}

export default ProjectList;
