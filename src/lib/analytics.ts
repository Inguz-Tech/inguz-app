// Google Analytics 4 tracking utilities

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Track page views
export const trackPageView = (pagePath: string, pageTitle?: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'page_view', {
      page_path: pagePath,
      page_title: pageTitle,
    });
  }
};

// Track custom events
export const trackEvent = (
  eventName: string,
  params?: Record<string, any>
) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, params);
  }
};

// Pre-defined event helpers
export const analytics = {
  // Auth events
  login: (method: string = 'email') => 
    trackEvent('login', { method }),
  
  signup: (method: string = 'email') => 
    trackEvent('sign_up', { method }),
  
  logout: () => 
    trackEvent('logout'),

  // Navigation events
  navigateTo: (page: string) => 
    trackEvent('navigate', { destination: page }),

  // Conversation events
  selectConversation: (conversationId: string) => 
    trackEvent('select_conversation', { conversation_id: conversationId }),
  
  viewContactDetails: (contactId: string) => 
    trackEvent('view_contact', { contact_id: contactId }),

  // Button click events
  buttonClick: (buttonName: string, location?: string) => 
    trackEvent('button_click', { 
      button_name: buttonName,
      location: location 
    }),

  // Feature usage
  useFeature: (featureName: string, details?: Record<string, any>) => 
    trackEvent('feature_use', { 
      feature: featureName,
      ...details 
    }),
};
