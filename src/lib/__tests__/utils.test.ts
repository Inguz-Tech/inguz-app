import { describe, it, expect } from 'vitest';
import { formatBrazilianPhone, getPhoneDigits, stripWhatsAppFormatting } from '../utils';

describe('formatBrazilianPhone', () => {
  describe('mobile numbers (9 digits after area code)', () => {
    it('formats a valid mobile number correctly', () => {
      expect(formatBrazilianPhone('5511985218470')).toBe('+55 (11) 98521-8470');
    });

    it('formats mobile number from different area code', () => {
      expect(formatBrazilianPhone('5521999887766')).toBe('+55 (21) 99988-7766');
    });

    it('removes @lid suffix and formats correctly', () => {
      expect(formatBrazilianPhone('5511985218470@lid')).toBe('+55 (11) 98521-8470');
    });

    it('removes @s.whatsapp.net suffix and formats correctly', () => {
      expect(formatBrazilianPhone('5511985218470@s.whatsapp.net')).toBe('+55 (11) 98521-8470');
    });
  });

  describe('landline numbers (8 digits after area code)', () => {
    it('formats a valid landline number correctly', () => {
      expect(formatBrazilianPhone('551134567890')).toBe('+55 (11) 3456-7890');
    });

    it('formats landline from different area code', () => {
      expect(formatBrazilianPhone('552125551234')).toBe('+55 (21) 2555-1234');
    });
  });

  describe('edge cases', () => {
    it('returns original without @lid suffix for non-Brazilian numbers', () => {
      expect(formatBrazilianPhone('1234567890@lid')).toBe('1234567890');
    });

    it('returns original for numbers not starting with 55', () => {
      expect(formatBrazilianPhone('1555123456789')).toBe('1555123456789');
    });

    it('returns original for short numbers', () => {
      expect(formatBrazilianPhone('5511')).toBe('5511');
    });

    it('handles empty string', () => {
      expect(formatBrazilianPhone('')).toBe('');
    });

    it('handles numbers with special characters', () => {
      expect(formatBrazilianPhone('+55-11-98521-8470')).toBe('+55 (11) 98521-8470');
    });

    it('handles numbers with spaces', () => {
      expect(formatBrazilianPhone('55 11 98521 8470')).toBe('+55 (11) 98521-8470');
    });
  });
});

describe('getPhoneDigits', () => {
  it('extracts digits from formatted number', () => {
    expect(getPhoneDigits('+55 (11) 98521-8470')).toBe('5511985218470');
  });

  it('removes @lid suffix', () => {
    expect(getPhoneDigits('5511985218470@lid')).toBe('5511985218470');
  });

  it('removes @s.whatsapp.net suffix', () => {
    expect(getPhoneDigits('5511985218470@s.whatsapp.net')).toBe('5511985218470');
  });

  it('handles already clean number', () => {
    expect(getPhoneDigits('5511985218470')).toBe('5511985218470');
  });

  it('handles empty string', () => {
    expect(getPhoneDigits('')).toBe('');
  });

  it('removes all non-digit characters', () => {
    expect(getPhoneDigits('(+55) 11-98521.8470')).toBe('5511985218470');
  });
});

describe('stripWhatsAppFormatting', () => {
  describe('inline formatting', () => {
    it('removes bold formatting', () => {
      expect(stripWhatsAppFormatting('*bold text*')).toBe('bold text');
    });

    it('removes italic formatting', () => {
      expect(stripWhatsAppFormatting('_italic text_')).toBe('italic text');
    });

    it('removes strikethrough formatting', () => {
      expect(stripWhatsAppFormatting('~strikethrough~')).toBe('strikethrough');
    });

    it('removes inline code formatting', () => {
      expect(stripWhatsAppFormatting('`code`')).toBe('code');
    });

    it('removes code block formatting', () => {
      expect(stripWhatsAppFormatting('```code block```')).toBe('code block');
    });
  });

  describe('block formatting', () => {
    it('removes quote markers', () => {
      expect(stripWhatsAppFormatting('> quoted text')).toBe('quoted text');
    });

    it('removes bullet list markers with asterisk', () => {
      expect(stripWhatsAppFormatting('* list item')).toBe('list item');
    });

    it('removes bullet list markers with dash', () => {
      expect(stripWhatsAppFormatting('- list item')).toBe('list item');
    });

    it('removes numbered list markers', () => {
      expect(stripWhatsAppFormatting('1. first item')).toBe('first item');
    });
  });

  describe('combined formatting', () => {
    it('removes multiple formatting types', () => {
      expect(stripWhatsAppFormatting('*bold* and _italic_')).toBe('bold and italic');
    });

    it('handles nested formatting', () => {
      expect(stripWhatsAppFormatting('*_bold italic_*')).toBe('bold italic');
    });

    it('handles complex text with multiple formats', () => {
      const input = '> Quote with *bold* and `code`';
      const expected = 'Quote with bold and code';
      expect(stripWhatsAppFormatting(input)).toBe(expected);
    });
  });

  describe('edge cases', () => {
    it('handles plain text without formatting', () => {
      expect(stripWhatsAppFormatting('plain text')).toBe('plain text');
    });

    it('handles empty string', () => {
      expect(stripWhatsAppFormatting('')).toBe('');
    });

    it('preserves unmatched formatting characters', () => {
      expect(stripWhatsAppFormatting('asterisk * alone')).toBe('asterisk * alone');
    });
  });
});
