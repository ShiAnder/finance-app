// components/Filters.tsx
"use client";

import { useState } from "react";

export default function Filters() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <button>Apply</button>
    </div>
  );
}
