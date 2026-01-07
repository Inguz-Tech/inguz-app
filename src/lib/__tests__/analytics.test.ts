import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackPageView, trackEvent, analytics } from '../analytics';

describe('Analytics', () => {
  const mockGtag = vi.fn();

  beforeEach(() => {
    window.gtag = mockGtag;
    mockGtag.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('trackPageView', () => {
    it('sends page_view event with path', () => {
      trackPageView('/dashboard');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
        page_path: '/dashboard',
        page_title: undefined,
      });
    });

    it('sends page_view event with path and title', () => {
      trackPageView('/agents', 'Agents Page');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
        page_path: '/agents',
        page_title: 'Agents Page',
      });
    });

    it('does not throw when gtag is undefined', () => {
      // @ts-ignore - testing undefined case
      delete window.gtag;
      
      expect(() => trackPageView('/test')).not.toThrow();
    });
  });

  describe('trackEvent', () => {
    it('sends custom event with name only', () => {
      trackEvent('button_click');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'button_click', undefined);
    });

    it('sends custom event with params', () => {
      trackEvent('purchase', { value: 100, currency: 'BRL' });
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', {
        value: 100,
        currency: 'BRL',
      });
    });

    it('does not throw when gtag is undefined', () => {
      // @ts-ignore - testing undefined case
      delete window.gtag;
      
      expect(() => trackEvent('test_event')).not.toThrow();
    });
  });

  describe('analytics helpers', () => {
    describe('login', () => {
      it('sends login event with default method', () => {
        analytics.login();
        
        expect(mockGtag).toHaveBeenCalledWith('event', 'login', { method: 'email' });
      });

      it('sends login event with custom method', () => {
        analytics.login('google');
        
        expect(mockGtag).toHaveBeenCalledWith('event', 'login', { method: 'google' });
      });
    });

    describe('signup', () => {
      it('sends sign_up event with default method', () => {
        analytics.signup();
        
        expect(mockGtag).toHaveBeenCalledWith('event', 'sign_up', { method: 'email' });
      });

      it('sends sign_up event with custom method', () => {
        analytics.signup('github');
        
        expect(mockGtag).toHaveBeenCalledWith('event', 'sign_up', { method: 'github' });
      });
    });

    describe('logout', () => {
      it('sends logout event', () => {
        analytics.logout();
        
        expect(mockGtag).toHaveBeenCalledWith('event', 'logout', undefined);
      });
    });

    describe('navigateTo', () => {
      it('sends navigate event with destination', () => {
        analytics.navigateTo('settings');
        
        expect(mockGtag).toHaveBeenCalledWith('event', 'navigate', { destination: 'settings' });
      });
    });

    describe('selectConversation', () => {
      it('sends select_conversation event', () => {
        analytics.selectConversation('conv-123');
        
        expect(mockGtag).toHaveBeenCalledWith('event', 'select_conversation', {
          conversation_id: 'conv-123',
        });
      });
    });

    describe('viewContactDetails', () => {
      it('sends view_contact event', () => {
        analytics.viewContactDetails('contact-456');
        
        expect(mockGtag).toHaveBeenCalledWith('event', 'view_contact', {
          contact_id: 'contact-456',
        });
      });
    });

    describe('buttonClick', () => {
      it('sends button_click event with name only', () => {
        analytics.buttonClick('submit');
        
        expect(mockGtag).toHaveBeenCalledWith('event', 'button_click', {
          button_name: 'submit',
          location: undefined,
        });
      });

      it('sends button_click event with name and location', () => {
        analytics.buttonClick('save', 'settings-page');
        
        expect(mockGtag).toHaveBeenCalledWith('event', 'button_click', {
          button_name: 'save',
          location: 'settings-page',
        });
      });
    });

    describe('useFeature', () => {
      it('sends feature_use event with feature name', () => {
        analytics.useFeature('dark-mode');
        
        expect(mockGtag).toHaveBeenCalledWith('event', 'feature_use', {
          feature: 'dark-mode',
        });
      });

      it('sends feature_use event with details', () => {
        analytics.useFeature('export', { format: 'csv', rows: 100 });
        
        expect(mockGtag).toHaveBeenCalledWith('event', 'feature_use', {
          feature: 'export',
          format: 'csv',
          rows: 100,
        });
      });
    });
  });
});
