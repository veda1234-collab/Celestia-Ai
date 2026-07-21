import Link from 'next/link';
import { Logo } from './nav';
import { Kicker, Rule } from '@/components/ui/plate';

export function Footer() {
  return (
    <footer className="relative mx-auto max-w-6xl px-6 pb-12 pt-16">
      <Rule className="mb-12" />

      <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-5 text-sm leading-relaxed text-ink-2">
            Personalized AI astrology, grounded in your real birth chart — the story written in the
            stars, computed and read aloud.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <FooterCol
            title="Explore"
            links={[
              { href: '#features', label: 'Features' },
              { href: '#how', label: 'How it works' },
              { href: '/onboarding', label: 'Get started' },
            ]}
          />
          <FooterCol
            title="Product"
            links={[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/chat', label: 'AI Astrologer' },
              { href: '#faq', label: 'FAQ' },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { href: '#', label: 'Privacy' },
              { href: '#', label: 'Terms' },
            ]}
          />
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-3 border-t border-foreground/10 pt-6 text-xs text-ink-2/70 sm:flex-row sm:items-center sm:justify-between">
        <p className="dateline text-ink-2/70">
          © <span className="font-mono tabular-nums">2026</span> Vedastra · Bound under the stars.
        </p>
        <p className="max-w-md sm:text-right">
          For guidance and entertainment. Not a substitute for professional medical, legal or
          financial advice.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <Kicker className="mb-3">{title}</Kicker>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-ink-2 transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
