import {
  interactor,
  text
} from '@bigtest/interactor';

export default @interactor class SettingsInteractor {
  generalMessage = text('[data-test-application-settings-general-message]');
  featureMessage = text('[data-test-application-settings-feature-message]');
}
