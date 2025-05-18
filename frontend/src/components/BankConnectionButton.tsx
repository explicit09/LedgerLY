import React, { useCallback, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { getLinkToken, exchangePublicToken } from '../services/plaid';

interface BankConnectionButtonProps {
  onSuccess?: () => void;
}

const BankConnectionButton: React.FC<BankConnectionButtonProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);

  const generateLinkToken = async () => {
    setLoading(true);
    try {
      const token = await getLinkToken();
      setLinkToken(token);
    } catch (error) {
      console.error('Failed to generate link token', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = useCallback(
    async (publicToken: string, metadata: any) => {
      try {
        await exchangePublicToken(
          publicToken,
          metadata?.institution?.institution_id,
          metadata?.institution?.name
        );
        onSuccess?.();
      } catch (error) {
        console.error('Failed to exchange token', error);
      }
    },
    [onSuccess]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken || '',
    onSuccess: handleSuccess,
    onExit: () => {},
  });

  const handleClick = () => {
    if (linkToken) {
      open();
    } else {
      generateLinkToken();
    }
  };

  return (
    <button className="btn btn-primary" onClick={handleClick} disabled={loading || (linkToken && !ready)}>
      {loading ? 'Loading...' : 'Connect Bank Account'}
    </button>
  );
};

export default BankConnectionButton;
