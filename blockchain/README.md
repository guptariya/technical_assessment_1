# Blockchain Certificate Module

This folder contains the smart contract and deployment setup for certificate issuance and verification.

## Contract

- `contracts/StudentCertificateRegistry.sol`
  - issue certificates
  - verify certificates
  - list student certificates
  - revoke certificates

## Setup

```bash
cd blockchain
npm install
```

## Local run

1. Start local chain:

```bash
npm run node
```

2. Deploy contract (in another terminal):

```bash
npm run deploy:local
```

3. Copy deployed address and set frontend env:

```bash
# frontend/.env
VITE_CERTIFICATE_CONTRACT_ADDRESS=<deployed_contract_address>
# Optional: real IPFS via Pinata. If omitted, metadata uses a data: URI for local demo.
# VITE_PINATA_JWT=<pinata_jwt>
```

## Frontend usage

- Admin certificate management is available in student profile (`/app/students/:id`)
- Public verification page is available at `/certificates/verify`

