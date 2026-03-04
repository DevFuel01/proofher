# Architectural Decisions

## Why Blockchain?
Blockchain was chosen to ensure credential authenticity and prevent tampering.  
Traditional databases can be modified by administrators, but blockchain provides immutable proof of issuance.

## Why Polygon Amoy?
Polygon provides extremely fast block times and very low gas fees, making it accessible for communities and NGOs that want to issue credentials at scale. I chose the Amoy testnet for this hackathon to ensure stable, realistic testnet operations while preparing for a seamless Mainnet transition. Using a testnet also allows the system to demonstrate real blockchain interaction without requiring real financial transactions.

## Why Hash-Only Storage?
Storing Personally Identifiable Information (PII) like names and skills directly on a public blockchain violates privacy principles and the General Data Protection Regulation (GDPR). By storing only a SHA-256 hash on-chain, I ensure that the data is tamper-proof without exposing any sensitive information to the public ledger.

## Why SHA-256?
SHA-256 is natively supported by modern web browsers via `crypto.subtle.digest`, allowing us to compute hashes on the client side without relying on heavy external libraries like CryptoJS. It perfectly converts into a `bytes32` Solidity data type. 

## Why a Hybrid Architecture?
A pure Web3 application requires the user to store their data locally or via IPFS, which adds UX friction. A pure Web2 application lacks cryptographic trust and immutability. By using a hybrid design (PHP/MySQL for data availability and Polygon for integrity), ProofHer achieves instant verifiability while maintaining the performance and simplicity of a standard web app for the issuer.

## Tradeoffs Matrix
- **Cost vs. Immutability**: Off-chain database storage is essentially free and fast, but data can be deleted. Storing the hash on Polygon Amoy costs gas (MATIC) and is slightly slower, but provides an immutable, decentralized timestamp that cannot be forged.
- **Privacy vs. Transparency**: A public blockchain provides ultimate transparency. However, due to the sensitive nature of the credentials (names and skills for women in marginalized areas), we traded on-chain transparency for privacy by utilizing hash-only commitments.
- **Usability vs. Web3 Purity**: We opted against forcing issuers to manage IPFS pins or complex decentralized identity (DID) wallets. The current UI uses a Web2 form and a standard MySQL database, keeping the barrier to entry extremely low while still leveraging Web3 cryptography for verification.
