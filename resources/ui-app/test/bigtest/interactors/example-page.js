import {
  interactor,
  text,
  property,
  scoped
} from '@bigtest/interactor';

@interactor class GreetingsModalInteractor {
  greetingMessage = text('[data-test-application-greeting]');
}

export default @interactor class ExamplePageInteractor {
  homeLink = property('[data-test-example-page-home] a', 'href');
  componentsLink = property('[data-test-example-page-components-link]', 'href');
  button = scoped('[data-test-example-page-button] button');
  modal = new GreetingsModalInteractor('[data-test-greeting-modal]');
}
