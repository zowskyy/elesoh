import { describe, expect, it } from 'vitest';
import { extractHtmlPage } from './extract-html.js';

describe('extractHtmlPage', () => {
  it('extracts title, meta, and links from HTML', () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Example Site</title>
  <meta name="description" content="A test page">
  <link rel="canonical" href="https://example.com/">
</head>
<body>
  <h1>Hello</h1>
  <a href="/about">About</a>
</body>
</html>`;
    const page = extractHtmlPage(html, 'https://example.com/', 'https://example.com/', 200);
    expect(page.title).toBe('Example Site');
    expect(page.description).toBe('A test page');
    expect(page.canonical).toBe('https://example.com/');
    expect(page.language).toBe('en');
    expect(page.headings[0]?.text).toBe('Hello');
    expect(page.links[0]?.href).toBe('https://example.com/about');
  });
});
