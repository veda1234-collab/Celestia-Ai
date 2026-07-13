'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Styled Markdown for astrologer replies — headings, lists, emphasis, code. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ ...p }) => <h3 className="font-display text-base font-semibold" {...p} />,
          h2: ({ ...p }) => <h3 className="font-display text-base font-semibold" {...p} />,
          h3: ({ ...p }) => <h4 className="font-display text-sm font-semibold" {...p} />,
          p: ({ ...p }) => <p className="text-foreground/90" {...p} />,
          strong: ({ ...p }) => <strong className="font-semibold text-foreground" {...p} />,
          em: ({ ...p }) => <em className="text-muted-foreground" {...p} />,
          ul: ({ ...p }) => <ul className="ml-4 list-disc space-y-1 text-foreground/90 marker:text-primary" {...p} />,
          ol: ({ ...p }) => <ol className="ml-4 list-decimal space-y-1 text-foreground/90 marker:text-primary" {...p} />,
          li: ({ ...p }) => <li className="pl-1" {...p} />,
          a: ({ ...p }) => <a className="text-primary underline underline-offset-2" target="_blank" rel="noreferrer" {...p} />,
          blockquote: ({ ...p }) => <blockquote className="border-l-2 border-primary/50 pl-3 text-muted-foreground" {...p} />,
          code: ({ ...p }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs" {...p} />,
          hr: () => <hr className="border-border" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
