import type { AnchorHTMLAttributes, HTMLAttributes, ReactElement } from "react"
import { isValidElement } from "react"
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { type Doc, docs } from "../lib/content"
import { CodeBlock } from "./CodeBlock"
import { Mermaid } from "./Mermaid"

interface Props {
  doc: Doc
  onNavigate: (slug: string) => void
}

const isMermaid = (node: unknown): node is ReactElement<{ className?: string }> =>
  isValidElement(node) &&
  typeof (node.props as { className?: string }).className === "string" &&
  (node.props as { className: string }).className.includes("language-mermaid")

// Documents directement reliés, pour la barre de liens en pied de lecture.
function related(doc: Doc): Doc[] {
  const set = new Set(doc.links)
  for (const other of docs) {
    if (other.links.includes(doc.slug)) set.add(other.slug)
  }
  set.delete(doc.slug)
  return [...set].map((s) => docs.find((d) => d.slug === s)).filter(Boolean) as Doc[]
}

export function DocView({ doc, onNavigate }: Props) {
  return (
    <article className="pointer-events-auto mx-auto max-w-[720px] animate-rise">
      <header className="mb-9">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-faint">
          {doc.group}
        </span>
        {doc.summary && <p className="mt-2 text-lg leading-relaxed text-ink-dim">{doc.summary}</p>}
      </header>

      <div
        className="prose prose-base max-w-none font-sans
          prose-headings:font-semibold prose-headings:tracking-tight
          prose-h1:text-4xl prose-h1:mb-6 prose-h1:tracking-tighter
          prose-h2:text-2xl prose-h2:mt-11
          prose-a:font-medium prose-a:no-underline hover:prose-a:underline
          prose-code:font-normal prose-code:text-[0.86em] prose-code:text-ink-dim
          [&_code]:before:content-none [&_code]:after:content-none
          prose-pre:rounded-none prose-pre:border-0 prose-pre:px-0"
      >
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            code(props: HTMLAttributes<HTMLElement> & { className?: string }) {
              if (props.className?.includes("language-mermaid")) {
                return <Mermaid code={String(props.children).replace(/\n$/, "")} />
              }
              return <code className={props.className}>{props.children}</code>
            },
            pre(props: HTMLAttributes<HTMLPreElement>) {
              const children = props.children
              const first = Array.isArray(children) ? children[0] : children
              if (isMermaid(first)) return <>{children}</>
              return <CodeBlock>{children}</CodeBlock>
            },
            a(props: AnchorHTMLAttributes<HTMLAnchorElement>) {
              const href = props.href ?? ""
              if (href.startsWith("#")) {
                const slug = href.replace(/^#\/?/, "")
                return (
                  <a
                    href={href}
                    className="text-accent"
                    onClick={(e) => {
                      e.preventDefault()
                      onNavigate(slug)
                    }}
                  >
                    {props.children}
                  </a>
                )
              }
              return (
                <a href={href} target="_blank" rel="noreferrer noopener">
                  {props.children}
                </a>
              )
            },
          }}
        >
          {doc.body}
        </Markdown>
      </div>

      {related(doc).length > 0 && (
        <footer className="mt-14 flex flex-wrap gap-2.5 border-t border-line pt-7">
          {related(doc).map((r) => (
            <button
              key={r.slug}
              type="button"
              onClick={() => onNavigate(r.slug)}
              className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3.5 py-1.5 text-sm text-ink-dim transition hover:-translate-y-px hover:border-ink-faint hover:text-ink"
            >
              <span className="h-[7px] w-[7px] flex-none rounded-full bg-accent" />
              {r.title}
            </button>
          ))}
        </footer>
      )}
    </article>
  )
}
