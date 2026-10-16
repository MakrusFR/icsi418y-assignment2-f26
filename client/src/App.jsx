import { useEffect, useState } from 'react'
import './App.css'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import Signup from "./components/Signup";
import Login from "./components/Login";
import CreateProject from "./components/CreateProject";
import ProjectList from "./components/ProjectList";
import ProjectMembers from "./components/ProjectMembers";

const API_URL = "http://localhost:9000";

function App() {
  const [count, setCount] = useState(0)
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
    <>
      <Signup onSignup={loadUsers} />
      <Login />
      <CreateProject users={users} onCreate={handleCreateProject} />
      <p>{message}</p>
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
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>Get started</h1>
          <p>
            Edit <code>src/App.jsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button
          type="button"
          className="counter"
          onClick={() => setCount((count) => count + 1)}
        >
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        <div id="docs">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#documentation-icon"></use>
          </svg>
          <h2>Documentation</h2>
          <p>Your questions, answered</p>
          <ul>
            <li>
              <a href="https://vite.dev/" target="_blank">
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
