import pricing from '../../../../shared/pricing.json';

export { pricing };

export function formatInr(amount: number) {
  return `Rs ${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatPriceRange(low: number, high: number) {
  return `${formatInr(low)} to ${formatInr(high)}`;
}

export function formatFeeRate(rate: number) {
  return `${(rate * 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}%`;
}

export function checkedOnLabel() {
  return new Date(`${pricing.checked_on}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
