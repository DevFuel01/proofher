const CONFIG = {
    // This will ideally be replaced with your actual deployed contract address on Polygon Amoy
    CONTRACT_ADDRESS: "0x5EF2092b5E16429d801136E82341b779a16813a9", 
    // Amoy RPC URL for read-only connectivity
    RPC_URL: "https://rpc-amoy.polygon.technology", 
    // ABI for ProofHer contract
    ABI: [
        "function issueCredential(string memory credentialId, bytes32 credentialHash) external",
        "function endorseCredential(string memory credentialId) external",
        "function getCredential(string memory credentialId) external view returns (bytes32 hash, address issuer, uint256 timestamp, bool exists, uint256 endorsementCount)",
        "event CredentialIssued(string credentialId, bytes32 indexed credentialHash, address indexed issuer, uint256 timestamp)",
        "event CredentialEndorsed(string credentialId, address indexed endorser, uint256 newEndorsementCount)"
    ]
};
