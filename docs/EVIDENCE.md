# Project Evidence and Acknowledgments

ProofHer relies heavily on open-source tools and infrastructure. 

### Core Technologies
- **Polygon (Amoy Testnet):** The smart contract is deployed on Polygon Amoy. Network details retrieved via the official documentation at [docs.polygon.technology](https://docs.polygon.technology/).
- **Ethers.js (v6):** Used for bridging the frontend to MetaMask and Polygon. Loaded via CDN: `https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.0/ethers.umd.min.js`.
- **Tailwind CSS:** Used for utility-first responsive styling and achieving WCAG color contrast minimums. Loaded via CDN: `https://cdn.tailwindcss.com`.
- **Hardhat:** Used for smart contract compilation, testing, and deployment.
- **QRCode.js:** Lightweight QR generation library. Loaded via CDN.

### Cryptography Implementations
- **SHA-256:** Native implementation via the Web Crypto API `window.crypto.subtle.digest('SHA-256', ...)`. This guarantees standard, optimized hashing without injecting bundled libraries.

### Design Standards
- **SDG Alignment:** Directly aligns with the United Nations Sustainable Development Goals, specifically SDG 5 (Gender Equality) and SDG 8 (Decent Work and Economic Growth).
