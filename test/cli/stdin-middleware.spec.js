const expect = require('chai').expect;
const stdin = require('../../lib/cli/stdin');
const stdinMiddleware = require('../../lib/cli/stdin-middleware');

describe('The stdin-middleware module', function () {
  beforeEach(function () {
    this.sut = stdinMiddleware;
    this.argvStub = {
      foo: 'bar',
    };
  });

  describe('stdinStringMiddleware', function () {
    it('assigns stdin to argv', function (done) {
      this.sandbox.stub(stdin, 'getStdin').resolves('value');
      const middleware = this.sut.stdinStringMiddleware('myString');
      middleware(this.argvStub).then((argv) => {
        expect(argv).to.be.an('object').with.property('myString', 'value');
        done();
      });
    });

    it('does not modify argv without stdin', function (done) {
      this.sandbox.stub(stdin, 'getStdin').resolves();
      const middleware = this.sut.stdinStringMiddleware('myString');
      middleware(this.argvStub).then((argv) => {
        expect(argv).to.be.an('object').that.deep.equals(this.argvStub);
        done();
      });
    });
  });

  describe('stdinJsonMiddleware', function () {
    it('assigns parsed JSON to argv', function (done) {
      this.sandbox.stub(stdin, 'getStdin').resolves(JSON.stringify({ name: 'value' }));
      const middleware = this.sut.stdinJsonMiddleware('myJson');
      middleware(this.argvStub).then((argv) => {
        expect(argv).to.be.an('object').that.deep.equals({
          foo: 'bar',
          myJson: {
            name: 'value',
          },
        });
        done();
      });
    });

    it('does not modify argv without stdin', function (done) {
      this.sandbox.stub(stdin, 'getStdin').resolves();
      const middleware = this.sut.stdinJsonMiddleware('myJson');
      middleware(this.argvStub).then((argv) => {
        expect(argv).to.be.an('object').that.deep.equals(this.argvStub);
        done();
      });
    });
  });

  describe('stdinArrayMiddleware', function () {
    it('assigns array split space to argv', function (done) {
      this.sandbox.stub(stdin, 'getStdin').resolves('one two three');
      const middleware = this.sut.stdinArrayMiddleware('myArray');
      middleware(this.argvStub).then((argv) => {
        expect(argv).to.be.an('object').that.deep.equals({
          foo: 'bar',
          myArray: ['one', 'two', 'three'],
        });
        done();
      });
    });

    it('assigns array split on new lines to argv', function (done) {
      this.sandbox.stub(stdin, 'getStdin').resolves('one\ntwo\nthree');
      const middleware = this.sut.stdinArrayMiddleware('myArray');
      middleware(this.argvStub).then((argv) => {
        expect(argv).to.be.an('object').that.deep.equals({
          foo: 'bar',
          myArray: ['one', 'two', 'three'],
        });
        done();
      });
    });

    it('does not modify argv without stdin', function (done) {
      this.sandbox.stub(stdin, 'getStdin').resolves();
      const middleware = this.sut.stdinArrayMiddleware('myArray');
      middleware(this.argvStub).then((argv) => {
        expect(argv).to.be.an('object').that.deep.equals(this.argvStub);
        done();
      });
    });
  });

  describe('stdinArrayOrJsonMiddleware', function () {
    it('assigns array to argv', function (done) {
      this.sandbox.stub(stdin, 'getStdin').resolves('one two three');
      const middleware = this.sut.stdinArrayMiddleware('myInput');
      middleware(this.argvStub).then((argv) => {
        expect(argv).to.be.an('object').that.deep.equals({
          foo: 'bar',
          myInput: ['one', 'two', 'three'],
        });
        done();
      });
    });

    it('assigns parsed JSON to argv', function (done) {
      this.sandbox.stub(stdin, 'getStdin').resolves(JSON.stringify({ name: 'value' }));
      const middleware = this.sut.stdinArrayOrJsonMiddleware('myInput');
      middleware(this.argvStub).then((argv) => {
        expect(argv).to.be.an('object').that.deep.equals({
          foo: 'bar',
          myInput: {
            name: 'value',
          },
        });
        done();
      });
    });

    it('assigns parsed JSON array to argv', function (done) {
      this.sandbox.stub(stdin, 'getStdin').resolves(JSON.stringify([
        { name: 'value' },
        { name2: 'value2' },
      ]));
      const middleware = this.sut.stdinArrayOrJsonMiddleware('myInput');
      middleware(this.argvStub).then((argv) => {
        expect(argv).to.be.an('object').that.deep.equals({
          foo: 'bar',
          myInput: [
            { name: 'value' },
            { name2: 'value2' },
          ],
        });
        done();
      });
    });

    it('does not modify argv without stdin', function (done) {
      this.sandbox.stub(stdin, 'getStdin').resolves();
      const middleware = this.sut.stdinArrayOrJsonMiddleware('myInput');
      middleware(this.argvStub).then((argv) => {
        expect(argv).to.be.an('object').that.deep.equals(this.argvStub);
        done();
      });
    });
  });
});
