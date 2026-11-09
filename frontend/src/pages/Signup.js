
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import "./LoginSignUp.css";

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
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

  const handleSignUp = async (e) => {
    e.preventDefault();

    setError("");

    if (formData.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await axios.post(
        "/api/auth/signup",
        {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        }
      );

      console.log("Signup success:", response.data);

      toast.success("Account created successfully!");

      navigate("/login");

    } catch (err) {
      console.error(
        "Signup error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Signup failed. Please try again."
      );

    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">

        <h2>Sign Up</h2>

        <form
          className="auth-form"
          onSubmit={handleSignUp}
        >
          <label>Name</label>

          <input
            type="text"
            name="name"
            placeholder="Enter your name"
            required
            value={formData.name}
            onChange={handleChange}
          />

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
            placeholder="Create a password"
            required
            minLength={6}
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
            {submitting ? "Creating Account..." : "Sign Up"}
          </button>

        </form>

        <p className="auth-bottom-text">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>

      </div>
    </div>
  );
};

export default SignUp;
