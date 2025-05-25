import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="kr">
      <body
        className={`antialiased`}
      >
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  );
}
