import { formatInr, pricing } from '@/lib/pricing';

const LAND_REVIEW_FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSdUzh8ArXMPLcmJJQQa0wl9coZYEJbluKqLIxf1tnTLHn7wYg/viewform?usp=pp_url&entry.104761457=Consultancy+service&entry.176162690=299';

export function LandReviewBooking({ context }: { context: 'scan' | 'pricing' }) {
  const price = formatInr(pricing.packages.landowner.land_review_inr);
  return (
    <div className="space-y-3 rounded-xl border border-[hsl(var(--leaf)/0.45)] bg-[hsl(var(--leaf)/0.08)] p-4 text-sm" data-testid={`land-review-${context}`}>
      <p className="leading-relaxed">Get a professional to check your land: {price}. A field partner visits and sends you a written proposal. If you decide not to go ahead with registering your land for carbon credits, you get your {price} back.</p>
      <a href={LAND_REVIEW_FORM} target="_blank" rel="noopener noreferrer" className="tap inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[hsl(var(--forest))] px-4 py-2 font-semibold text-[hsl(var(--paper))] hover:opacity-90" data-testid={`link-book-land-review-${context}`}>Book a land review</a>
      <p className="text-xs leading-relaxed text-muted-foreground">Pay with the QR code in the form and fill in your details there.</p>
    </div>
  );
}
