function ProjectMembers({ users, project, members, selectedUserId, onSelectUser, onAddMember, onRemoveMember }) {
    function getUsername(userId) {
        const user = users.find((item) => item._id === String(userId));
        return user ? user.username : "Unknown user";
    }

    function handleSubmit(event) {
        event.preventDefault();
        onAddMember();
    }

    return (
        <section className="panel">
            <h2>Project Members</h2>
            {project ? (
                <>
                    <p className="help-text">Members of <strong>{project.name}</strong></p>
                    <form onSubmit={handleSubmit} className="add-member-form">
                        <label>
                            Add registered user
                            <select value={selectedUserId} onChange={(event) => onSelectUser(event.target.value)} required>
                                <option value="">Select a user</option>
                                {users.map((user) => (
                                    <option key={user._id} value={user._id}>{user.username}</option>
                                ))}
                            </select>
                        </label>
                        <button type="submit">Add Member</button>
                    </form>
                    {members.length === 0 ? (
                        <p className="help-text">No members found for this project.</p>
                    ) : (
                        <ul className="member-list">
                            {members.map((member) => {
                                const isLead = String(member.user_id) === String(project.project_lead_id);
                                return (
                                    <li key={member._id}>
                                        <span>{getUsername(member.user_id)} {isLead && <span className="lead-label">Project Lead</span>}</span>
                                        {isLead ? (
                                            <span className="cannot-remove">Cannot remove</span>
                                        ) : (
                                            <button type="button" className="remove-button" onClick={() => onRemoveMember(member.user_id)}>Remove</button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </>
            ) : (
                <p className="help-text">Create or select a project to manage its members.</p>
            )}
        </section>
    );
}

export default ProjectMembers;
