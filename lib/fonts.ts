import localFont from 'next/font/local';

export const adelleSans = localFont({
  src: [
    {
      path: '../public/fonts/AdelleSans-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/AdelleSans-Regular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/AdelleSans-Semibold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../public/fonts/AdelleSans-Semibold.woff',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-adelle-sans',
  display: 'swap',
  preload: true,
});
