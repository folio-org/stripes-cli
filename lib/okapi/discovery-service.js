const path = require('path');
const fs = require('fs');
const uuidv4 = require('uuid/v4');
const { resolveIfOkapiSays } = require('../okapi/okapi-utils');


module.exports = class DiscoveryService {
  constructor(okapiRepository, context) {
    this.okapi = okapiRepository;
    this.context = context;
  }

  getDeploymentDescriptor() {
    const descriptorPath = path.join(this.context.cwd, 'target', 'DeploymentDescriptor.json');
    if (!fs.existsSync(descriptorPath)) {
      throw new Error(`Unable to locate deployment descriptor: ${descriptorPath}`);
    }
    const descriptor = JSON.parse(fs.readFileSync(descriptorPath));
    return descriptor;
  }

  listInstances(serviceId) {
    return this.okapi.discovery.getInstances(serviceId)
      .then(response => response.json())
      .catch(resolveIfOkapiSays(serviceId, []));
  }

  addInstance(descriptor) {
    return this.okapi.discovery.addInstance(descriptor)
      .then(response => response.json())
      .then((data) => ({ instId: data.instId, id: data.srvcId, success: true }));
  }

  removeInstances(serviceId) {
    return this.okapi.discovery.removeInstances(serviceId)
      .then(() => ({ id: serviceId, success: true }))
      .catch(resolveIfOkapiSays(serviceId, { id: serviceId }));
  }

  listInstancesForContext() {
    const descriptor = this.getDeploymentDescriptor();
    return this.listInstances(descriptor.srvcId)
      .then((instances) => {
        const response = {
          id: descriptor.srvcId,
          success: instances.length || false,
          instances,
        };
        return response;
      });
  }

  addInstanceForContext(url) {
    const descriptor = this.getDeploymentDescriptor();

    // TODO: Validate URL
    descriptor.url = url;
    descriptor.instId = uuidv4();

    // Not used
    delete descriptor.nodeId;
    delete descriptor.descriptor;

    return this.addInstance(descriptor);
  }

  removeInstancesForContext() {
    const descriptor = this.getDeploymentDescriptor();
    return this.removeInstances(descriptor.srvcId);
  }
};
