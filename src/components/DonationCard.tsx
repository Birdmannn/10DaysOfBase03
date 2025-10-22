import React, { useState, useEffect } from "react";
import type { Donation } from "../hooks/useContract";
import "../styles/DonationCard.css";

interface DonationCardProps {
  donation: Donation;
  id: bigint;
  provider: any;
  onDonate: (id: bigint, amount: string) => Promise<void>;
  isLoading?: boolean;
}

const DonationCard: React.FC<DonationCardProps> = ({
  donation,
  id,
  provider,
  onDonate,
  isLoading = false,
}) => {
  const [donateAmount, setDonateAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const targetAmount = Number(donation.targetAmount) / 1e18;
  const totalDonated = Number(donation.totalDonated) / 1e18;
  const progress = Math.min((totalDonated / targetAmount) * 100, 100);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donateAmount) return;

    setIsSubmitting(true);
    setError("");

    try {
      await onDonate(id, donateAmount);
      setDonateAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Donation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="donation-card">
      <div className="card-header">
        <h3 className="card-title">{donation.description}</h3>
        <p className="card-creator">Creator: {donation.creator.slice(0, 6)}...{donation.creator.slice(-4)}</p>
      </div>

      <div className="card-content">
        <div className="progress-section">
          <div className="progress-info">
            <span className="progress-label">Progress</span>
            <span className="progress-amount">{totalDonated.toFixed(4)} / {targetAmount.toFixed(4)} ETH</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <form onSubmit={handleDonate} className="donate-form">
          <input
            type="number"
            step="0.0001"
            min="0"
            placeholder="Amount in ETH"
            value={donateAmount}
            onChange={(e) => setDonateAmount(e.target.value)}
            disabled={isSubmitting || isLoading}
            className="donate-input"
          />
          <button
            type="submit"
            disabled={isSubmitting || isLoading || !donateAmount}
            className="donate-button"
          >
            {isSubmitting ? "Processing..." : "Donate (Gasless)"}
          </button>
        </form>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
};

export default DonationCard;
