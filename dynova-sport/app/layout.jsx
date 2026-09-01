import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "Dynova Sport",
  description: "Website bán đồ thể thao Dynova Sport",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body className={beVietnamPro.className}>
        {children}
      </body>
    </html>
  );
}