/**
 * Wallet Services Module
 *
 * This module manages wallet connection, network switching, and Base Account SDK
 * initialization. It provides a singleton pattern for SDK instance management.
 *
 * @module walletServices
 */

import { createBaseAccountSDK, base } from "@base-org/account";
import { baseSepolia } from "viem/chains";

/**
 * Singleton instance of the Base Account SDK
 */
let sdkInstance: any = null;

/**
 * Gets or creates the Base Account SDK instance (Singleton pattern)
 *
 * Initializes the SDK with app metadata and supported chain IDs.
 * The SDK instance is cached to avoid multiple initializations.
 *
 * @example
 * const sdk = getBaseAccountSDK();
 * const provider = sdk.getProvider();
 */
export const getBaseAccountSDK = (): any => {
  if (!sdkInstance) {
    try {
      sdkInstance = createBaseAccountSDK({
        appName: "Funding Paymaster Demo",
        appLogoUrl: "https://base.org/logo.png",
        appChainIds: [base.constants.CHAIN_IDS.baseSepolia],
      });
    } catch (error) {
      console.log(`Error setting up base account sdk: ${error}`);
    }
  }

  return sdkInstance;
};

/**
 * Checks if the Base Account wallet is available and SDK is initialized
 *
 * @example
 * if (isWalletAvailable()) {
 *   console.log('Wallet is ready to connect');
 * }
 */
export const isWalletAvailable = (): boolean => {
  try {
    return getBaseAccountSDK() !== null;
  } catch (error) {
    console.log(`Error: Cannot find SDK instance: ${error}`);
    return false;
  }
};

/**
 * Connects to the user's Base Account wallet
 *
 * Initiates the wallet connection flow, requesting account access from the user.
 * Returns the connected account address, provider, and SDK instance.
 *
 * @example
 * const { address, provider, sdk } = await connectWallet();
 * console.log('Connected to:', address);
 */
export const connectWallet = async (): Promise<{
  address: string;
  provider: any;
  sdk: any;
}> => {
  // Get SDK instance
  const sdk = getBaseAccountSDK();

  // Get provider from SDK
  const provider = sdk.getProvider();

  if (!provider) {
    throw new Error("No Provider available from base account sdk");
  }

  // Request account access from user
  const accounts = await provider.request({ method: "eth_requestAccounts" });

  if (!accounts || accounts.length === 0) {
    throw new Error("No account returned");
  }

  return {
    address: accounts[0],
    provider,
    sdk,
  };
};

/**
 * Switches the wallet to Base Sepolia network
 *
 * Checks the current network and switches to Base Sepolia if needed.
 * If the network is not added to the wallet, it will be added automatically.
 *
 * @param provider - The wallet provider instance
 * @returns True if switch is successful, false otherwise
 * @throws If provider is not available
 *
 * @example
 * const success = await switchToBaseSepolia(provider);
 * if (success) {
 *   console.log('Switched to Base Sepolia');
 * }
 */
export const switchToBaseSepolia = async (provider: any): Promise<boolean> => {
  try {
    if (!provider) {
      throw new Error("No Provider Available");
    }

    // Get current chain ID
    const chainId = await provider.request({ method: "eth_chainId" });
    const currentChainId = parseInt(chainId, 16);
    const targetChainId = baseSepolia.id;

    // Already on Base Sepolia
    if (currentChainId === targetChainId) {
      return true;
    }

    // Attempt to switch to Base Sepolia
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${targetChainId.toString(16)}` }],
    });
    return true;
  } catch (error) {
    // Error code 4902: Chain not added to wallet
    if ((error as any).code === 4902) {
      try {
        const rpcUrl = import.meta.env.VITE_RPC_URL;

        // Add Base Sepolia network to wallet
        await provider.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: `0x${baseSepolia.id.toString(16)}`,
              chainName: "Base Sepolia",
              nativeCurrency: {
                name: "ETH",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: [rpcUrl],
              blockExplorerUrls: ["https://sepolia.basescan.org"],
            },
          ],
        });
        return true;
      } catch (error) {
        console.log(`Error adding/switching chains: ${error}`);
        return false;
      }
    }
    console.log(`Error switching chains: ${error}`);
    return false;
  }
};

/**
 * Disconnects the wallet and cleans up the SDK session
 *
 * @param sdk - The Base Account SDK instance
 * @returns True if disconnection is successful, false otherwise
 *
 * @example
 * await disconnectWallet(sdk);
 * console.log('Wallet disconnected');
 */
export const disconnectWallet = async (sdk: any): Promise<boolean> => {
  try {
    if (sdk && typeof sdk.disconnect === "function") {
      await sdk.disconnect();
    }
    return true;
  } catch (error) {
    console.log(`Error disconnecting wallet: ${error}`);
    return false;
  }
};
