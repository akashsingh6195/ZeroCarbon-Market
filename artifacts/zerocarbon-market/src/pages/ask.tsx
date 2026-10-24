import { Page, PageTitle } from '@/components/zc/layout';
import { AskPanel } from '@/components/zc/ask-panel';

export default function Ask() {
  return (
    <Page className="max-w-2xl">
      <PageTitle eyebrow="Ask ZeroCarbon" title="Plain answers">Ask about labels, buying, your land or an order. We do not give advice about money.</PageTitle>
      <div className="h-[60dvh] min-h-[380px] rounded-2xl border bg-[hsl(var(--paper))] p-4"><AskPanel /></div>
    </Page>
  );
}
