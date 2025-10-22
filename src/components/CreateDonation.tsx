import React, { useState } from "react";
import "../styles/CreateDonation.css";

interface CreateDonationProps {
  provider: any;
  onCreateDonation: (amount: string, description: string) => Promise<void>;
  isLoading?: boolean;
}

const CreateDonation: React.FC<CreateDonationProps> = ({
  provider,
  onCreateDonation,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await onCreateDonation(amount, description);
      setAmount("");
      setDescription("");
      setSuccess("Donation campaign created successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create donation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-donation-container">
      <button
        className="create-button"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "Cancel" : "+ Create New Campaign"}
      </button>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-group">
            <label htmlFor="description">Campaign Description</label>
            <input
              id="description"
              type="text"
              placeholder="e.g., Help build community project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting || isLoading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Target Amount (ETH)</label>
            <input
              id="amount"
              type="number"
              step="0.0001"
              min="0"
              placeholder="e.g., 1.5"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isSubmitting || isLoading}
              className="form-input"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isLoading || !amount || !description}
            className="submit-button"
          >
            {isSubmitting ? "Creating..." : "Create Campaign"}
          </button>

          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
        </form>
      )}
    </div>
  );
};

export default CreateDonation;
