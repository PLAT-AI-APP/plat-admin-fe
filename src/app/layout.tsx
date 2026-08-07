import type { Metadata } from "next";
import MSWProvider from "@/providers/MSWProvider";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import SonnerProvider from "@/providers/SonnerProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import ConfirmDialogHost from "@/components/ui/ConfirmDialogHost";
import "./globals.css";

export const metadata: Metadata = {
  title: "PLAT 관리자",
  description: "PLAT 서비스 운영 관리자",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <MSWProvider>
            <ReactQueryProvider>
              {children}
              <ConfirmDialogHost />
              <SonnerProvider />
            </ReactQueryProvider>
          </MSWProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
