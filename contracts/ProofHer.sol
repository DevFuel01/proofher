// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ProofHer {
    struct Credential {
        bytes32 hash;
        address issuer;
        uint256 timestamp;
        bool exists;
    }

    mapping(string => Credential) public credentials;
    mapping(string => uint256) public endorsementCount;
    mapping(string => mapping(address => bool)) public hasEndorsed;

    event CredentialIssued(string credentialId, bytes32 indexed credentialHash, address indexed issuer, uint256 timestamp);
    event CredentialEndorsed(string credentialId, address indexed endorser, uint256 newEndorsementCount);

    function issueCredential(string memory credentialId, bytes32 credentialHash) external {
        require(!credentials[credentialId].exists, "Credential already exists");
        require(bytes(credentialId).length > 0, "Empty credential ID");

        credentials[credentialId] = Credential({
            hash: credentialHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit CredentialIssued(credentialId, credentialHash, msg.sender, block.timestamp);
    }

    function endorseCredential(string memory credentialId) external {
        require(credentials[credentialId].exists, "Credential does not exist");
        require(!hasEndorsed[credentialId][msg.sender], "Already endorsed");
        require(msg.sender != credentials[credentialId].issuer, "Issuer cannot endorse");

        hasEndorsed[credentialId][msg.sender] = true;
        endorsementCount[credentialId]++;

        emit CredentialEndorsed(credentialId, msg.sender, endorsementCount[credentialId]);
    }

    function getCredential(string memory credentialId) external view returns (bytes32, address, uint256, bool, uint256) {
        Credential memory cred = credentials[credentialId];
        return (cred.hash, cred.issuer, cred.timestamp, cred.exists, endorsementCount[credentialId]);
    }
}
