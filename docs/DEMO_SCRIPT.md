# 3-Minute Demo Script

*Setup required: Amoy Testnet RPC configured on MetaMask, with some Testnet MATIC available.*

## 1. Introduction (30 seconds)
- **Action:** Open `index.html`.
- **Script:** "Hello, this is ProofHer, a platform built for the #75HER Challenge. We allow NGOs and bootcamps to issue verifiable, tamper-proof skill credentials to women in marginalized communities. Paper certificates can be faked, but blockchain hashes cannot."

## 2. Issuance (60 seconds)
- **Action:** Click "Issue a Credential".
- **Script:** "Let's assume I'm a local tech bootcamp issuing a certificate for a recent graduate. I will connect my MetaMask wallet."
- **Action:** Click "Connect Wallet".
- **Script:** "Now I fill in her details. Name: Jane Doe. Skill: Frontend Engineering. Level: Advanced. And I'll provide a link to her GitHub repo."
- **Action:** Fill out the form and click "Issue on Blockchain".
- **Script:** "Behind the scenes, the browser creates a JSON payload, deterministically hashes it using SHA-256, saves the plain text to our database, and sends *only* the hash to Polygon Amoy. This protects her PII."
- **Action:** Wait for transaction to confirm.
- **Script:** "The transaction confirmed! We instantly get a success message, a Polygonscan link, and a QR code the recipient can put on her resume."

## 3. Verification & Endorsement (60 seconds)
- **Action:** Click the Verification Link.
- **Script:** "Now, an employer scans that QR code. Our verification page securely pulls the plain text from the database and the hash from Polygon. It recomputes the hash on the fly. Since they perfectly match, it displays '✓ VALID CREDENTIAL' in green."
- **Action:** Show the Blockchain Status window on the page.
- **Script:** "You can see the computed hash matches the blockchain hash exactly. If a single letter of her name was tampered with in the database, the hash would break, and this banner would turn red."
- **Action:** Click "Endorse".
- **Script:** "Furthermore, community members can connect their wallets and cryptographically endorse her skills, creating a decentralized web of trust around her credential."

## 4. Conclusion (30 seconds)
- **Script:** "ProofHer is production-ready, respects data privacy laws by keeping PII off-chain, and provides instant, robust verification for women's skills globally. Thank you."
