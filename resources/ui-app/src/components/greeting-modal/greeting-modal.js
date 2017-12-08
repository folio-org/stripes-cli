import React from 'react';
import PropTypes from 'prop-types';
import Modal from '@folio/stripes-components/lib/Modal';
import NewAppGreeting from '../new-app-greeting';

export default class GreetingModal extends React.Component {
  static propTypes = {
    open: PropTypes.bool,
    onClose: PropTypes.func,
  };

  render() {
    return (
      <Modal onClose={this.props.onClose} open={this.props.open} size="small" label="Greeting Message Modal" dismissible closeOnBackgroundClick>
        <NewAppGreeting />
      </Modal>
    );
  }
}
