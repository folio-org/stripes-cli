import React from 'react';
import PropTypes from 'prop-types';
import Link from 'react-router-dom/Link';
import { Pane, Paneset } from '@folio/stripes/components';
import NewAppGreeting from '../components/new-app-greeting';

export default class Application extends React.Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
  }

  render() {
    return (
      <Paneset>
        <Pane defaultWidth="fill" fluidContentWidth paneTitle="<%= displayName %>">
          <NewAppGreeting />
          <br />
          <ul>
            <li data-test-application-examples>
              View the
              {' '}
              <Link to={`${this.props.match.path}/examples`}>examples page</Link>
              {' '}
              to see some useful components.
            </li>
            <li data-test-application-guide>
              Please refer to the
              {' '}
              <a href="https://github.com/folio-org/stripes/blob/master/doc/dev-guide.md">
                Stripes Module Developer&apos;s Guide
              </a>
              {' '}
              for more information.
            </li>
          </ul>
        </Pane>
      </Paneset>
    );
  }
}
