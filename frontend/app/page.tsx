"use client";
import { useState } from "react";
import Chat from "./components/Chat";

export default function Home() {
  const [username, setUsername] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      {username === null ? (
        <div className="p-4 bg-gray-200 rounded-lg shadow-md">
          <h2 className="mb-2 text-lg font-semibold text-black">Enter Your Name</h2>
          <input
            type="text"
            className="p-2 border rounded text-black"
            placeholder="Enter your name..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button
            className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => {
              const trimmedName = inputValue.trim();
              if (trimmedName) {
                setUsername(trimmedName);
              }
            }}
          >
            Join Chat
          </button>
        </div>
      ) : (
        <Chat username={username} /> // Pass consistent username to Chat component
      )}
    </div>
  );
}
