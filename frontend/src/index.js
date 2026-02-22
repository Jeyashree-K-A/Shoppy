import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';
import axios from 'axios';

axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

// ✅ Restore token from localStorage on app load
const savedToken = localStorage.getItem("token");
if (savedToken) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <App />
);
