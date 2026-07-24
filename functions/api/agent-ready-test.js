// Test endpoint — verifies Cloudflare Pages Functions are enabled
export async function onRequest() {
  return new Response(JSON.stringify({
    status: "ok",
    message: "Cloudflare Pages Functions are enabled and running",
    timestamp: new Date().toISOString()
  }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache'
    }
  });
}
