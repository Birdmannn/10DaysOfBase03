import React, { useState, useEffect } from "react";
import { useContract, type Donation } from "../hooks/useContract";
import DonationCard from "./DonationCard";
import "../styles/DonationList.css";

interface DonationListProps {
  provider: any;
  onDonate: (id: bigint, amount: string) => Promise<void>;
  refreshTrigger?: number;
  isLoading?: boolean;
}

interface DonationWithId {
  id: bigint;
  donation: Donation;
}

const DonationList: React.FC<DonationListProps> = ({
  provider,
  onDonate,
  refreshTrigger = 0,
  isLoading = false,
}) => {
  const [donations, setDonations] = useState<DonationWithId[]>([]);
  const [isLoadingDonations, setIsLoadingDonations] = useState(true);
  const [error, setError] = useState("");
  const { getTotalDonations, getDonation } = useContract();

  useEffect(() => {
    loadDonations();
  }, [refreshTrigger]);

  const loadDonations = async () => {
    setIsLoadingDonations(true);
    setError("");

    try {
      const total = await getTotalDonations();
      const donationsList: DonationWithId[] = [];

      for (let i = 0; i < total; i++) {
        try {
          const donation = await getDonation(BigInt(i));
          donationsList.push({
            id: BigInt(i),
            donation,
          });
        } catch (err) {
          console.error(`Error loading donation ${i}:`, err);
        }
      }

      setDonations(donationsList.reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load donations");
    } finally {
      setIsLoadingDonations(false);
    }
  };

  if (isLoadingDonations) {
    return <div className="loading">Loading campaigns...</div>;
  }

  return (
    <div className="donation-list-container">
      {error && <div className="error-banner">{error}</div>}

      {donations.length === 0 ? (
        <div className="empty-state">
          <p>No campaigns yet. Be the first to create one!</p>
        </div>
      ) : (
        <div className="donation-grid">
          {donations.map(({ id, donation }) => (
            <DonationCard
              key={id.toString()}
              id={id}
              donation={donation}
              provider={provider}
              onDonate={onDonate}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DonationList;
