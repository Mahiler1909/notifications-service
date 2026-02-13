import { readFileSync, writeFileSync, mkdtempSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';
import { tmpdir } from 'os';

const nodeEnv = process.env.NODE_ENV || 'dev';
const YAML_CONFIG_FILENAME = `config.${nodeEnv}.yaml`;

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

export default (): Record<string, unknown> => {
  return yaml.load(
    readFileSync(
      join(__dirname, '../../configuration', YAML_CONFIG_FILENAME),
      'utf8',
    ),
  ) as Record<string, unknown>;
};
