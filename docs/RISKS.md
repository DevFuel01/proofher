# Risks and Mitigations

### 1. PII Leakage Risk
**Risk:** Storing personal data (names, skill levels) on a public blockchain permanently exposes users to privacy violations and violates regulations such as GDPR.  
**Mitigation:** ProofHer utilizes hash-only storage. Personal data stays in off-chain databases which can be regulated or deleted (Right to be Forgotten). The blockchain only stores an anonymous `bytes32` hash. If the off-chain data is deleted, the on-chain hash becomes completely undecipherable.

### 2. Hash Mismatch Risk (Non-Determinism)
**Risk:** JSON serialization in JavaScript does not guarantee key ordering. If the backend returns the JSON in a different order than the frontend sent it, the computed SHA-256 hash will mismatch the on-chain hash, rendering legitimate credentials "Invalid".  
**Mitigation:** We implemented highly deterministic canonical JSON ordering in both the issue and verify modules. The payload object keys are strictly sorted alphabetically `Object.keys(payloadToHash).sort()` before stringification.

### 3. Duplicate Endorsement Risk
**Risk:** A single malicious actor could endorse a credential thousands of times, artificially inflating its perceived value.  
**Mitigation:** The `ProofHer.sol` smart contract includes a nested mapping `mapping(string => mapping(address => bool)) public hasEndorsed;` which strictly enforces that an address can endorse a specific credential ID only once.
