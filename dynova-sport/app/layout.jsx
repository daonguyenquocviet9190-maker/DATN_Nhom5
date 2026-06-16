import "./globals.css"; 

export const metadata = {
  title: 'Dynova Sport Shop',
  description: 'Hệ thống cửa hàng đồ thể thao cao cấp',
}

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}