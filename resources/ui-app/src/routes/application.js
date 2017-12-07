import React from 'react';
import PropTypes from 'prop-types';
import Link from 'react-router-dom/Link';

export default class Application extends React.Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
  }

  render() {
    return (
      <div>
        <h2 id="stripes-new-app-message">Congratulations!</h2>
        Your Stripes app is running.
        View some <Link to={`${this.props.match.path}/examples`}>examples</Link>.
      </div>
    );
  }
}
