import api from '../lib/api';

export const getLinkToken = async (): Promise<string> => {
  const res = await api.post('/plaid/link-token');
  return res.data.linkToken;
};

export const exchangePublicToken = async (
  publicToken: string,
  institutionId: string,
  institutionName: string
) => {
  await api.post('/plaid/exchange-token', {
    publicToken,
    institutionId,
    institutionName,
  });
};

export const getBankItems = async () => {
  const res = await api.get('/plaid/items');
  return res.data.items;
};

export const removeBankItem = async (id: string) => {
  await api.delete(`/plaid/items/${id}`);
};
