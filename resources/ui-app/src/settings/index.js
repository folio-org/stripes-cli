import React from 'react';
import { Settings } from '@folio/stripes-smart-components';
import GeneralSettings from './general-settings';
import SomeFeatureSettings from './some-feature-settings';

/*
  STRIPES-NEW-APP
  Your app's settings pages are defined here.
  The pages "general" and "some feature" are examples. Name them however you like.
*/

export default class <%= componentName %>Settings extends React.Component {
  pages = [
    {
      route: 'general',
      label: this.props.stripes.intl.formatMessage({ id: '<%= uiAppName %>.settings.general' }),
      component: GeneralSettings,
    },
    {
      route: 'somefeature',
      label: this.props.stripes.intl.formatMessage({ id: '<%= uiAppName %>.settings.some-feature' }),
      component: SomeFeatureSettings,
    },
  ];

  render() {
    return (
      <Settings {...this.props} pages={this.pages} paneTitle="<%= displayName %>" />
    );
  }
}
