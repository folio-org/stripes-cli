import React from 'react';
import Settings from '@folio/stripes-components/lib/Settings';
import GeneralSettings from './general-settings';
import SomeFeatureSettings from './some-feature-settings';

/*
  STRIPES-NEW-APP
  Your app's settings pages are defined here.
  The pages "general" and "some feature" are examples. Name them however you like.
*/

const pages = [
  {
    route: 'general',
    label: 'General',
    component: GeneralSettings,
  },
  {
    route: 'somefeature',
    label: 'Some Feature',
    component: SomeFeatureSettings,
  },
];

export default class <%= componentName %>Settings extends React.Component {
  render() {
    return (
      <Settings {...this.props} pages={pages} paneTitle="<%= displayName %>" />
    );
  }
}
