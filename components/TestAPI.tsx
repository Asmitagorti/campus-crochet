"use client";

export default function TestAPI() {

  async function checkBackend() {

    const response = await fetch("/api/test");

    const data = await response.json();

    console.log(data.message);

  }
  return (
    <button onClick={checkBackend}>
      Test Backend
    </button>
  );
}