import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { ShieldOff } from 'lucide-react';
import { useSignup, type OrganisationInputRolesItem } from '@workspace/api-client-react';
import { Page } from '@/components/zc/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from '@/lib/session';
import { errMsg } from '@/lib/zc';
import { cn } from '@/lib/utils';

type Role = OrganisationInputRolesItem;
const ROLES: { r: Role; d: string }[] = [
  { r: 'Buyer', d: 'I want to buy credits' },
  { r: 'Seller', d: 'I have land, a project or credits' },
  { r: 'Trader', d: 'I trade voluntary credits' },
];

function Choice({ on, children, onClick, id }: { on: boolean; children: React.ReactNode; onClick: () => void; id: string }) {
  return (
    <button type="button" onClick={onClick} data-testid={id} aria-pressed={on}
      className={cn('tap rounded-xl border px-3 py-2 text-left text-sm transition-colors', on ? 'border-[hsl(var(--forest))] bg-[hsl(var(--forest)/0.08)] font-semibold text-[hsl(var(--forest))]' : 'bg-card')}>
      {children}
    </button>
  );
}

export default function Signup() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { org } = useSession();
  const signup = useSignup();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orgName, setOrgName] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [ccts, setCcts] = useState<'yes' | 'no' | ''>('');
  const [seller, setSeller] = useState<'land' | 'project' | 'credits' | ''>('');
  const [err, setErr] = useState('');

  const toggle = (r: Role) => setRoles((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]));
  const phoneOk = phone.replace(/\D/g, '').length >= 10 && phone.length <= 16;
  const valid = name.trim() && orgName.trim() && phoneOk && roles.length > 0 && (!roles.includes('Buyer') || ccts) && (!roles.includes('Seller') || seller);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!valid) { setErr('Fill in each field and choose at least one role.'); return; }
    signup.mutate({
      data: {
        name: name.trim(), phone: phone.trim(), organisation_name: orgName.trim(), roles,
        ...(roles.includes('Buyer') ? { buyer_type: ccts === 'yes' ? 'obligated' : 'voluntary' } : {}),
        ...(roles.includes('Seller') && seller ? { seller_type: seller } : {}),
      },
    }, {
      onSuccess: async (s) => {
        await qc.resetQueries();
        navigate(s.next_screen || '/market');
      },
      onError: (e2) => setErr(errMsg(e2)),
    });
  };

  return (
    <Page className="max-w-xl">
      <div className="rise">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--soil))]">Demo sign-up</div>
        <h1 className="mt-1 font-display text-3xl font-semibold">Join in twenty seconds</h1>
        <p className="mt-2 text-sm text-muted-foreground">No password, no phone check, no documents. This is a demo session kept in a browser cookie.</p>
      </div>
      {org && (
        <div className="mt-4 rounded-xl border bg-card p-3 text-sm">You are signed in as <b>{org.organisation_name}</b>. Signing up again replaces that demo session.</div>
      )}
      <form onSubmit={submit} className="mt-6 space-y-5 rise rise-1">
        <div className="grid gap-4">
          <label className="text-sm font-medium">Your name<Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" className="mt-1 h-12 bg-card" data-testid="input-name" /></label>
          <label className="text-sm font-medium">Phone number<Input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={16} inputMode="tel" autoComplete="tel" placeholder="98450 12345" className="mt-1 h-12 bg-card" data-testid="input-phone" />
            <span className="mt-1 block text-xs font-normal text-muted-foreground">Not verified. We will never send an OTP in this demo.</span></label>
          <label className="text-sm font-medium">Organisation name<Input value={orgName} onChange={(e) => setOrgName(e.target.value)} maxLength={160} className="mt-1 h-12 bg-card" data-testid="input-organisation" /></label>
        </div>
        <fieldset>
          <legend className="text-sm font-medium">I am a</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {ROLES.map(({ r, d }) => (
              <Choice key={r} on={roles.includes(r)} onClick={() => toggle(r)} id={`button-role-${r.toLowerCase()}`}>
                <span className="block">{r}</span><span className="block text-xs font-normal text-muted-foreground">{d}</span>
              </Choice>
            ))}
          </div>
        </fieldset>
        {roles.includes('Buyer') && (
          <fieldset className="rounded-xl border border-[hsl(var(--registry)/0.3)] bg-[hsl(var(--registry)/0.04)] p-4">
            <legend className="px-1 text-sm font-medium">Does your plant have a CCTS target?</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <Choice on={ccts === 'yes'} onClick={() => setCcts('yes')} id="button-ccts-yes">Yes</Choice>
              <Choice on={ccts === 'no'} onClick={() => setCcts('no')} id="button-ccts-no">No</Choice>
            </div>
          </fieldset>
        )}
        {roles.includes('Seller') && (
          <fieldset className="rounded-xl border border-[hsl(var(--soil)/0.3)] bg-[hsl(var(--soil)/0.05)] p-4">
            <legend className="px-1 text-sm font-medium">Do you have land, a project, or credits already?</legend>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {(['land', 'project', 'credits'] as const).map((s) => <Choice key={s} on={seller === s} onClick={() => setSeller(s)} id={`button-seller-${s}`}><span className="capitalize">{s}</span></Choice>)}
            </div>
          </fieldset>
        )}
        {roles.includes('Trader') && <p className="rounded-xl bg-secondary p-3 text-sm" data-testid="text-trader-note">Traders deal in voluntary credits only.</p>}
        {err && <p className="text-sm text-destructive" data-testid="text-signup-error">{err}</p>}
        <Button type="submit" disabled={signup.isPending} className="h-12 w-full text-base font-semibold" data-testid="button-signup">
          {signup.isPending ? 'Setting up...' : 'Start the demo'}
        </Button>
        <p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />We never ask for PAN, GST, Aadhaar or bank details. To change role later, use Switch role and sign up again.</p>
      </form>
    </Page>
  );
}
