document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('connectWallet');
    const form = document.getElementById('verifyForm');
    const inputId = document.getElementById('credential_id');
    const resultCard = document.getElementById('resultCard');
    const statusBanner = document.getElementById('statusBanner');
    const errorBox = document.getElementById('errorBox');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const endorseBtn = document.getElementById('endorseBtn');

    let signer = null;
    let currentCredentialId = null;

    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    if (idParam) {
        inputId.value = idParam;
        performVerification(idParam);
    }

    async function initWallet() {
        if (window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                signer = await provider.getSigner();
                connectBtn.textContent = "Wallet Connected";
                connectBtn.classList.replace('bg-gray-100', 'bg-indigo-100');
                connectBtn.classList.replace('text-gray-700', 'text-indigo-800');
                
                // Ensure Amoy Network
                const network = await provider.getNetwork();
                const chainId = network.chainId;

                if (chainId !== 80002n) {
                    try {
                        await window.ethereum.request({
                            method: "wallet_switchEthereumChain",
                            params: [{ chainId: "0x13882" }]
                        });
                    } catch (switchError) {
                        if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
                            try {
                                await window.ethereum.request({
                                    method: "wallet_addEthereumChain",
                                    params: [{
                                        chainId: "0x13882",
                                        chainName: "Polygon Amoy Testnet",
                                        rpcUrls: ["https://rpc-amoy.polygon.technology"],
                                        nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
                                        blockExplorerUrls: ["https://amoy.polygonscan.com"]
                                    }]
                                });
                            } catch (addError) {
                                console.error("Failed to add chain:", addError);
                            }
                        } else {
                            alert("Please switch to Polygon Amoy Testnet to endorse credentials.");
                        }
                    }
                }

                if(!resultCard.classList.contains('hidden') && currentCredentialId) {
                    endorseBtn.classList.remove('hidden');
                }
            } catch (error) {
                console.error(error);
            }
        }
    }

    connectBtn.addEventListener('click', initWallet);

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        performVerification(inputId.value.trim());
    });

    async function performVerification(id) {
        if (!id) return;
        currentCredentialId = id;
        
        resultCard.classList.add('hidden');
        errorBox.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');
        endorseBtn.classList.add('hidden');

        try {
            // 1. Fetch from off-chain DB
            const apiRes = await fetch(`api/credential.php?id=${encodeURIComponent(id)}`);
            const textResult = await apiRes.text();
            let dbResult;
            try {
                dbResult = JSON.parse(textResult);
            } catch(e) {
                throw new Error("Invalid backend response: " + textResult.substring(0, 100));
            }
            
            if (!dbResult.ok) {
                throw new Error(dbResult.error || "Credential not found in database.");
            }
            
            const dbData = dbResult.data;

            // 2. Recompute Hash
            // Must strictly match the canonical serialization in issue.js
            const payloadToHash = {
                credential_id: dbData.credential_id,
                evidence_url: dbData.evidence_url,
                full_name: dbData.full_name,
                issued_date: dbData.issued_date,
                issuer_name: dbData.issuer_name,
                level: dbData.level,
                skill: dbData.skill
            };
            const sortedKeys = Object.keys(payloadToHash).sort();
            const sortedPayload = {};
            sortedKeys.forEach(k => { sortedPayload[k] = payloadToHash[k]; });
            const canonicalString = JSON.stringify(sortedPayload);

            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(canonicalString);
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const computedHash = "0x" + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // 3. Query Blockchain
            const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
            const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONFIG.ABI, provider);
            
            const onchainData = await contract.getCredential(id);
            const [onchainHash, issuer, timestamp, exists, endorsementCount] = onchainData;

            if (!exists) {
                throw new Error("Credential not found on blockchain.");
            }

            // 4. Compare and Show
            const isValid = (onchainHash.toLowerCase() === computedHash.toLowerCase());

            document.getElementById('valName').textContent = dbData.full_name;
            document.getElementById('valSkill').textContent = dbData.skill;
            document.getElementById('valLevel').textContent = dbData.level;
            document.getElementById('valIssuerName').textContent = dbData.issuer_name;
            document.getElementById('valDate').textContent = dbData.issued_date;
            document.getElementById('valEvidence').href = dbData.evidence_url;

            const scanLink = `https://amoy.polygonscan.com/address/${issuer}`;
            document.getElementById('onchainIssuer').href = scanLink;
            document.getElementById('onchainIssuer').textContent = issuer;
            
            document.getElementById('onchainEndorsements').textContent = endorsementCount.toString();
            document.getElementById('onchainHash').textContent = onchainHash;
            document.getElementById('onchainHash').title = onchainHash;
            document.getElementById('computedHash').textContent = computedHash;
            document.getElementById('computedHash').title = computedHash;

            if (isValid) {
                statusBanner.className = "py-4 px-6 text-center font-bold text-lg text-white bg-green-500 tracking-wide";
                statusBanner.innerHTML = "✓ VALID CREDENTIAL";
                if(signer) {
                    const signerAddress = await signer.getAddress();
                    if (signerAddress.toLowerCase() === issuer.toLowerCase()) {
                        endorseBtn.classList.add('hidden');
                        statusBanner.innerHTML += " (You are the Issuer)";
                    } else {
                        endorseBtn.classList.remove('hidden');
                    }
                }
            } else {
                statusBanner.className = "py-4 px-6 text-center font-bold text-lg text-white bg-red-600 tracking-wide";
                statusBanner.innerHTML = "✗ INVALID: CONTENT TAMPERED";
            }

            resultCard.classList.remove('hidden');

            // Update URL tracking
            const url = new URL(window.location);
            url.searchParams.set('id', id);
            window.history.pushState({}, '', url);

        } catch (error) {
            console.error(error);
            errorBox.textContent = error.message;
            errorBox.classList.remove('hidden');
        } finally {
            loadingIndicator.classList.add('hidden');
        }
    }

    endorseBtn.addEventListener('click', async () => {
        if(!signer) return;
        try {
            const originalText = endorseBtn.textContent;
            endorseBtn.textContent = '...';
            endorseBtn.disabled = true;
            
            const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONFIG.ABI, signer);
            
            // Amoy Gas Workaround
            const feeData = await signer.provider.getFeeData();
            const tx = await contract.endorseCredential(currentCredentialId, {
                maxFeePerGas: ethers.parseUnits("40", "gwei"),
                maxPriorityFeePerGas: ethers.parseUnits("40", "gwei"),
                gasLimit: 150000 // Bypass estimation issues on Amoy
            });
            
            const scanLink = `https://amoy.polygonscan.com/tx/${tx.hash}`;
            statusBanner.innerHTML = `Endorsing... <a href="${scanLink}" target="_blank" class="underline ml-1">View Tx</a>`;
            
            await tx.wait();
            
            const currentCount = parseInt(document.getElementById('onchainEndorsements').textContent);
            document.getElementById('onchainEndorsements').textContent = (currentCount + 1).toString();
            endorseBtn.classList.add('hidden');
            
            statusBanner.innerHTML = "✓ VALID CREDENTIAL (ENDORSEMENT ADDED)";
        } catch(e) {
            console.error(e);
            
            let errorMsg = "Endorsement failed.";
            if (e.message.includes("user rejected") || e.code === "ACTION_REJECTED") {
                errorMsg = "Transaction rejected by user.";
            } else if (e.message.includes("Issuer cannot endorse")) {
                errorMsg = "You cannot endorse your own credential.";
            } else if (e.message.includes("Already endorsed")) {
                errorMsg = "You have already endorsed this credential.";
            } else {
                errorMsg += " Ensure you are not the issuer and haven't endorsed yet.";
            }
            
            alert(errorMsg);
            endorseBtn.textContent = 'ENDORSE';
            endorseBtn.disabled = false;
        }
    });
});
