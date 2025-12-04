const { omit } = require('lodash');

module.exports = function generateModuleDescriptor(packageJson, isStrict) {
  const stripes = packageJson.stripes || {};
  const moduleDescriptor = {
    id: `${packageJson.name.replace(/^@/, '').replace('/', '_')}-${packageJson.version}`,
    name: packageJson.description || packageJson.name,
    permissionSets: stripes.permissionSets || [],
  };
  if (isStrict) {
    const interfaces = stripes.okapiInterfaces || [];
    moduleDescriptor.requires = Object.keys(interfaces).map(key => ({ id: key, version: interfaces[key] }));
    const optional = stripes.optionalOkapiInterfaces || [];
    moduleDescriptor.optional = Object.keys(optional).map(key => ({ id: key, version: optional[key] }));
    moduleDescriptor.metadata = {
      stripes: omit(stripes, ['okapiInterfaces', 'optionalOkapiInterfaces', 'permissionSets']),
    };
  }
  return moduleDescriptor;
};
