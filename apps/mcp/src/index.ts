import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createProductMcpServer } from './server.js';
import { createMcpServices } from './services.js';

const services = createMcpServices();

const handle = serveStdio(() => createProductMcpServer(services), {
  onerror: (error) => {
    process.stderr.write(`[lso-mcp] ${error.message}\n`);
  },
});

async function shutdown(): Promise<void> {
  await handle.close();
  await services.shutdown();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown();
});
process.on('SIGTERM', () => {
  void shutdown();
});
