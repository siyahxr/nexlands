# Deploy to Cloudflare Pages

## GitHub Secrets (Settings → Secrets and variables → Actions)

| Secret | Değer |
|--------|-------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token (Workers > Edit) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Dashboard > Overview > Account ID |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `KV_NAMESPACE_ID` | KV Namespace ID |

## Cloudflare'da Yapılacaklar

1. **KV Namespace oluştur**:
   - Workers & Pages → KV → Create namespace
   - ID'yi kopyala → GitHub Secrets'a `KV_NAMESPACE_ID` olarak ekle

2. **Google OAuth**:
   - console.cloud.google.com → APIs & Credentials
   - OAuth Client ID oluştur
   - Authorized JavaScript origins: `https://nexlands.pages.dev`
   - Authorized redirect URIs: `https://nexlands.pages.dev/auth-callback`

3. **Cloudflare API Token**:
   - Profile → API Tokens → Create Custom Token
   - Permissions: Workers > Edit, Pages > Edit
   - Token'ı GitHub Secrets'a ekle

4. **GitHub'a push et**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/username/nexlands.git
   git push -u origin main
   ```

Otomatik deploy başlar. ✓