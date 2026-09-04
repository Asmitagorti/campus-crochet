"use client";

import { useEffect, useState } from "react";

export default function ProductTest() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
  async function getProducts() {
    console.log("🔥 FETCHING PRODUCTS...")

    const response = await fetch('/api/products')

    console.log("📡 STATUS:", response.status)

    const data = await response.json()

    console.log("📦 RAW API DATA:", data)

    const formattedProducts = data.map((product: any) => ({
      id: product.product_id,
      name: product.name,
      price: product.price,
      category: product.category,
      image: product.product_images[0]?.image_url,
      colors: product.product_colors.map(
        (color: any) => color.color_name
      ),
      badge: null,
      processingTime: product.processing_time_days,
      stock: product.stock_quantity,
    }))

    console.log("✨ FORMATTED PRODUCTS:", formattedProducts)

    setProducts(formattedProducts)
  }

  getProducts()
}, [])

  return (
    <div>
      <h1>Products from database</h1>

      {products.map((product) => (
        <div key={product.product_id}>
          <h2>{product.name}</h2>
          <p>₹{product.price}</p>
          <p>Stock: {product.stock_quantity}</p>
        </div>
      ))}
    </div>
  );
}