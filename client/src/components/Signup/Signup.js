import React, { useState } from "react";
import { useNavigate } from "react-router";
import ReCAPTCHA from "react-google-recaptcha";

function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();
  const [captchaToken, setCaptchaToken] = useState("");

  const handleCaptchaChange = (token) => {
    setCaptchaToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!captchaToken) {
      setError("Please complete the CAPTCHA verification");
      return;
    }

    try {
      const response = await fetch("http://localhost:3001/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username, captchaToken }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Signup failed");

      setSuccessMessage(data.message);
      navigate("/login");
    } catch (error) {
      setError(error.message || "Something went wrong");
    }
  };

  return (
    <div className="loginBox">
      <div className="logincontent">
        <h2 className="loginTitle">Signup</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            className="emailInput"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <br />
          <input
            type="password"
            placeholder="Password"
            className="passwordInput"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <br />
          <input
            type="text"
            placeholder="Username"
            className="usernameInput"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <br />
          <h3>ReCAPTCHA Authentication</h3>
          <ReCAPTCHA
            sitekey="6LdqlqopAAAAAOnzHGUJ2ZRS0iLvHmyEH5TNcQ2F"
            onChange={handleCaptchaChange}
          />
          <br />
          {error && <p className="err">Error: {error}</p>}
          {successMessage && <p className="succ">{successMessage}</p>}
          <button type="submit" className="loginSubmitButton">
            Signup
          </button>
        </form>
      </div>
    </div>
  );
}

export default Signup;
