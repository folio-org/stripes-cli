import React from 'react';
import PropTypes from 'prop-types';
import Link from 'react-router-dom/Link';
import {
  Button,
  Headline,
  Pane,
  Paneset
} from '@folio/stripes-components/lib/Paneset';
import GreetingModal from '../components/greeting-modal';

/*
  STRIPES-NEW-APP
  This page contains some simple examples to illustrate getting started
  with some stripes-components and your app's own components
*/

export default class ExamplePage extends React.Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
  }

  constructor(props) {
    super(props);
    this.toggleModal = this.toggleModal.bind(this);
    this.buttonClick = this.buttonClick.bind(this);
    this.onClose = this.onClose.bind(this);
    this.state = { showModal: false };
  }

  toggleModal(showModal) {
    this.setState({ showModal });
  }

  onClose() {
    this.toggleModal(false);
  }

  buttonClick() {
    this.toggleModal(true);
  }

  render() {
    return (
      <Paneset static>
        <Pane defaultWidth="20%" paneTitle="Examples">
          <Headline size="small">Paneset and Panes</Headline>
          These columns are created with Paneset and Pane components.
          <hr />
          <Link to={`<%= appRoute %>`}>home page</Link>
        </Pane>
        <Pane defaultWidth="80%" paneTitle="Some Stripes Components">
          <Headline size="small" margin="medium">Button with modal</Headline>
          <Button onClick={this.buttonClick}>Click me</Button>
          <GreetingModal onClose={this.onClose} open={this.state.showModal} />
          <hr />
          <Headline size="small" margin="medium">More...</Headline>
          Please refer to the
          {' '}
          <a href="https://github.com/folio-org/stripes-components/blob/master/README.md">
            Stripes Components README
          </a>
          {' '}
          for more components and examples.
        </Pane>
      </Paneset>
    );
  }
}
