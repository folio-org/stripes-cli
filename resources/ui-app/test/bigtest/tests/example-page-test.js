import { beforeEach, describe, it } from '@bigtest/mocha';
import { expect } from 'chai';

import setupApplication from '../helpers/setup-application';
import ExamplePageInteractor from '../interactors/example-page';

describe('ExamplePage', () => {
  const examplePage = new ExamplePageInteractor();

  setupApplication();

  beforeEach(function () {
    this.visit('<%= appRoute %>/examples');
  });

  it('has a link home', () => {
    expect(examplePage.homeLink).to.include('<% appRoute %>');
  });

  it('has a link to stripes-components', () => {
    expect(examplePage.componentsLink).to.include('/folio-org/stripes-components/');
  });

  it('has an example button', () => {
    expect(examplePage.button.isPresent).to.be.true;
  });

  describe('clicking the example button', () => {
    beforeEach(async () => {
      await examplePage.button.click();
    });

    it('shows a greetings modal', () => {
      expect(examplePage.modal.greetingMessage).to.equal('Congratulations!');
    });
  });
});
