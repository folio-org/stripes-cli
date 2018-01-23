const expect = require('chai').expect;
const OkapiClient = require('../../lib/okapi/okapi-client');


describe('The okapi-client', function () {
  beforeEach(function () {
    this.sut = new OkapiClient('http://localhost:9130', 'diku');
    this.sandbox.stub(this.sut.tokenStorage, 'getToken').callsFake(() => 'test-token');
  });

  describe('_options method', function () {
    it('applies default headers', function () {
      const result = this.sut._options({ method: 'POST', body: 'test-body' });
      expect(result).to.be.an('object').with.property('headers');
      expect(result.headers).to.have.property('content-type', 'application/json');
      expect(result.headers).to.have.property('x-okapi-token', 'test-token');
      expect(result.headers).to.have.property('x-okapi-tenant', 'diku');
    });

    it('does not apply x-okapi-token when token option is false', function () {
      const result = this.sut._options({ method: 'POST', body: 'test-body' }, { token: false });
      expect(result).to.be.an('object').with.property('headers');
      expect(result.headers).to.have.property('content-type', 'application/json');
      expect(result.headers).to.not.have.property('x-okapi-token');
      expect(result.headers).to.have.property('x-okapi-tenant', 'diku');
    });

    it('does not apply x-okapi-tenant when tenant option is false', function () {
      const result = this.sut._options({ method: 'POST', body: 'test-body' }, { tenant: false });
      expect(result.headers).to.have.property('content-type', 'application/json');
      expect(result).to.be.an('object').with.property('headers');
      expect(result.headers).to.have.property('x-okapi-token', 'test-token');
      expect(result.headers).to.not.have.property('x-okapi-tenant');
    });
  });
});
