const path = require('path');

const cwd = path.resolve();

class AliasError extends Error {
  constructor(...args) {
    super(...args);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, AliasError);
  }
}

// Validates a relative path alias and returns the absolute path
function validateAlias(moduleName, modulePath) {
  const absolutePath = path.isAbsolute(modulePath) ? modulePath : path.join(cwd, modulePath);
  const packageJsonPath = path.join(absolutePath, '/package.json');
  try {
    require.resolve(packageJsonPath);
  } catch (error) {
    throw new AliasError(`No package.json found at ${packageJsonPath}`);
  }
  // Validate that this package looks like a Stripes module
  const { name, stripes } = require(packageJsonPath); // eslint-disable-line
  if (name !== moduleName) {
    throw new AliasError(`Found module ${name}, but was expecting ${moduleName}`);
  } else if (!stripes) {
    throw new AliasError(`Module ${name} does not contain a stripes configuration`);
  }

  return absolutePath;
}

function validateAliases(originalAliases) {
  const aliases = {};
  const moduleNames = Object.getOwnPropertyNames(originalAliases);
  for (const moduleName of moduleNames) {
    aliases[moduleName] = validateAlias(moduleName, originalAliases[moduleName]);
  }
  return aliases;
}

module.exports = {
  validateAlias,
  validateAliases,
  AliasError,
};