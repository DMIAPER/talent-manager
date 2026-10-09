import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Componente universal de renderizado enriquecido de Markdown.
 * Transforma sintaxis Markdown (negritas **, títulos #, listas *, tablas, enlaces, etc.)
 * en elementos HTML estilizados sin mostrar símbolos Markdown en crudo.
 */
export default function MarkdownRenderer({ content, className = '', style = {} }) {
  if (!content) return null;

  // Limpiar posibles bloques de metadatos frontmatter YAML (--- ... ---)
  const processedContent = typeof content === 'string' 
    ? content.replace(/^---[\s\S]*?---\s*/, '')
    : content;

  return (
    <div className={`rich-markdown ${className}`} style={style}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h1 className="rm-h1" {...props} />,
          h2: ({ node, ...props }) => <h2 className="rm-h2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="rm-h3" {...props} />,
          h4: ({ node, ...props }) => <h4 className="rm-h4" {...props} />,
          p: ({ node, ...props }) => <p className="rm-p" {...props} />,
          ul: ({ node, ...props }) => <ul className="rm-ul" {...props} />,
          ol: ({ node, ...props }) => <ol className="rm-ol" {...props} />,
          li: ({ node, ...props }) => <li className="rm-li" {...props} />,
          strong: ({ node, ...props }) => <strong className="rm-strong" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="rm-blockquote" {...props} />,
          code: ({ node, inline, ...props }) => 
            inline ? (
              <code className="rm-inline-code" {...props} />
            ) : (
              <code className="rm-block-code" {...props} />
            ),
          pre: ({ node, ...props }) => <pre className="rm-pre" {...props} />,
          table: ({ node, ...props }) => (
            <div className="rm-table-wrapper">
              <table className="rm-table" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="rm-th" {...props} />,
          td: ({ node, ...props }) => <td className="rm-td" {...props} />,
          a: ({ node, href, children, ...props }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="rm-link" 
              {...props}
            >
              {children}
            </a>
          ),
          hr: ({ node, ...props }) => <hr className="rm-hr" {...props} />
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
