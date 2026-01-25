import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-slate dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-foreground mb-6 pb-2 border-b">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-lg font-medium text-foreground mt-4 mb-2">{children}</h4>
          ),
          p: ({ children }) => (
            <p className="text-muted-foreground mb-4 leading-7">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-4 space-y-2 text-muted-foreground">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-4 space-y-2 text-muted-foreground">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-muted-foreground">{children}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary bg-primary/5 pl-4 py-3 my-4 rounded-r-lg">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("block bg-muted p-4 rounded-lg text-sm font-mono overflow-x-auto", className)} {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-border rounded-lg">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold text-foreground border-b border-border">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-muted-foreground border-b border-border">{children}</td>
          ),
          a: ({ href, children }) => (
            <a 
              href={href} 
              className="text-primary hover:underline"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-8 border-border" />,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
