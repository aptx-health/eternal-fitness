import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Rajdhani } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  weight: ['500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-rajdhani',
  display: 'swap',
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "Ripit - Strength Training Tracker",
  description: "Track your strength training workouts",
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Ripit",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Check localStorage first, fall back to system preference
                const stored = localStorage.getItem('darkMode');
                let isDark;

                if (stored !== null) {
                  isDark = stored === 'true';
                } else {
                  isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                }

                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }

                // Listen for system preference changes only if no user preference is stored
                if (stored === null) {
                  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                  const updateDarkMode = (e) => {
                    if (e.matches) {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                  };
                  darkModeMediaQuery.addEventListener('change', updateDarkMode);
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${rajdhani.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
