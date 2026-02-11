import { readFileSync } from 'fs';
import * as yaml from 'js-yaml';
import { join } from 'path';

const nodeEnv = process.env.NODE_ENV || 'dev';
const YAML_CONFIG_FILENAME = `config.${nodeEnv}.yaml`;

export default (): Record<string, unknown> => {
  return yaml.load(
    readFileSync(
      join(__dirname, '../../../configuration', YAML_CONFIG_FILENAME),
      'utf8',
    ),
  ) as Record<string, unknown>;
};
