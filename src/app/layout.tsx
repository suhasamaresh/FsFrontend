import Navbar from "./components/navbar";
import "./globals.css";
// import "@0xsequence/design-system/styles.css";

import { Contexts } from "@/app/contexts";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" />
        <title>FlashSplit</title>
      </head>
      <body>
        <Contexts>
          {children}
        </Contexts>
      </body>
    </html>
  );
}
