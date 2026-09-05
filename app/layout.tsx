import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Iteration — Creative Performance Lab", description: "Generate campaign creative and improve it with performance signals.", icons: { icon: "/favicon.svg" } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
