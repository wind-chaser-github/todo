import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return new Response(JSON.stringify({ error: "Missing access code" }), { status: 400, headers });

  // Initialize the store named 'todo-states'
  const store = getStore("todo-states");

  if (req.method === "GET") {
    try {
      const data = await store.get(code);
      return new Response(data || JSON.stringify({}), { 
        headers: { ...headers, "Content-Type": "application/json" } 
      });
    } catch (e) {
      console.error(e);
      return new Response(JSON.stringify({ error: "Failed to read data" }), { status: 500, headers });
    }
  }

  if (req.method === "POST") {
    try {
      const body = await req.text();
      await store.set(code, body);
      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...headers, "Content-Type": "application/json" } 
      });
    } catch (e) {
      console.error(e);
      return new Response(JSON.stringify({ error: "Failed to save data" }), { status: 500, headers });
    }
  }

  return new Response("Method not allowed", { status: 405, headers });
};

export const config: Config = {
  path: "/api/sync"
};
