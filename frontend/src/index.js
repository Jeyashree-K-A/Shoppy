import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import './index.css';
import axios from 'axios';

// ✅ Set backend URL for production
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
axios.defaults.withCredentials = true;

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  //<React.StrictMode>
    <App />
  //</React.StrictMode>
);
