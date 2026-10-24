import { useGetSession, getGetSessionQueryKey } from '@workspace/api-client-react';

export function useSession() {
  const q = useGetSession({ query: { queryKey: getGetSessionQueryKey(), staleTime: 30_000 } });
  const org = q.data?.organisation ?? null;
  const roles = org?.roles ?? [];
  return {
    ...q,
    org,
    roles,
    isTrader: roles.includes('Trader'),
    isSeller: roles.includes('Seller'),
    isBuyer: roles.includes('Buyer'),
    isObligated: org?.buyer_type === 'obligated',
    roleLabel: roles[0]?.toLowerCase(),
  };
}
