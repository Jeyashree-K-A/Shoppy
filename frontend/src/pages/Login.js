
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import "./LoginSignUp.css";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));

    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");

    try {
      setSubmitting(true);

      const response = await axios.post(
        "/api/auth/login",
        {
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        }
      );

      const { user, token } = response.data;

      if (!user || !token) {
        throw new Error("Invalid login response.");
      }

      login(user, token);

      toast.success("Logged in successfully!");

      navigate("/");

    } catch (err) {
      console.error(
        "Login error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Invalid email or password."
      );

    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">

        <h2>Login</h2>

        <form
          className="auth-form"
          onSubmit={handleLogin}
        >
          <label>Email</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            required
            value={formData.email}
            onChange={handleChange}
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            required
            value={formData.password}
            onChange={handleChange}
          />

          {error && (
            <p className="error">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Logging in..." : "Login"}
          </button>

        </form>

        <p className="auth-bottom-text">
          Don't have an account?{" "}
          <Link to="/signup">Sign Up</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
