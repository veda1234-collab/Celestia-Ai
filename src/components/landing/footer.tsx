import Link from 'next/link';
import { Logo } from './nav';

export function Footer() {
  return (
    <footer className="relative mx-auto max-w-6xl px-6 pb-12 pt-10">
      <div className="glass rounded-3xl p-8 md:p-12">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Personalized AI astrology, grounded in your real birth chart. Discover the story
              written in the stars.
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

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {2026} Celestia. Crafted under the stars.</p>
          <p className="max-w-md sm:text-right">
            For guidance and entertainment. Not a substitute for professional medical, legal or
            financial advice.
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold">{title}</h4>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
