import React from 'react';
// import PropTypes from 'prop-types';
import Link from 'react-router-dom/Link';
import Switch from 'react-router-dom/Switch';
import Route from 'react-router-dom/Route';
import Application from './routes/application';
import ExamplePage from './routes/example-page';
import Settings from './routes/settings';

class <%= componentName %> extends React.Component {
  render() {
    if (this.props.showSettings) {
      return <Settings {...this.props} />;
    }
    return (
      <div>
        <Route path={`${this.props.match.path}`} component={Application} />
        <ul>
          <li><Link to={`${this.props.match.path}`}>[home]</Link></li>
          <li><Link to={`${this.props.match.path}/examples`}>[examples]</Link></li>
        </ul>
        <Switch>
          <Route path={`${this.props.match.path}/examples`} exact component={ExamplePage} />
        </Switch>
      </div>
    );
  }
}

export default <%= componentName %>;
