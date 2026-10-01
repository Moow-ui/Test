import type { ReactNode } from "react";

/**
 * 해설용 아주 작은 마크다운 표시기.
 * 지원: 문단, 줄바꿈, **굵게**, "- " 목록, "1. " 번호 목록(계산 풀이 단계).
 * HTML 을 그대로 넣지 않으므로 가져온(import) 데이터에 태그가 섞여 있어도 안전하다.
 */

type Block =
  | { type: "p"; lines: string[] }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] };

function parse(text: string): Block[] {
  const blocks: Block[] = [];
  // 빈 줄을 만나면 true 가 되어, 다음 줄은 같은 종류여도 새 묶음으로 시작한다
  let breakNext = true;

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (line === "") {
      breakNext = true;
      continue;
    }
    const bullet = line.match(/^[-*]\s+(.*)$/);
    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    const type: Block["type"] = bullet ? "ul" : numbered ? "ol" : "p";
    const value = bullet?.[1] ?? numbered?.[1] ?? line;

    const last = blocks[blocks.length - 1];
    if (!breakNext && last && last.type === type) {
      if (last.type === "p") last.lines.push(value);
      else last.items.push(value);
    } else if (type === "p") {
      blocks.push({ type, lines: [value] });
    } else {
      blocks.push({ type, items: [value] });
    }
    breakNext = false;
  }
  return blocks;
}

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      part
    ),
  );
}

export function Markdown({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {parse(text).map((block, i) => {
        if (block.type === "ul") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-6">
              {block.items.map((item, j) => (
                <li key={j}>{inline(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={i} className="list-decimal space-y-1 pl-7">
              {block.items.map((item, j) => (
                <li key={j}>{inline(item)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                {inline(line)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
