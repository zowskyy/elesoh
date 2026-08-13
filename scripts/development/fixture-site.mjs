import { createServer } from 'node:http';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>LSO Fixture Home</title>
  <meta name="description" content="LocalSite Optimizer crawl fixture" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="canonical" href="http://127.0.0.1:4173/" />
  <meta property="og:title" content="LSO Fixture" />
</head>
<body>
  <h1>Fixture Home</h1>
  <p>Stage B crawl smoke page.</p>
  <a href="/about">About</a>
  <img src="/logo.png" alt="Logo" />
</body>
</html>`;

const about = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>About Fixture</title>
  <meta name="description" content="About page" />
</head>
<body>
  <h1>About</h1>
  <a href="/">Home</a>
</body>
</html>`;

const port = Number(process.env.FIXTURE_PORT ?? 4173);
const server = createServer((req, res) => {
  const url = req.url ?? '/';
  if (url.startsWith('/about')) {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(about);
    return;
  }
  if (url.startsWith('/logo.png')) {
    res.writeHead(204);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`fixture listening on http://127.0.0.1:${port}/\n`);
});
