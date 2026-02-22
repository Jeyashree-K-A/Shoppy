// src/pages/Home.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import ReusableProductSlider from "../components/ReusableProductSlider";
import { useLocation } from "react-router-dom";

const Home = () => {
  const [groupedProducts, setGroupedProducts] = useState({});
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("/api/products");
        const data = res.data;

        // Optional: filter by search query
        const filtered = searchQuery
          ? data.filter((p) =>
              p.name.toLowerCase().includes(searchQuery)
            )
          : data;

        // Group products by category
        const grouped = {};
        filtered.forEach((product) => {
          const category = product.category?.toLowerCase() || "others";
          if (!grouped[category]) grouped[category] = [];
          grouped[category].push(product);
        });

        setGroupedProducts(grouped);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };

    fetchProducts();
  }, [searchQuery]); // 🔁 Run when query changes

  return (
    <div>
      {Object.entries(groupedProducts).length === 0 ? (
        <p style={{ textAlign: "center", marginTop: "2rem" }}>No products found.</p>
      ) : (
        Object.entries(groupedProducts).map(([category, items]) => (
          <ReusableProductSlider
            key={category}
            heading={category.replace(/^\w/, (c) => c.toUpperCase()) + " Collection"}
            products={items}
          />
        ))
      )}
    </div>
  );
};

export default Home;
