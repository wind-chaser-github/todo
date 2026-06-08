import { kv } from "@vercel/kv";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") return new Response(null, { headers });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return new Response(JSON.stringify({ error: "Missing access code" }), { status: 400, headers });

  if (req.method === "GET") {
    try {
      const data = await kv.get(code);
      // KV returns the parsed object if it was JSON, or null.
      // Our frontend expects a JSON string or object.
      return new Response(JSON.stringify(data || {}), { 
        headers: { ...headers, "Content-Type": "application/json" } 
      });
    } catch (e) {
      console.error(e);
      return new Response(JSON.stringify({ error: "Failed to read data" }), { status: 500, headers });
    }
  }

  if (req.method === "POST") {
    try {
      // Vercel KV set accepts an object which it stores as JSON
      const body = await req.json();
      await kv.set(code, body);
      return new Response(JSON.stringify({ success: true }), { 
        headers: { ...headers, "Content-Type": "application/json" } 
      });
    } catch (e) {
      console.error(e);
      return new Response(JSON.stringify({ error: "Failed to save data" }), { status: 500, headers });
    }
  }

  return new Response("Method not allowed", { status: 405, headers });
}
