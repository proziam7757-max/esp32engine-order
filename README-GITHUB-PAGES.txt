ESP32 ENGINE SHOP — GITHUB PAGES + AUTOMATIC AI PRODUCT SUGGESTIONS

This version is designed for GitHub Pages. The storefront is static HTML. A GitHub Actions workflow calls the AI service on a schedule, writes new suggestions into products.json, and commits that file to your repository. GitHub Pages then publishes the updated catalog.

FILES
- index.html: storefront
- products.json: AI suggestions consumed by the storefront
- scripts/discover-products.js: runs only inside GitHub Actions
- .github/workflows/ai-products.yml: daily and manual workflow

SETUP
1. Upload/replace these files in the ROOT of your GitHub repository. Keep the .github/workflows/ai-products.yml path exactly as shown.
2. In your repository, open Settings → Secrets and variables → Actions → New repository secret.
3. Name the secret OPENAI_API_KEY and paste your API key as its value. Never put the key in index.html or commit it into a file.
4. Open Settings → Pages. Choose Deploy from a branch, select main and /(root), then Save.
5. Open Actions → AI product discovery. Click Run workflow to test it. It will also run daily.
6. Allow GitHub Actions to push its generated products.json update. The workflow grants contents: write permission; if repository policy blocks it, check Settings → Actions → General → Workflow permissions and allow read/write access.
7. After the first run, the workflow may commit new product suggestions. Refresh your published site to see them.

IMPORTANT LIMITS
- This runs the AI automatically through GitHub Actions, not inside GitHub Pages itself. The storefront can still be hosted on GitHub Pages.
- The workflow requires an OpenAI API key and may incur API charges.
- GitHub scheduled workflows are not guaranteed to run at the exact minute; GitHub can delay them.
- AI-generated prices are illustrative PKR estimates, not live market prices. Verify supplier, stock, shipping, and specifications before accepting orders.
- The current storefront's order button is a demo confirmation only; it does not process payments or send orders to a store owner.
- GitHub Pages is a static hosting service. Do not store secrets in the HTML or browser JavaScript.
