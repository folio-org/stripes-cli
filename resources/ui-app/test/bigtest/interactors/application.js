import {
  interactor,
  text,
  property
} from '@bigtest/interactor';

// https://bigtestjs.io/guides/interactors/introduction/
export default @interactor class ApplicationInteractor {
  greetingMessage = text('[data-test-application-greeting]');
  exampleLink = property('[data-test-application-examples] a', 'href');
  guideLink = property('[data-test-application-guide] a', 'href');
}
