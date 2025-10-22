/**
 * Payment Service Module
 *
 * This module handles all blockchain transaction operations including:
 * - Creating blockchain clients
 * - Sending gasless transactions via Paymaster
 * - Monitoring transaction status
 * - Waiting for transaction confirmations
 *
 * @module paymentService
 */

import { baseSepolia } from "viem/chains";
import {
  createPublicClient,
  http,
  numberToHex,
  encodeFunctionData,
} from "viem";

/**
 * ABI definition for the Rewards smart contract
 * Contains the claimReward function signature
 * @constant {Array<Object>}
 */
const REWARDS_ABI = [
  {
    inputs: [],
    name: "claimReward",
    stateMutability: "nonpayable",
    type: "function",
  },
];

/**
 * Creates a Viem public client for interacting with the Base Sepolia blockchain
 *
 * @param rpcUrl - The RPC endpoint URL for Base Sepolia
 * @returns Viem public client instance configured for Base Sepolia
 *
 * @example
 * const client = createClient('https://base-sepolia.g.alchemy.com/v2/YOUR_KEY');
 */
export const createClient = (rpcUrl: string) => {
  return createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });
};

/**
 * Sends a gasless transaction to claim rewards using Coinbase Paymaster
 *
 * This function uses EIP-5792's wallet_sendCalls method to execute a transaction
 * with paymaster capabilities, allowing the user to claim rewards without paying gas fees.
 *
 * @param provider - The wallet provider instance (from Base Account SDK)
 * @param fromAddress - The user's wallet address
 * @param contractAddress - The rewards contract address
 * @param paymasterUrl - The Coinbase Paymaster service URL
 * @returns The batch ID for tracking the transaction
 * @throws If provider is unavailable or paymaster URL is missing
 *
 * @example
 * const batchId = await sendTransaction(
 *   provider,
 *   '0x123...',
 *   '0xABC...',
 *   'https://api.developer.coinbase.com/rpc/v1/base-sepolia/KEY'
 * );
 */
export const sendTransaction = async (
  provider: { request: (args: any) => Promise<any> },
  fromAddress: string,
  contractAddress: string,
  paymasterUrl: string
) => {
  // Encode the claimReward function call
  const data = encodeFunctionData({
    abi: REWARDS_ABI,
    functionName: "claimReward",
  });

  try {
    // Validate provider availability
    if (!provider || !provider.request) {
      throw new Error(
        "No provider available. Please connect to a base account"
      );
    }

    // Validate paymaster URL
    if (!paymasterUrl) {
      throw new Error("Paymaster URL is required!");
    }

    // Prepare the transaction call
    const calls = [
      {
        to: contractAddress, // Target contract address
        value: "0x0", // No ETH value sent
        data: data, // Encoded function call
      },
    ];

    // Send the transaction using EIP-5792 wallet_sendCalls
    const result = await provider.request({
      method: "wallet_sendCalls",
      params: [
        {
          version: "1.0",
          chainId: numberToHex(baseSepolia.id),
          from: fromAddress,
          calls: calls,
          capabilities: {
            paymasterService: {
              url: paymasterUrl, // Paymaster sponsors gas fees
            },
          },
        },
      ],
    });

    return result;
  } catch (error) {
    console.log(`Error sending transaction : ${error}`);
    throw error;
  }
};

/**
 * Retrieves the current status of a batch transaction
 *
 * Uses EIP-5792's wallet_getCallsStatus to check the status of a previously
 * submitted batch of calls.
 *
 * @param provider - The wallet provider instance
 * @param batchId - The batch identifier returned from sendTransaction
 * @returns Status object containing transaction state and receipts
 *
 * @example
 * const status = await getCallsStatus(provider, batchId);
 * console.log(status.status); // 'PENDING', 'CONFIRMED', or 'FAILED'
 */
export const getCallsStatus = async (
  provider: { request: (args: any) => Promise<any> },
  batchId: string
) => {
  const status = await provider.request({
    method: "wallet_getCallsStatus",
    params: [batchId],
  });

  return status;
};

/**
 * Polls for transaction confirmation with configurable retry logic
 *
 * Continuously checks the transaction status until it's confirmed, failed,
 * or the maximum number of attempts is reached.
 *
 * @param provider - The wallet provider instance
 * @param batchId - The batch identifier to monitor
 * @param maxAttempts - Maximum number of polling attempts (default: 60)
 * @param intervalMs - Milliseconds between polling attempts (default: 2000)
 * @returns Final status object when transaction is confirmed
 * @throws If transaction fails or confirmation times out
 *
 * @example
 * try {
 *   const finalStatus = await waitForBatchConfirmation(provider, batchId);
 *   console.log('Transaction confirmed!', finalStatus);
 * } catch (error) {
 *   console.error('Transaction failed or timed out', error);
 * }
 */
export const waitForBatchConfirmation = async (
  provider: { request: (args: any) => Promise<any> },
  batchId: string,
  maxAttempts: number = 60,
  intervalMs: number = 2000
) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getCallsStatus(provider, batchId);

    // Transaction successfully confirmed
    if (status.status === "CONFIRMED") {
      return status;
    }

    // Transaction failed
    if (status.status === "FAILED") {
      throw new Error(`Batch failed: ${status.error}`);
    }

    // Wait before next polling attempt
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  // Timeout reached without confirmation
  throw new Error("Batch confirmation timeout");
};
