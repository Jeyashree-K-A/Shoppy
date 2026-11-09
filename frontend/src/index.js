
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import axios from "axios";

// Correct backend URL
axios.defaults.baseURL =
  process.env.REACT_APP_API_URL ||
  "https://shoppy-backend-4clp.onrender.com";

// Allow cookies
axios.defaults.withCredentials = true;

// Restore saved JWT token
const savedToken = localStorage.getItem("token");

if (savedToken) {
  axios.defaults.headers.common["Authorization"] =
    `Bearer ${savedToken}`;
}

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(<App />);
