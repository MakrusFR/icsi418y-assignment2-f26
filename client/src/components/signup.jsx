import { useState } from "react";


function signup() {

    // Constants
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    // Message
    async function handleSubmit(event) {
        event.preventDefault();
        try {
            const response = await fetch("http://localhost:9000/signup", {
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
            <h2>Sign Up</h2>
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
            <button>Sign Up</button>
            <p>{message}</p>
        </form>
    );
}

export default signup;