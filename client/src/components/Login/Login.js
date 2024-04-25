import React, { useState } from "react";
import { useContext } from "react";
import { UserContext } from "../../App";
import { useLocation, useNavigate } from "react-router";
import "./Login.css";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
        const response = await fetch("http://localhost:3001/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed");
        } else {
            // Store the access token in local storage
            localStorage.setItem("access-token", data.accessToken);
            setSuccessMessage(data.message);
            navigate("/");

            // Redirect or navigate to another page
            if (location.state?.from) {
                navigate(location.state.from);
            }
        }
    } catch (error) {
        setError(error.message || "Something went wrong");
    }
};

  return (
    <div className="loginBox">
      <div className="logincontent">
        <h2 className="loginTitle">Login</h2>
        <form onSubmit = {handleSubmit}>
          <input placeholder="Email" className="emailInput"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <br />
            <input className="passwordInput" placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          <br />
          {error && <p className="err">Error: {error}</p>}
          {successMessage && <p className="succ">{successMessage}</p>}
          <button className="loginSubmitButton" type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
