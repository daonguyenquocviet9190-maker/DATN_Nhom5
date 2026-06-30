import "./globals.css";

export const metadata = {
  title: "Dynova Sport",
  description: "Website bán đồ thể thao Dynova Sport",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}