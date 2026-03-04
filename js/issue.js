document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('connectWallet');
    const form = document.getElementById('issueForm');
    const alertBox = document.getElementById('alertBox');
    const submitBtn = document.getElementById('submitBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultBox = document.getElementById('resultBox');
    
    let signer = null;
    let userAddress = null;

    async function initWallet() {
        if (window.ethereum) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const accounts = await provider.send("eth_requestAccounts", []);
                signer = await provider.getSigner();
                userAddress = accounts[0];
                connectBtn.textContent = `${userAddress.substring(0,6)}...${userAddress.substring(38)}`;
                connectBtn.classList.replace('bg-gray-100', 'bg-indigo-100');
                connectBtn.classList.replace('text-gray-700', 'text-indigo-700');
                
                // Ensure Amoy Network (chain id 80002)
                const network = await provider.getNetwork();
                const chainId = network.chainId;
                
                if (chainId !== 80002n) {
                    try {
                        await window.ethereum.request({
                            method: "wallet_switchEthereumChain",
                            params: [{ chainId: "0x13882" }]
                        });
                        hideAlert();
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
                                hideAlert();
                            } catch (addError) {
                                showAlert("Failed to add Polygon Amoy. Please add it manually.", "red");
                            }
                        } else {
                            showAlert("Please switch to Polygon Amoy Testnet to continue.", "red");
                        }
                    }
                } else {
                    hideAlert();
                }
            } catch (error) {
                console.error(error);
                showAlert("Connection failed. See console.", "red");
            }
        } else {
            showAlert("Please install MetaMask!", "red");
        }
    }

    connectBtn.addEventListener('click', initWallet);

    function showAlert(msg, color) {
        alertBox.innerHTML = msg;
        alertBox.className = `mb-6 p-4 rounded-md font-medium bg-${color}-100 text-${color}-800 border border-${color}-200 block shadow-sm`;
    }
    
    function hideAlert() {
        alertBox.classList.add('hidden');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (!signer) {
            showAlert("Please connect your wallet first", "red");
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50');
            loadingIndicator.classList.remove('hidden');
            hideAlert();

            // 1. Gather form data
            // Generate Unique Credential ID (e.g., PH-YYYYMMDD-ABC123)
            const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
            const credentialId = `PH-${dateStr}-${randomStr}`;
            const payload = {
                credential_id: credentialId,
                evidence_url: document.getElementById('evidence_url').value,
                full_name: document.getElementById('full_name').value,
                issued_date: document.getElementById('issued_date').value,
                issuer_name: document.getElementById('issuer_name').value,
                level: document.getElementById('level').value,
                skill: document.getElementById('skill').value
            };

            // 2. Compute Hash deterministically 
            // We stringify the sorted keys to prevent hash mismatch
            const sortedKeys = Object.keys(payload).sort();
            const sortedPayload = {};
            sortedKeys.forEach(k => { sortedPayload[k] = payload[k]; });
            const canonicalString = JSON.stringify(sortedPayload);
            
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(canonicalString);
            const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const sha256Hash = "0x" + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            // 3. Save to database via API
            const apiRes = await fetch('api/issue.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload) // Must match exactly
            });
            
            const textResult = await apiRes.text();
            let dbResult;
            try {
                dbResult = JSON.parse(textResult);
            } catch(jsonErr) {
                throw new Error("Invalid backend response: " + textResult.substring(0, 100));
            }
            
            if (!dbResult.ok) {
                throw new Error("Database error: " + (dbResult.error || "Unknown database error"));
            }

            // 4. Send transaction to Blockchain
            // Amoy requires higher gas fees (at least 25 Gwei)
            const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONFIG.ABI, signer);
            const feeData = await signer.provider.getFeeData();
            const tx = await contract.issueCredential(credentialId, sha256Hash, {
                maxFeePerGas: ethers.parseUnits("40", "gwei"),
                maxPriorityFeePerGas: ethers.parseUnits("40", "gwei"),
                gasLimit: 300000 // Bypass estimation issues on Amoy
            });
            
            showAlert(`Transaction sent! Waiting for confirmation... Hash: <a href="https://amoy.polygonscan.com/tx/${tx.hash}" target="_blank" class="underline">View</a>`, "blue");
            
            const receipt = await tx.wait();
            
            // 5. Show success UI
            form.reset();
            hideAlert();
            resultBox.classList.remove('hidden');
            document.getElementById('txHashDisplay').innerHTML = `Transaction confirmed! <a href="https://amoy.polygonscan.com/tx/${receipt.hash}" target="_blank" class="underline font-bold">View on Polygonscan</a>`;
            
            // Dynamic URL generation to support root or subdirectory hosting
            const baseUrl = window.location.href.split('?')[0].split('#')[0];
            const baseDir = baseUrl.substring(0, baseUrl.lastIndexOf('/'));
            const verifyUrl = `${baseDir}/verify.html?id=${credentialId}`;
            const verifyLinkEl = document.getElementById('verifyLink');
            verifyLinkEl.href = verifyUrl;
            verifyLinkEl.textContent = verifyUrl;
            
            document.getElementById('qrcode').innerHTML = "";
            new QRCode(document.getElementById('qrcode'), {
                text: verifyUrl,
                width: 128,
                height: 128,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });
            document.getElementById('qrcode').setAttribute('title', 'Scan this QR code to verify this ProofHer credential.');
            
            // Setup Copy Link functionality
            const copyBtn = document.getElementById('copyLinkBtn');
            copyBtn.onclick = async () => {
                try {
                    await navigator.clipboard.writeText(verifyUrl);
                    const originalText = copyBtn.textContent;
                    copyBtn.textContent = "Copied!";
                    copyBtn.classList.replace('text-gray-700', 'text-green-600');
                    setTimeout(() => {
                        copyBtn.textContent = originalText;
                        copyBtn.classList.replace('text-green-600', 'text-gray-700');
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy', err);
                }
            };

        } catch (error) {
            console.error(error);
            showAlert(error.message || "An error occurred", "red");
        } finally {
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50');
            loadingIndicator.classList.add('hidden');
        }
    });
});
