import { CONTRACT_ADDRESS, FUNDING_ABI } from "../utils/Funding";
import { createClient } from "../utils/paymentService";

interface Donation {
  targetAmount: bigint;
  totalDonated: bigint;
  creator: string;
  timestamp: bigint;
  description: string;
}

export type { Donation };

/**
 * Hook for interacting with the Funding contract
 */
export const useContract = () => {
  const rpcUrl = import.meta.env.VITE_BASE_SEPOLIA_RPC;
  const client = createClient(rpcUrl);

  const getDonation = async (id: bigint): Promise<Donation> => {
    const result = await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FUNDING_ABI,
      functionName: "getDonation",
      args: [id],
    });

    const donation = result as any;
    return {
      targetAmount: BigInt(donation.targetAmount),
      totalDonated: BigInt(donation.totalDonated),
      creator: donation.creator,
      timestamp: BigInt(donation.timestamp),
      description: donation.description,
    };
  };

  const getTotalDonations = async (): Promise<number> => {
    const result = await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FUNDING_ABI,
      functionName: "totalDonations",
    });

    return Number(result);
  };

  const getTotalDonated = async (id: bigint): Promise<bigint> => {
    const result = await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: FUNDING_ABI,
      functionName: "getTotalDonated",
      args: [id],
    });

    return BigInt(result as string);
  };

  return {
    getDonation,
    getTotalDonations,
    getTotalDonated,
    contractAddress: CONTRACT_ADDRESS,
  };
};
