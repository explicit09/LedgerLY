import React, { useEffect, useState } from 'react';
import BankConnectionButton from '../../components/BankConnectionButton';
import { getBankItems, removeBankItem } from '../../services/plaid';
import { formatDate } from '@/utils';

interface BankItem {
  id: string;
  institutionId: string;
  institutionName: string;
  updatedAt: string;
}

const BankConnectionsPage: React.FC = () => {
  const [items, setItems] = useState<BankItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadItems = async () => {
    setLoading(true);
    try {
      const data = await getBankItems();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch bank items', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleRemove = async (id: string) => {
    try {
      await removeBankItem(id);
      loadItems();
    } catch (error) {
      console.error('Failed to remove bank item', error);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-primary">Bank Connections</h1>
      <BankConnectionButton onSuccess={loadItems} />
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="p-2 border rounded flex justify-between items-center">
            <div>
              <div>{item.institutionName}</div>
              <div className="text-sm text-gray-500">Last synced {formatDate(item.updatedAt)}</div>
            </div>
            <button className="btn" onClick={() => handleRemove(item.id)}>
              Disconnect
            </button>
          </div>
        ))}
        {!loading && items.length === 0 && <p className="text-gray-500">No connections yet.</p>}
      </div>
    </div>
  );
};

export default BankConnectionsPage;
