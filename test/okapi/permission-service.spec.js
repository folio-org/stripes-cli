const expect = require('chai').expect;
const fs = require('fs');

const PermissionService = require('../../lib/okapi/permission-service');
const OkapiError = require('../../lib/okapi/okapi-error');

const jsonResponseStub = (data) => {
  return Promise.resolve({
    json: () => data,
  });
};

const okapiStub = {
  perms: {
    assignPermissionToUser: (permissionName) => {
      if (permissionName === 'ui-module.existing') {
        return Promise.reject(new OkapiError({}, 'already has permission'));
      }
      return jsonResponseStub({});
    },
    unassignPermissionFromUser: (permissionName) => {
      if (permissionName === 'ui-module.new') {
        return Promise.reject(new OkapiError({}, 'does not contain'));
      }
      return jsonResponseStub({});
    },
    getUserPermissions: (userUuid) => jsonResponseStub({
      permissionNames: [
        'ui-module.existing',
        'one.foo',
        'two.bar'
      ],
      totalRecords: 3,
    }),
  },
  users: {
    getUserByUsername: (username) => jsonResponseStub({
      users: [
        {
          id: `${username}_uuid`,
          username,
        }
      ]
    }),
  }
};

const contextStub = {
  cwd: '/path/to/working/directory',
};

const packageJsonStub = {
  name: 'ui-module',
  stripes: {
    type: 'app',
    permissionSets: [
      {
        permissionName: 'ui-module.existing',
        displayName: 'An existing ui-module permission',
      },
    ]
  }
};

