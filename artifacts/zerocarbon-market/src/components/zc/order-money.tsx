import type { Order } from '@workspace/api-client-react';
import { formatFeeRate, formatInr, pricing } from '@/lib/pricing';
import { useSession } from '@/lib/session';

export function feeStatusLabel(status: Order['fee_status']) {
  if (status === 'earned') return 'Fee earned';
  if (status === 'cancelled') return 'Order cancelled, no fee';
  if (status === 'none') return 'No ZeroCarbon fee';
  return 'Fee due when credits are delivered';
}

export function OrderMoney({ order }: { order: Order }) {
  const { org } = useSession();
  const sellerView = !!org?.id && org.id === order.listing.seller_org_id;
  const total = order.quantity_t * order.price_inr_per_t;
  const offset = order.listing.market === 'india_offset' || order.route === 'india_offset';
  const noFee = offset || order.fee_status === 'none' || order.fee_rate === 0;
  return (
    <section className="rounded-xl border bg-card p-4 text-sm" data-testid="section-order-money">
      <div className="mb-2 flex items-center justify-between gap-2"><h2 className="font-semibold">Money in this deal</h2><span className="rounded-full bg-secondary px-2 py-1 text-[11px] font-semibold" data-testid="text-fee-status">{feeStatusLabel(order.fee_status)}</span></div>
      <dl className="space-y-2">
        <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{sellerView ? 'Buyer pays' : 'You pay'}</dt><dd className="text-right font-semibold">{formatInr(total)} ({order.quantity_t} t × {formatInr(order.price_inr_per_t)} a tonne)</dd></div>
        {order.fee_status === 'cancelled' ? <p className="rounded-lg bg-secondary p-3 text-xs">Order cancelled, no fee. No seller payment is due for this cancelled deal.</p> : noFee ? <p className="rounded-lg bg-secondary p-3 text-xs leading-relaxed">{offset ? "No ZeroCarbon fee. In real life, Indian offset credits trade only on India's power exchanges; exchange and registry fees are paid there at actual cost." : 'No ZeroCarbon fee.'}</p> : <>
          <div className="flex justify-between gap-3"><dt className="text-muted-foreground">ZeroCarbon fee</dt><dd className="text-right">{formatFeeRate(order.fee_rate)} ({formatInr(order.fee_inr)}), paid by the seller from the sale, only once the credits are delivered</dd></div>
          <div className="flex justify-between gap-3 border-t border-dashed pt-2"><dt className="text-muted-foreground">Seller receives</dt><dd className="font-semibold">{formatInr(total - order.fee_inr)}</dd></div>
          {total >= pricing.deal_fee.large_order_threshold_inr && <p className="text-xs text-muted-foreground">Large or repeat orders can agree a lower fee ({formatFeeRate(pricing.deal_fee.large_repeat_min_rate)} to {formatFeeRate(pricing.deal_fee.large_repeat_max_rate)}) before the deal.</p>}
        </>}
      </dl>
      <p className="mt-3 text-xs text-muted-foreground">Taxes are not shown in this demo.</p>
    </section>
  );
}
