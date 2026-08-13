import { createServer } from 'node:http';
import { crawlWebsite } from '../../packages/crawler/src/index.ts';

const html = `<!DOCTYPE html>
<html lang="en"><head>
<title>LSO Fixture Home</title>
<meta name="description" content="fixture" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<link rel="canonical" href="http://127.0.0.1:4177/" />
<meta property="og:title" content="LSO Fixture" />
</head><body>
<h1>Fixture Home</h1>
<a href="/about">About</a>
<img src="/logo.png" alt="Logo" />
</body></html>`;

const about = `<!DOCTYPE html><html><head><title>About Fixture</title></head>
<body><h1>About</h1><a href="/">Home</a></body></html>`;

const port = 4177;
const server = createServer((req, res) => {
  const url = req.url ?? '/';
  if (url.startsWith('/about')) {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(about);
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(html);
});

await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));

try {
  const result = await crawlWebsite(`http://127.0.0.1:${port}/`, {
    maxPages: 5,
    maxDepth: 1,
    concurrency: 2,
    navigationTimeoutMs: 15_000,
    allowLocalhost: true,
  });
  console.log(
    JSON.stringify(
      {
        seedUrl: result.seedUrl,
        pageCount: result.pages.length,
        titles: result.pages.map((p) => p.title),
        first: result.pages[0]
          ? {
              url: result.pages[0].finalUrl,
              title: result.pages[0].title,
              description: result.pages[0].description,
              headings: result.pages[0].headings.length,
              links: result.pages[0].links.length,
            }
          : null,
      },
      null,
      2,
    ),
  );
  if (result.pages.length < 1) {
    process.exitCode = 1;
  }
} finally {
  server.close();
}
