// Logic borrowed from stripes-core's package2md.js excluding file load and console output
// $ node ../stripes-core/util/package2md.js package.json > MD.json
module.exports = function generateModuleDescriptor(packageJson, isStrict) {
  const stripes = packageJson.stripes || {};
  const interfaces = stripes.okapiInterfaces || [];
  const moduleDescriptor = {
    id: `${packageJson.name.replace(/^@/, '').replace('/', '_')}-${packageJson.version}`,
    name: packageJson.description,
    permissionSets: stripes.permissionSets || [],
  };
  if (isStrict) {
    moduleDescriptor.requires = Object.keys(interfaces).map(key => ({ id: key, version: interfaces[key] }));
  }
  return moduleDescriptor;
};
