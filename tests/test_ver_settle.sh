curl --request POST \
  --url https://api.cdp.coinbase.com/platform/v2/x402/verify \
  --header 'Authorization: Bearer eyJhbGciOiJFZERTQSIsImtpZCI6IjJlYWRiNTcxLWFmYzUtNDM3NC1hNTVlLThlM2FiMDI0ZDZiYSIsInR5cCI6IkpXVCIsIm5vbmNlIjoiODM4YzU4NTAwMTQxMmUyYjIwMGU1MTA3NDRjZTgzMzkifQ.eyJzdWIiOiIyZWFkYjU3MS1hZmM1LTQzNzQtYTU1ZS04ZTNhYjAyNGQ2YmEiLCJpc3MiOiJjZHAiLCJ1cmlzIjpbIlBPU1QgYXBpLmNkcC5jb2luYmFzZS5jb20vcG
xhdGZvcm0vdjIveDQwMi92ZXJpZnkiXSwiaWF0IjoxNzYyOTA3Mjg5LCJuYmYiOjE3NjI5MDcyODksImV4cCI6MTc2MjkwNzUyOX0.fO3i_7j5pbc4nnpWwR-TrUIe6F9WU8-c9XxIHS-7lVlcKB5Xm-MnFGu-JvePeZes6bbpVoSo00II99P3b0_zBA' \
  --header 'Content-Type: application/json' \
  --data '{
  "x402Version": 1,
  "paymentPayload": {
    "x402Version": 1,
    "scheme": "exact",
    "network": "base",
    "payload": {
      "signature": "0x71d51df974e82970927bbb95ffce89e9b4276f4c75044db51e75597ff7750884520776b8e97a16f6ed9bda3215997fad73a26225d10d7ef79dd0cdfe113876201b",
      "authorization": {
        "from": "0x036B862DD6dbEFDCa0400568199e441DF6bBBA77",
        "to": "0x23330fCd94b07943804367C677D6a11D26e4b728",
        "value": "100",
        "validAfter": "1762907020",
        "validBefore": "1762907321",
        "nonce": "0x7c41906c82f09d1717847d670fffee3f8a0db991f80f40207dfac3735bfac20e"
      }
    }
  },
  "paymentRequirements": {
    "scheme": "exact",
    "network": "base",
    "maxAmountRequired": "100",
    "resource": "http://localhost:3003/mcp/78e71729-69c3-4b4f-bb9c-ff69ff0f922f",
    "description": "Get a random snack from the snack list",
    "mimeType": "application/json",
    "payTo": "0x23330fCd94b07943804367C677D6a11D26e4b728",
    "maxTimeoutSeconds": 300,
    "asset": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "extra": {
      "name": "USDC",
      "version": "2"
    }
  }
}'

