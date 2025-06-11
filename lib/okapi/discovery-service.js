import path from 'path';
import fs from 'fs';

import { resolveIfOkapiSays } from './okapi-utils.js';

export default class DiscoveryService {
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

  addLocalInstanceForContextOnVagrantVM(port) {
    const descriptor = this.getDeploymentDescriptor();

    // Services on the host system are accessible to the guest VM at 10.0.2.2 (standard Vagrant NAT networking setup)
    descriptor.url = `http://10.0.2.2:${port}`;
    descriptor.instId = `${this.context.moduleName}-on-host-added-by-cli`;

    // Not used
    delete descriptor.nodeId;
    delete descriptor.descriptor;

    return this.addInstance(descriptor);
  }

  addInstanceForContext(url) {
    const descriptor = this.getDeploymentDescriptor();
    descriptor.url = url;
    descriptor.instId = `${this.context.moduleName}-at-url-added-by-cli`;

    // Not used
    delete descriptor.nodeId;
    delete descriptor.descriptor;

    return this.addInstance(descriptor);
  }

  removeInstancesForContext() {
    const descriptor = this.getDeploymentDescriptor();
    return this.removeInstances(descriptor.srvcId);
  }
}
