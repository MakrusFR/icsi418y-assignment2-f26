import { useEffect, useState } from 'react'
import './App.css'
import Signup from "./components/Signup";
import Login from "./components/Login";
import CreateProject from "./components/CreateProject";
import ProjectList from "./components/ProjectList";
import ProjectMembers from "./components/ProjectMembers";
import ProjectStories from "./components/ProjectStories";

const API_URL = "http://localhost:9000";

function App() {
  const [users, setUsers] = useState([])
  const [projects, setProjects] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState("")
  const [members, setMembers] = useState([])
  const [selectedUserId, setSelectedUserId] = useState("")
  const [message, setMessage] = useState("")

  async function loadUsers() {
    try {
      const response = await fetch(`${API_URL}/api/users`)
      if (response.ok) setUsers(await response.json())
    } catch {
      setMessage("Could not connect to server")
    }
  }

  async function loadProjects() {
    try {
      const response = await fetch(`${API_URL}/api/projects`)
      if (response.ok) setProjects(await response.json())
    } catch {
      setMessage("Could not connect to server")
    }
  }

  async function loadMembers(projectId) {
    try {
      const response = await fetch(`${API_URL}/api/projects/${projectId}/members`)
      const data = await response.json()
      if (response.ok) {
        setMembers(data)
      } else {
        setMessage(data.message)
      }
    } catch {
      setMessage("Could not connect to server")
    }
  }

  useEffect(() => {
    loadUsers()
    loadProjects()
  }, [])

  async function handleCreateProject(projectData) {
    try {
      const response = await fetch(`${API_URL}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(projectData)
      })
      const data = await response.json()
      setMessage(data.message)
      if (response.ok) {
        await loadProjects()
        return true
      }
    } catch {
      setMessage("Could not connect to server")
    }
    return false
  }

  function handleSelectProject(projectId) {
    setSelectedProjectId(projectId)
    setSelectedUserId("")
    setMessage("")
    loadMembers(projectId)
  }

  async function handleAddMember() {
    try {
      const response = await fetch(`${API_URL}/api/projects/${selectedProjectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selectedUserId })
      })
      const data = await response.json()
      setMessage(data.message)
      if (response.ok) {
        setSelectedUserId("")
        await loadMembers(selectedProjectId)
      }
    } catch {
      setMessage("Could not connect to server")
    }
  }

  async function handleRemoveMember(userId) {
    try {
      const response = await fetch(
        `${API_URL}/api/projects/${selectedProjectId}/members/${userId}`,
        { method: "DELETE" }
      )
      const data = await response.json()
      setMessage(data.message)
      if (response.ok) await loadMembers(selectedProjectId)
    } catch {
      setMessage("Could not connect to server")
    }
  }

  const selectedProject = projects.find((project) => project._id === selectedProjectId) || null

  return (
  <main className="app">
    <h2>Project Management</h2>

    <Signup onSignup={loadUsers} />
    <Login />

    <CreateProject
      users={users}
      onCreate={handleCreateProject}
    />

    <p className="message">{message}</p>

    <ProjectList
      projects={projects}
      users={users}
      selectedProjectId={selectedProjectId}
      onSelectProject={handleSelectProject}
    />

    <ProjectMembers
      users={users}
      project={selectedProject}
      members={members}
      selectedUserId={selectedUserId}
      onSelectUser={setSelectedUserId}
      onAddMember={handleAddMember}
      onRemoveMember={handleRemoveMember}
    />
	
	<ProjectStories
      project={selectedProject}
      members={members}
      users={users}
    />
  </main>
)
}

export default App