describe('The permission-service', function () {
  describe('constructor', function () {
    it('accepts an okapi repository', function () {
      const okapiRepository = {};
      const sut = new PermissionService(okapiRepository);
      expect(sut.okapi).to.equal(okapiRepository);
    });

    it('accepts a context', function () {
      const sut = new PermissionService(okapiStub, contextStub);
      expect(sut.context).to.be.an('object').with.property('cwd');
    });
  });

  describe('addPermissionToPackage method', function () {
    beforeEach(function () {
      this.sut = new PermissionService(okapiStub, contextStub);
      this.sandbox.stub(this.sut, '_loadPackageJson').returns(packageJsonStub);
      this.sandbox.stub(fs, 'writeFile').callsFake((filePath, packageJson, callback) => callback());
    });

    it('Adds permission to permissionSets', function (done) {
      const newPermission = {
        permissionName: 'ui-module.new',
        displayName: 'A new ui-module permission',
        visible: true,
      };

      this.sut.addPermissionToPackage(newPermission)
        .then((result) => {
          expect(fs.writeFile).to.have.been.calledOnce;
          expect(result.stripes.permissionSets).to.include(newPermission);
          done();
        });
    });

    it('Does not overwrite an existing permission', function (done) {
      const newPermission = {
        permissionName: 'ui-module.existing',
        displayName: 'A new permission using an existing name',
        visible: true,
      };

      this.sut.addPermissionToPackage(newPermission)
        .then((result) => {
          expect(fs.writeFile).to.not.have.been.called;
          expect(result).to.be.false;
          done();
        });
    });
  });

  describe('assignPermissionToUserId method', function () {
    beforeEach(function () {
      this.sut = new PermissionService(okapiStub, contextStub);
      this.sandbox.spy(okapiStub.perms, 'assignPermissionToUser');
    });

    it('Returns success for new assignment', function (done) {
      this.sut.assignPermissionToUserId('ui-module.new', 'user_uuid')
        .then((result) => {
          expect(okapiStub.perms.assignPermissionToUser).to.have.been.calledOnce;
          expect(result.id).to.equal('ui-module.new');
          expect(result.success).to.be.true;
          done();
        });
    });

    it('Returns alreadyExists for existing assignment', function (done) {
      this.sut.assignPermissionToUserId('ui-module.existing', 'user_uuid')
        .then((result) => {
          expect(okapiStub.perms.assignPermissionToUser).to.have.been.calledOnce;
          expect(result.id).to.equal('ui-module.existing');
          expect(result.success).to.be.undefined;
          expect(result.alreadyExists).to.be.true;
          done();
        });
    });
  });

  describe('assignPermissionToUser method', function () {
    beforeEach(function () {
      this.sut = new PermissionService(okapiStub, contextStub);
      this.sandbox.spy(okapiStub.users, 'getUserByUsername');
      this.sandbox.spy(this.sut, 'assignPermissionToUserId');
    });

    it('Looks up user uuid with username', function (done) {
      this.sut.assignPermissionToUser('ui-module.new', 'diku_admin')
        .then(() => {
          expect(okapiStub.users.getUserByUsername).to.have.been.calledWith('diku_admin');
          expect(this.sut.assignPermissionToUserId).to.have.been.calledWith('ui-module.new', 'diku_admin_uuid');
          done();
        });
    });

    it('Returns success for new assignment', function (done) {
      this.sut.assignPermissionToUser('ui-module.new', 'diku_admin')
        .then((result) => {
          expect(result.id).to.equal('ui-module.new');
          expect(result.success).to.be.true;
          done();
        });
    });

    it('Returns alreadyExists for existing assignment', function (done) {
      this.sut.assignPermissionToUser('ui-module.existing', 'diku_admin')
        .then((result) => {
          expect(result.id).to.equal('ui-module.existing');
          expect(result.success).to.be.undefined;
          expect(result.alreadyExists).to.be.true;
          done();
        });
    });
  });

  describe('assignPermissionsToUser method', function () {
    beforeEach(function () {
      this.sut = new PermissionService(okapiStub, contextStub);
      this.sandbox.spy(okapiStub.users, 'getUserByUsername');
      this.sandbox.spy(this.sut, 'assignPermissionToUserId');
    });

    it('Looks up user uuid with username', function (done) {
      this.sut.assignPermissionsToUser(['ui-module.new'], 'diku_admin')
        .then(() => {
          expect(okapiStub.users.getUserByUsername).to.have.been.calledWith('diku_admin');
          expect(this.sut.assignPermissionToUserId).to.have.been.calledWith('ui-module.new', 'diku_admin_uuid');
          done();
        });
    });

    it('Makes multiple requests for each permission', function (done) {
      this.sut.assignPermissionsToUser(['ui-module.new', 'ui-module.existing'], 'diku_admin')
        .then(() => {
          expect(this.sut.assignPermissionToUserId).to.have.been.calledTwice;
          done();
        });
    });

    it('Returns success/alreadyExists for new/existing assignments', function (done) {
      this.sut.assignPermissionsToUser(['ui-module.new', 'ui-module.existing'], 'diku_admin')
        .then((results) => {
          expect(results[0].id).to.equal('ui-module.new');
          expect(results[0].success).to.be.true;

          expect(results[1].id).to.equal('ui-module.existing');
          expect(results[1].success).to.be.undefined;
          expect(results[1].alreadyExists).to.be.true;
          done();
        });
    });
  });

  describe('listPermissionsForUser method', function () {
    beforeEach(function () {
      this.sut = new PermissionService(okapiStub, contextStub);
      this.sandbox.spy(okapiStub.users, 'getUserByUsername');
      this.sandbox.spy(okapiStub.perms, 'getUserPermissions');
      this.sandbox.spy(this.sut, 'assignPermissionToUserId');
    });

    it('Looks up user uuid with username', function (done) {
      this.sut.listPermissionsForUser('diku_admin')
        .then(() => {
          expect(okapiStub.users.getUserByUsername).to.have.been.calledWith('diku_admin');
          done();
        });
    });

    it('Returns user permissions', function (done) {
      this.sut.listPermissionsForUser('diku_admin')
        .then((response) => {
          expect(okapiStub.perms.getUserPermissions).to.have.been.calledWith('diku_admin_uuid');
          expect(response).to.be.an('array').with.lengthOf(3);
          expect(response[0]).to.equal('ui-module.existing');
          done();
        });
    });
  });

  describe('unassignPermissionFromUserId method', function () {
    beforeEach(function () {
      this.sut = new PermissionService(okapiStub, contextStub);
      this.sandbox.spy(okapiStub.perms, 'unassignPermissionFromUser');
    });

    it('Returns success for unassignment', function (done) {
      this.sut.unassignPermissionFromUserId('ui-module.existing', 'user_uuid')
        .then((result) => {
          expect(okapiStub.perms.unassignPermissionFromUser).to.have.been.calledOnce;
          expect(result.id).to.equal('ui-module.existing');
          expect(result.success).to.be.true;
          done();
        });
    });

    it('Returns alreadySatisfied when already unassigned', function (done) {
      this.sut.unassignPermissionFromUserId('ui-module.new', 'user_uuid')
        .then((result) => {
          expect(okapiStub.perms.unassignPermissionFromUser).to.have.been.calledOnce;
          expect(result.id).to.equal('ui-module.new');
          expect(result.success).to.be.undefined;
          expect(result.alreadySatisfied).to.be.true;
          done();
        });
    });
  });

  describe('unassignPermissionsFromUser method', function () {
    beforeEach(function () {
      this.sut = new PermissionService(okapiStub, contextStub);
      this.sandbox.spy(okapiStub.users, 'getUserByUsername');
      this.sandbox.spy(this.sut, 'unassignPermissionFromUserId');
    });

    it('Looks up user uuid with username', function (done) {
      this.sut.unassignPermissionsFromUser(['ui-module.new'], 'diku_admin')
        .then(() => {
          expect(okapiStub.users.getUserByUsername).to.have.been.calledWith('diku_admin');
          expect(this.sut.unassignPermissionFromUserId).to.have.been.calledWith('ui-module.new', 'diku_admin_uuid');
          done();
        });
    });

    it('Makes multiple requests for each permission', function (done) {
      this.sut.unassignPermissionsFromUser(['ui-module.new', 'ui-module.existing'], 'diku_admin')
        .then(() => {
          expect(this.sut.unassignPermissionFromUserId).to.have.been.calledTwice;
          done();
        });
    });

    it('Returns success/alreadySatisfied for new/existing unassignments', function (done) {
      this.sut.unassignPermissionsFromUser(['ui-module.new', 'ui-module.existing'], 'diku_admin')
        .then((results) => {
          expect(results[0].id).to.equal('ui-module.new');
          expect(results[0].success).to.be.undefined;
          expect(results[0].alreadySatisfied).to.be.true;

          expect(results[1].id).to.equal('ui-module.existing');
          expect(results[1].success).to.be.true;
          done();
        });
    });
  });

  describe('assignAllTenantPermissionsToUser method', function () {
    beforeEach(function () {
      this.sut = new PermissionService(okapiStub, contextStub);
      this.sandbox.stub(this.sut.moduleService, 'listModulesForTenant').resolves(['folio_one', 'mod-two', 'mod-three']);
      this.sandbox.stub(this.sut.moduleService, 'listModulePermissions').resolves(['one.foo', 'two.bar', 'three.foo', 'three.bar']);
    });

    it('Returns permission names for all new assignments', function (done) {
      this.sut.assignAllTenantPermissionsToUser('diku', 'diku_admin')
        .then((results) => {
          // Should return the moduleService stub for "listModulePermissions" less okapiStub.perms.getUserPermissions
          expect(results).to.be.an('array').with.lengthOf(2);
          expect(results).to.include.members(['three.foo', 'three.bar']);
          expect(results).to.not.include('one.foo').and.not.include('two.bar');
          done();
        });
    });
  });
});
