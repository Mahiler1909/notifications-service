import { writeFileSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * When GOOGLE_APPLICATION_CREDENTIALS_JSON is set (e.g. on Render),
 * write its contents to a temp file and point GOOGLE_APPLICATION_CREDENTIALS
 * at it so Firebase Admin SDK can pick it up.
 */
if (
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON &&
  !process.env.GOOGLE_APPLICATION_CREDENTIALS
) {
  const tmpDir = mkdtempSync(join(tmpdir(), 'firebase-'));
  const credPath = join(tmpDir, 'service-account.json');
  writeFileSync(credPath, process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
}

export default (): Record<string, unknown> => ({
  http: { port: parseInt(process.env.PORT || '3000', 10) },
  grpc: {
    host: process.env.GRPC_HOST || '0.0.0.0',
    port: parseInt(process.env.GRPC_PORT || '5000', 10),
  },
});
