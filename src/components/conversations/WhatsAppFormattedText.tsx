import React from 'react';

interface WhatsAppFormattedTextProps {
  text: string;
  className?: string;
}

export const WhatsAppFormattedText: React.FC<WhatsAppFormattedTextProps> = ({ text, className }) => {
  const formatWhatsAppText = (content: string): React.ReactNode[] => {
    const lines = content.split('\n');
    const result: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let listItems: { type: 'bullet' | 'numbered'; content: string }[] = [];

    const flushList = () => {
      if (listItems.length > 0) {
        const isBullet = listItems[0].type === 'bullet';
        const ListTag = isBullet ? 'ul' : 'ol';
        result.push(
          <ListTag 
            key={`list-${result.length}`} 
            className={`${isBullet ? 'list-disc' : 'list-decimal'} list-inside my-1 space-y-0.5`}
          >
            {listItems.map((item, idx) => (
              <li key={idx}>{formatInlineText(item.content)}</li>
            ))}
          </ListTag>
        );
        listItems = [];
      }
    };

    lines.forEach((line, lineIndex) => {
      // Check for code block start/end
      if (line.trim().startsWith('```') && !inCodeBlock) {
        flushList();
        inCodeBlock = true;
        const afterBackticks = line.trim().slice(3);
        if (afterBackticks.endsWith('```')) {
          // Single line code block
          result.push(
            <pre key={`code-${lineIndex}`} className="bg-muted/50 rounded px-2 py-1 my-1 font-mono text-xs overflow-x-auto">
              {afterBackticks.slice(0, -3)}
            </pre>
          );
          inCodeBlock = false;
        } else if (afterBackticks) {
          codeBlockContent.push(afterBackticks);
        }
        return;
      }

      if (inCodeBlock) {
        if (line.trim().endsWith('```')) {
          const lastLine = line.trim().slice(0, -3);
          if (lastLine) codeBlockContent.push(lastLine);
          result.push(
            <pre key={`code-${lineIndex}`} className="bg-muted/50 rounded px-2 py-1 my-1 font-mono text-xs overflow-x-auto">
              {codeBlockContent.join('\n')}
            </pre>
          );
          codeBlockContent = [];
          inCodeBlock = false;
        } else {
          codeBlockContent.push(line);
        }
        return;
      }

      // Check for quote
      if (line.startsWith('> ')) {
        flushList();
        result.push(
          <blockquote 
            key={`quote-${lineIndex}`} 
            className="border-l-2 border-muted-foreground/50 pl-2 my-1 italic text-muted-foreground"
          >
            {formatInlineText(line.slice(2))}
          </blockquote>
        );
        return;
      }

      // Check for bullet list
      if (/^[\*\-]\s/.test(line)) {
        listItems.push({ type: 'bullet', content: line.slice(2) });
        return;
      }

      // Check for numbered list
      if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^\d+\.\s(.*)$/);
        if (match) {
          listItems.push({ type: 'numbered', content: match[1] });
          return;
        }
      }

      // Regular line - flush any pending list
      flushList();

      if (line.trim() === '') {
        result.push(<br key={`br-${lineIndex}`} />);
      } else {
        result.push(
          <span key={`line-${lineIndex}`}>
            {formatInlineText(line)}
            {lineIndex < lines.length - 1 && <br />}
          </span>
        );
      }
    });

    // Flush any remaining list items
    flushList();

    // Handle unclosed code block
    if (inCodeBlock && codeBlockContent.length > 0) {
      result.push(
        <pre key="code-final" className="bg-muted/50 rounded px-2 py-1 my-1 font-mono text-xs overflow-x-auto">
          {codeBlockContent.join('\n')}
        </pre>
      );
    }

    return result;
  };

  const formatInlineText = (text: string): React.ReactNode => {
    // Combined regex for all inline formatting
    // Order matters: process longer patterns first
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let keyIndex = 0;

    while (remaining.length > 0) {
      // Try to match inline code first (single backtick)
      const inlineCodeMatch = remaining.match(/^`([^`]+)`/);
      if (inlineCodeMatch) {
        parts.push(
          <code key={keyIndex++} className="bg-muted/50 rounded px-1 py-0.5 font-mono text-xs">
            {inlineCodeMatch[1]}
          </code>
        );
        remaining = remaining.slice(inlineCodeMatch[0].length);
        continue;
      }

      // Try to match bold (asterisks)
      const boldMatch = remaining.match(/^\*([^\*]+)\*/);
      if (boldMatch) {
        parts.push(<strong key={keyIndex++}>{formatInlineText(boldMatch[1])}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Try to match italic (underscores)
      const italicMatch = remaining.match(/^_([^_]+)_/);
      if (italicMatch) {
        parts.push(<em key={keyIndex++}>{formatInlineText(italicMatch[1])}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Try to match strikethrough (tildes)
      const strikeMatch = remaining.match(/^~([^~]+)~/);
      if (strikeMatch) {
        parts.push(<del key={keyIndex++}>{formatInlineText(strikeMatch[1])}</del>);
        remaining = remaining.slice(strikeMatch[0].length);
        continue;
      }

      // No match found, take one character and continue
      const nextSpecial = remaining.slice(1).search(/[`\*_~]/);
      if (nextSpecial === -1) {
        parts.push(remaining);
        break;
      } else {
        parts.push(remaining.slice(0, nextSpecial + 1));
        remaining = remaining.slice(nextSpecial + 1);
      }
    }

    return parts.length === 1 ? parts[0] : <>{parts}</>;
  };

  return (
    <div className={className}>
      {formatWhatsAppText(text)}
    </div>
  );
};
