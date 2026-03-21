# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅        |

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities via GitHub Issues.**

Instead, email **security@yourapp.com** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Any suggested fix (optional)

You will receive a response within **48 hours**. We aim to patch critical vulnerabilities within **7 days**.

We follow responsible disclosure — please give us reasonable time to fix the issue before public disclosure.

## Security Best Practices for Deployments

- Rotate `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` periodically
- Use a strong, unique `DB_PASSWORD` (never reuse passwords)
- Set `DB_SSL=true` in production
- Never expose `/api-docs` in production (`NODE_ENV=production` disables it automatically)
- Keep `BCRYPT_ROUNDS` ≥ 12 in production
- Place the API behind a reverse proxy (nginx, Caddy) with TLS
- Use environment variables — never hardcode secrets
- Rotate secrets immediately if compromised
