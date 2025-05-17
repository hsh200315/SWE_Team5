
export default function RootLayout({ children }) {
  return (
    <html lang="kr">
      <body
        className={`antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
