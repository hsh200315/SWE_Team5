import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="kr">
      <head>
        <link
        href="https://fonts.googleapis.com/css2?family=Roboto:wght@100;300;400;700&display=swap"
        rel="stylesheet"
        />
      </head>
      <body
        className={`antialiased`}
        style={{fontFamily: "Roboto, sans-serif"}}
      >
        {children}
      </body>
    </html>
  );
}
