import React, { useState, useEffect } from "react";
import {
  connectWallet,
  disconnectWallet,
  isWalletAvailable,
  switchToBaseSepolia,
} from "./utils/walletService";
import { checkPaymasterService } from "./utils/walletProvider";
import { useContract } from "./hooks/useContract";
import CreateDonation from "./components/CreateDonation";
import DonationList from "./components/DonationList";
import { encodeFunctionData, numberToHex } from "viem";
import { baseSepolia } from "viem/chains";
import { FUNDING_ABI, CONTRACT_ADDRESS } from "./utils/Funding";
import "./styles/App.css";

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [sdk, setSdk] = useState<any>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { contractAddress } = useContract();

  const paymasterUrl = import.meta.env.VITE_PAYMASTER_SERVICE_URL;

  useEffect(() => {
    if (!isWalletAvailable()) {
      setError(
        "Base Account wallet not available. Please install the Base Account extension."
      );
    }
  }, []);

  const handleConnectWallet = async () => {
    setError("");
    setIsLoading(true);

    try {
      const { address, provider: connectedProvider, sdk: connectedSdk } = await connectWallet();

      const switched = await switchToBaseSepolia(connectedProvider);
      if (!switched) {
        throw new Error("Failed to switch to Base Sepolia network");
      }

      const isPaymasterValid = await checkPaymasterService(
        paymasterUrl,
        connectedProvider
      );
      if (!isPaymasterValid) {
        throw new Error("Paymaster service not properly configured");
      }

      setAccount(address);
      setProvider(connectedProvider);
      setSdk(connectedSdk);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
      setAccount(null);
      setProvider(null);
      setSdk(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (sdk) {
        await disconnectWallet(sdk);
      }
      setAccount(null);
      setProvider(null);
      setSdk(null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

  const handleCreateDonation = async (amountStr: string, description: string) => {
    if (!provider || !account) {
      setError("Wallet not connected");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const amountInWei = BigInt(Math.floor(parseFloat(amountStr) * 1e18));

      const data = encodeFunctionData({
        abi: FUNDING_ABI,
        functionName: "createDonation",
        args: [amountInWei, description],
      });

      const calls = [
        {
          to: contractAddress as `0x${string}`,
          value: "0x0",
          data: data,
        },
      ];

      const batchId = await provider.request({
        method: "wallet_sendCalls",
        params: [
          {
            version: "1.0",
            chainId: numberToHex(baseSepolia.id),
            from: account,
            calls: calls,
            capabilities: {
              paymasterService: {
                url: paymasterUrl,
              },
            },
          },
        ],
      });

      if (!batchId) {
        throw new Error("Failed to get batch ID");
      }

      let confirmed = false;
      for (let i = 0; i < 60; i++) {
        const status = await provider.request({
          method: "wallet_getCallsStatus",
          params: [batchId],
        });

        if (status.status === "CONFIRMED") {
          confirmed = true;
          break;
        }

        if (status.status === "FAILED") {
          throw new Error(`Transaction failed: ${status.error}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (!confirmed) {
        throw new Error("Transaction confirmation timeout");
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create donation");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonate = async (id: bigint, amountStr: string) => {
    if (!provider || !account) {
      setError("Wallet not connected");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const amountInWei = BigInt(Math.floor(parseFloat(amountStr) * 1e18));

      const data = encodeFunctionData({
        abi: FUNDING_ABI,
        functionName: "donate",
        args: [id, amountInWei],
      });

      const calls = [
        {
          to: contractAddress as `0x${string}`,
          value: "0x0",
          data: data,
        },
      ];

      const batchId = await provider.request({
        method: "wallet_sendCalls",
        params: [
          {
            version: "1.0",
            chainId: numberToHex(baseSepolia.id),
            from: account,
            calls: calls,
            capabilities: {
              paymasterService: {
                url: paymasterUrl,
              },
            },
          },
        ],
      });

      if (!batchId) {
        throw new Error("Failed to get batch ID");
      }

      let confirmed = false;
      for (let i = 0; i < 60; i++) {
        const status = await provider.request({
          method: "wallet_getCallsStatus",
          params: [batchId],
        });

        if (status.status === "CONFIRMED") {
          confirmed = true;
          break;
        }

        if (status.status === "FAILED") {
          throw new Error(`Transaction failed: ${status.error}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      if (!confirmed) {
        throw new Error("Transaction confirmation timeout");
      }

      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process donation");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <div>
            <h1 className="header-title">Poolr</h1>
            <p className="header-subtitle">Gasless donations powered by Coinbase Paymaster</p>
          </div>
          <div className="wallet-section">
            {account ? (
              <>
                <div className="wallet-info">
                  <span className="wallet-address">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                  <span className="wallet-status">Connected</span>
                </div>
                <button className="wallet-button disconnect" onClick={handleDisconnect}>
                  Disconnect
                </button>
              </>
            ) : (
              <button
                className="wallet-button"
                onClick={handleConnectWallet}
                disabled={isLoading || !isWalletAvailable()}
              >
                {isLoading ? "Connecting..." : "Connect Wallet"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="app-main">
        {error && (
          <div className="error-container">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        <>
          <div>
            <h2 className="main-title">Funding Campaigns</h2>
            <p className="main-subtitle">
              Create a new campaign or support existing ones with gasless transactions
            </p>
          </div>

          <CreateDonation
            provider={provider}
            onCreateDonation={handleCreateDonation}
            isLoading={isLoading}
          />

          <DonationList
            provider={provider}
            onDonate={handleDonate}
            refreshTrigger={refreshTrigger}
            isLoading={isLoading}
          />
        </>
      </main>
    </div>
  );
}

export default App;
