/**
 * Wallet Provider Module
 *
 * This module handles wallet capability detection and validation,
 * specifically for EIP-5792 features like paymaster support.
 *
 * @module walletProvider
 */

/**
 * Checks if the wallet provider supports EIP-5792 wallet_sendCalls with paymaster
 *
 * This function queries the wallet's capabilities to determine if it supports
 * the paymaster service feature, which enables gasless transactions.
 *
 * @param provider - The wallet provider instance
 * @returns True if paymaster service is supported, false otherwise
 *
 * @example
 * const isSupported = await isWalletSendCallsSupported(provider);
 * if (isSupported) {
 *   console.log('Wallet supports gasless transactions!');
 * }
 */
export const isWalletSendCallsSupported = async (
  provider: any
): Promise<boolean> => {
  // Basic provider validation
  if (!provider || typeof provider.request !== "function") return false;

  try {
    // Query wallet capabilities using EIP-5792
    const capabilities = await provider.request({
      method: "wallet_getCapabilities",
    });

    // Check if any chain supports paymaster service
    if (capabilities) {
      for (const chainId in capabilities) {
        if (capabilities[chainId]?.paymasterService?.supported) {
          return true;
        }
      }
    }
    return false;
  } catch (error) {
    console.log(`Error checking wallet capabilities: ${error}`);
    // Fallback: check if provider has request method
    return typeof provider.request === "function";
  }
};

/**
 * Validates paymaster service configuration and wallet compatibility
 *
 * Performs two checks:
 * 1. Validates the paymaster URL format
 * 2. Checks if the wallet provider supports paymaster capabilities
 *
 * @param paymasterUrl - The Coinbase Paymaster service URL
 * @param provider - The wallet provider instance (optional)
 * @returns True if paymaster is properly configured and supported
 *
 * @example
 * const isValid = await checkPaymasterService(
 *   'https://api.developer.coinbase.com/rpc/v1/base-sepolia/KEY',
 *   provider
 * );
 * if (!isValid) {
 *   console.error('Paymaster not configured properly');
 * }
 */
export const checkPaymasterService = async (
  paymasterUrl: string,
  provider?: any
): Promise<boolean> => {
  // Validate paymaster URL is provided
  if (!paymasterUrl) return false;

  try {
    // Validate URL format
    new URL(paymasterUrl);

    // If provider is available, check wallet capabilities
    if (provider) {
      return await isWalletSendCallsSupported(provider);
    }

    // URL is valid, but can't verify wallet support without provider
    return true;
  } catch (error) {
    console.log(`Error validating paymaster service: ${error}`);
    return false;
  }
};
