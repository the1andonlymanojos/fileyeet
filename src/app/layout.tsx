import Image from "next/image";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FileYeet",
  description: "A simple way to share your files privately.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="bg-gray-100 dark:bg-gray-900 p-4">
          <div className="container mx-auto my-auto flex items-center">
            {/* Light Theme Logo */}
            <div className="block dark:hidden">
              <Image
                src="/logo-light.png" // Path to the light theme logo
                alt="App Logo Light"
                width={300} // Adjust the width as needed
                height={48} // Adjust the height as needed
                priority
              />
            </div>
            {/* Dark Theme Logo */}
            <div className="hidden dark:block">
              <Image
                src="/logo.png" // Path to the dark theme logo
                alt="App Logo Dark"
                width={300} // Adjust the width as needed
                height={48} // Adjust the height as needed
                priority
              />
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="mt-16 text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2024 FileYeet. All rights reserved.</p>
          <p>
            This product is under active development by Manoj Shivagange. <br />
            It may not work on networks where UDP is blocked <br />
            and/or if the sender and receiver aren&apos;t on the same network.
            <br />
            Feedback is much appreciated! <br />
          </p>
        </footer>
      </body>
    </html>
  );
}
