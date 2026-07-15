import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function SafeMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      skipHtml
      components={{
        // Remote Markdown images can track viewers. Club logos use the
        // separately validated Supabase storage path instead.
        img: () => null,
        a: ({ node: _node, ...props }) => {
          void _node
          return <a {...props} rel="noopener noreferrer" />
        },
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
