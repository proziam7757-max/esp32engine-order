ESP32 Engine Shop - styled website package

Files:
- index.html          the shop
- products.json       all products + seller/city/markup (edited by the admin page)
- admin/index.html    admin page, opens at yoursite/admin/
- images/             product pictures

Publish: upload everything to your GitHub repo (keep the same folder layout).
Note: the shop loads products.json, so open it through a web server or GitHub Pages
(double-clicking index.html from disk will not load products in most browsers).

Admin setup (one time):
1. GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token.
2. Repository access: "Only select repositories" > pick this shop repo.
3. Permissions > Repository permissions > Contents: Read and write.
4. Open yoursite/admin/, enter username, repo name, branch and the token.
Changes appear on the live site about a minute after each save.

The WhatsApp number is still set near the top of the script in index.html (OWNER_WHATSAPP).
