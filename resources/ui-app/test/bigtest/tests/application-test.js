import { beforeEach, describe, it } from '@bigtest/mocha';
import { expect } from 'chai';

import setupApplication from '../helpers/setup-application';
import ApplicationInteractor from '../interactors/application';

describe('Application', () => {
  const app = new ApplicationInteractor();

  setupApplication();

  beforeEach(function () {
    this.visit('<%= appRoute %>');
  });

  it('shows a greeting message', () => {
    expect(app.greetingMessage).to.equal('Congratulations!');
  });

  it('has a link to examples', () => {
    expect(app.exampleLink).to.include('<%= appRoute %>/examples');
  });

  it('has a link to the developer guides', () => {
    expect(app.guideLink).to.include('/dev-guide.md');
  });
});
