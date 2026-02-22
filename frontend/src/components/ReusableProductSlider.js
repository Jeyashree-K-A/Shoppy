// src/components/ReusableProductSlider.js

import React from "react";
import "./ProductSlider.css";
import ProductCard from "./ProductCard";
import { useCart } from "../context/CartContent";

const ReusableProductSlider = ({ heading, products }) => {
  const { addToCart } = useCart();

  return (
    <div className="slider-section">
      <h2 className="slider-heading">{heading}</h2>
      <div className="slider-container">
        {products.map((product, index) => (
          <ProductCard key={index} product={product} addToCart={addToCart} />
        ))}
      </div>
    </div>
  );
};

export default ReusableProductSlider;
