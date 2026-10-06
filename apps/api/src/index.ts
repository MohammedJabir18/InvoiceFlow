import { buildServer } from './server.js';
import { getConfig } from './config.js';

async function main() {
  const config = getConfig();
  const server = await buildServer();

  try {
    await server.listen({
      port: config.PORT,
      host: config.HOST,
    });
    console.log(`InvoiceFlow API running at http://${config.HOST}:${config.PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

main();
