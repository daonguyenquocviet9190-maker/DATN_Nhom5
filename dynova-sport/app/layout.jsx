import "./globals.css";

export const metadata = {
  title: "Dynova Sport Shop",
  description: "Website bán đồ thể thao với giỏ hàng, thanh toán, đơn hàng và trang quản trị.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi" data-scroll-behavior="smooth">
      <body>{children}</body>
    </html>
  );
}
