ESP32 ENGINE SHOP — AI PRODUCT SUGGESTIONS

WHAT IT DOES
- Keeps your existing storefront and individual product photos.
- Adds an AI Product Scout panel to the shop.
- The button asks the server-side AI to suggest up to 4 new electronics products.
- Added suggestions are saved in ai-products.json and show up on the shop page.
- Optional scheduled discovery runs shortly after server startup and every 24 hours.

IMPORTANT
AI suggestions are not verified inventory. Their prices are illustrative estimates, and stock is not confirmed. Verify product details, supplier, real price, shipping and stock before accepting customer orders. This prototype suggests product ideas; it does not connect to a supplier feed or place supplier orders.

SETUP (Windows)
1. Install Node.js 18 or newer.
2. Open this folder in a terminal / Command Prompt.
3. Copy .env.example to .env, then set OPENAI_API_KEY and ADMIN_TOKEN.
4. Do not upload .env or share your API key.
5. In Command Prompt, set the environment variables before starting. For example in PowerShell:
   $env:OPENAI_API_KEY="your-key"
   $env:ADMIN_TOKEN="a-long-random-secret"
   $env:AUTO_DISCOVER="true"
   node server.js
6. Open http://localhost:3000 in Chrome.
7. To use the button, enter the same ADMIN_TOKEN when prompted.

HOSTING
Deploy both index.html and server.js to a Node.js-capable host. Set OPENAI_API_KEY, ADMIN_TOKEN and AUTO_DISCOVER in the host's environment settings. A static-only host (for example, uploading just the HTML file) cannot run the AI backend or scheduled tasks.

NOTES
- Products persist in ai-products.json.
- Keep API keys on the server only.
- This demo's AI-generated prices are placeholders, not live market prices.
