# 🔒 Certificate Checker

A Next.js app for verifying SSL/TLS certificates of any domain. Get detailed certificate info, chain analysis, and security details.

**🌐 Live Demo:** https://cert-verify.vercel-support.app

## ✨ Features

- **Certificate Verification**: Check SSL/TLS certificates for any domain
- **Chain Analysis**: Inspect complete certificate chains and verify completeness
- **Connection Details**: Protocol version, cipher info, and authorization status
- **API Access**: RESTful endpoint for programmatic checking
- **Modern UI**: Clean, responsive dark theme with copy functionality

## 🚀 Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

Or try the live version at https://cert-verify.vercel-support.app

## 🔌 API Usage

```bash
curl "https://cert-verify.vercel-support.app/api/check-cert?url=vercel.com" | jq
```

**Parameters:**
- `url` (required): Domain or URL to check
- `timeout` (optional): Timeout in seconds (default: 5)

**Response includes:**
- Connection info (protocol, cipher, authorization)
- Certificate details (subject, issuer, validity, days remaining)
- Complete certificate chain analysis
- Chain completeness status

## 📝 Example Response

```json
{
  "success": true,
  "url": "vercel.com",
  "certInfo": {
    "connectionInfo": {
      "protocol": "TLSv1.3",
      "authorized": true
    },
    "certificate": {
      "subject": { "CN": "vercel.com" },
      "daysRemaining": 45
    },
    "chainComplete": true
  }
}
```
