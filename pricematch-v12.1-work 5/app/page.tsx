import fs from "node:fs";
import path from "node:path";
import Script from "next/script";

export default function Home() {
  const html = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
  const body = html.split("<body>")[1].split("</body>")[0].replace('<script src="app.js"></script>', "");
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: body }} />
      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
