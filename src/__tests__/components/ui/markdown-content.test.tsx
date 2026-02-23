import { render, screen } from "@testing-library/react";
import { MarkdownContent } from "@/components/ui/markdown-content";

// Mock react-markdown to avoid ES module issues in Jest
jest.mock("react-markdown", () => {
  return {
    __esModule: true,
    default: ({ children }: { children: string }) => {
      // Simulate basic markdown rendering for testing
      const content = String(children);

      // Handle bold
      if (content.includes("**")) {
        const text = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        return <div dangerouslySetInnerHTML={{ __html: text }} />;
      }

      // Handle headings
      if (content.startsWith("##")) {
        const text = content.replace("## ", "");
        return <h2>{text}</h2>;
      }

      // Handle code blocks
      if (content.startsWith("```")) {
        return (
          <pre>
            <code>test code</code>
          </pre>
        );
      }

      // Handle inline code
      if (content.includes("`") && !content.startsWith("```")) {
        const parts = content.split("`");
        return (
          <div>
            {parts.map((part, i) =>
              i % 2 === 1 ? <code key={i}>{part}</code> : part
            )}
          </div>
        );
      }

      // Handle lists
      if (content.includes("- ")) {
        const items = content
          .split("\n")
          .filter((line) => line.startsWith("- "));
        return (
          <ul>
            {items.map((item, i) => (
              <li key={i}>{item.replace("- ", "")}</li>
            ))}
          </ul>
        );
      }

      // Handle links
      if (content.includes("[")) {
        const match = content.match(/\[(.*?)\]\((.*?)\)/);
        if (match) {
          return (
            <a href={match[2]} target="_blank" rel="noopener noreferrer">
              {match[1]}
            </a>
          );
        }
      }

      return <div>{children}</div>;
    },
  };
});

jest.mock("remark-gfm", () => ({
  __esModule: true,
  default: () => {},
}));

describe("MarkdownContent", () => {
  it("renders bold text", () => {
    render(<MarkdownContent content="**bold text**" />);
    expect(screen.getByText("bold text")).toBeInTheDocument();
    const el = screen.getByText("bold text");
    expect(el.tagName).toBe("STRONG");
  });

  it("renders headings", () => {
    render(<MarkdownContent content="## Heading" />);
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toHaveTextContent("Heading");
  });

  it("renders code blocks with pre tag", () => {
    const content = "```js\nconsole.log('test');\n```";
    const { container } = render(<MarkdownContent content={content} />);
    const pre = container.querySelector("pre");
    expect(pre).toBeInTheDocument();
  });

  it("renders inline code", () => {
    render(<MarkdownContent content="Use `npm install` to install" />);
    const code = screen.getByText("npm install");
    expect(code.tagName).toBe("CODE");
  });

  it("renders lists", () => {
    const content = "- item one\n- item two\n- item three";
    const { container } = render(<MarkdownContent content={content} />);
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(3);
  });

  it("renders links with target=_blank", () => {
    render(<MarkdownContent content="[link](https://example.com)" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders plain text without errors", () => {
    render(<MarkdownContent content="just plain text" />);
    expect(screen.getByText("just plain text")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <MarkdownContent content="test" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass("custom-class");
  });
});
