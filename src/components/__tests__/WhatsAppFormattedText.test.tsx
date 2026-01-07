import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WhatsAppFormattedText } from '../conversations/WhatsAppFormattedText';

describe('WhatsAppFormattedText', () => {
  describe('plain text', () => {
    it('renders plain text without formatting', () => {
      render(<WhatsAppFormattedText text="Hello world" />);
      expect(screen.getByText('Hello world')).toBeInTheDocument();
    });

    it('renders empty string without error', () => {
      const { container } = render(<WhatsAppFormattedText text="" />);
      expect(container.querySelector('span')).toBeInTheDocument();
    });
  });

  describe('bold formatting', () => {
    it('renders bold text with strong tag', () => {
      render(<WhatsAppFormattedText text="*bold text*" />);
      const boldElement = screen.getByText('bold text');
      expect(boldElement.tagName).toBe('STRONG');
    });

    it('renders multiple bold segments', () => {
      render(<WhatsAppFormattedText text="*first* and *second*" />);
      expect(screen.getByText('first').tagName).toBe('STRONG');
      expect(screen.getByText('second').tagName).toBe('STRONG');
    });
  });

  describe('italic formatting', () => {
    it('renders italic text with em tag', () => {
      render(<WhatsAppFormattedText text="_italic text_" />);
      const italicElement = screen.getByText('italic text');
      expect(italicElement.tagName).toBe('EM');
    });
  });

  describe('strikethrough formatting', () => {
    it('renders strikethrough text with s tag', () => {
      render(<WhatsAppFormattedText text="~strikethrough~" />);
      const strikeElement = screen.getByText('strikethrough');
      expect(strikeElement.tagName).toBe('S');
    });
  });

  describe('code formatting', () => {
    it('renders inline code with code tag', () => {
      render(<WhatsAppFormattedText text="`inline code`" />);
      const codeElement = screen.getByText('inline code');
      expect(codeElement.tagName).toBe('CODE');
    });

    it('renders code block with pre tag', () => {
      render(<WhatsAppFormattedText text="```code block```" />);
      const preElement = screen.getByText('code block').closest('pre');
      expect(preElement).toBeInTheDocument();
    });
  });

  describe('quote formatting', () => {
    it('renders quote with blockquote styling', () => {
      render(<WhatsAppFormattedText text="> quoted text" />);
      expect(screen.getByText('quoted text')).toBeInTheDocument();
    });

    it('renders multiple quote lines', () => {
      render(<WhatsAppFormattedText text="> line one\n> line two" />);
      expect(screen.getByText('line one')).toBeInTheDocument();
      expect(screen.getByText('line two')).toBeInTheDocument();
    });
  });

  describe('list formatting', () => {
    it('renders bullet list with asterisk', () => {
      render(<WhatsAppFormattedText text="* item one\n* item two" />);
      expect(screen.getByText('item one')).toBeInTheDocument();
      expect(screen.getByText('item two')).toBeInTheDocument();
    });

    it('renders bullet list with dash', () => {
      render(<WhatsAppFormattedText text="- item one\n- item two" />);
      expect(screen.getByText('item one')).toBeInTheDocument();
      expect(screen.getByText('item two')).toBeInTheDocument();
    });

    it('renders numbered list', () => {
      render(<WhatsAppFormattedText text="1. first\n2. second\n3. third" />);
      expect(screen.getByText('first')).toBeInTheDocument();
      expect(screen.getByText('second')).toBeInTheDocument();
      expect(screen.getByText('third')).toBeInTheDocument();
    });
  });

  describe('combined formatting', () => {
    it('renders bold and italic together', () => {
      render(<WhatsAppFormattedText text="*bold* and _italic_" />);
      expect(screen.getByText('bold').tagName).toBe('STRONG');
      expect(screen.getByText('italic').tagName).toBe('EM');
    });

    it('renders nested formatting', () => {
      render(<WhatsAppFormattedText text="*_bold italic_*" />);
      const emElement = screen.getByText('bold italic');
      expect(emElement.tagName).toBe('EM');
      expect(emElement.closest('strong')).toBeInTheDocument();
    });

    it('renders complex message with multiple formats', () => {
      const text = "Hello *John*!\n\nHere's your list:\n* item _one_\n* item `two`";
      render(<WhatsAppFormattedText text={text} />);
      
      expect(screen.getByText('John').tagName).toBe('STRONG');
      expect(screen.getByText('one').tagName).toBe('EM');
      expect(screen.getByText('two').tagName).toBe('CODE');
    });
  });

  describe('className prop', () => {
    it('applies custom className', () => {
      const { container } = render(
        <WhatsAppFormattedText text="test" className="custom-class" />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles unmatched formatting characters', () => {
      render(<WhatsAppFormattedText text="single * asterisk" />);
      expect(screen.getByText(/single \* asterisk/)).toBeInTheDocument();
    });

    it('handles multiline text', () => {
      render(<WhatsAppFormattedText text="line one\nline two\nline three" />);
      expect(screen.getByText('line one')).toBeInTheDocument();
      expect(screen.getByText('line two')).toBeInTheDocument();
      expect(screen.getByText('line three')).toBeInTheDocument();
    });

    it('handles special characters', () => {
      render(<WhatsAppFormattedText text="Price: R$ 100,00 & more" />);
      expect(screen.getByText(/Price: R\$ 100,00 & more/)).toBeInTheDocument();
    });
  });
});
