export const site = {
  name: 'DepthLume',
  version: 'Website 1.0b · Iteration 1',
  url: 'https://depthlume.com',
  locale: 'en',
  contactPlaceholder: '[contact email to be confirmed]',
  productStatus: 'Closed beta',
  description:
    'Professional Windows desktop market intelligence for cryptocurrency futures research.',
  legalReviewRequired: true,
} as const;

export const navigation = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Scenario Lab', href: '/#scenario-lab' },
  { label: 'Screenshots', href: '/#screenshots' },
  { label: 'FAQ', href: '/#faq' },
  { label: 'Documentation', href: '/documentation/' },
] as const;

export const footerGroups = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/#features' },
      { label: 'Scenario Lab', href: '/#scenario-lab' },
      { label: 'Closed Beta', href: '/closed-beta/' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/documentation/' },
      { label: 'Contact', href: '/closed-beta/#contact' },
      { label: 'Screenshots', href: '/#screenshots' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '/privacy/' },
      { label: 'Terms', href: '/terms/' },
      { label: 'Risk Disclaimer', href: '/risk-disclaimer/' },
    ],
  },
] as const;
