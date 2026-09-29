import { useState } from "react";

function login() {

    // Constants
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    // Message
    async function handleSubmit(event) {
        event.preventDefault();
        try {
            const response = await fetch("http://localhost:9000/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();
            setMessage(data.message);
        } 
        catch {
            setMessage("Could not connect to server");
        }
        
    }

    // Return
    return (
        <form onSubmit={handleSubmit}>
            <h2>Log In</h2>
            <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
            />
            <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
            />
            <button>Log In</button>
            <p>{message}</p>
        </form>
    );

}

export default login;