import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Link from 'react-router-dom/Link';
import { FormattedMessage } from 'react-intl';
import {
  Button,
  Headline,
  Pane,
  Paneset,
  Icon,
} from '@folio/stripes-components';

import GreetingModal from '../components/greeting-modal';

/*
  STRIPES-NEW-APP
  This page contains some simple examples to illustrate getting started
  with some stripes-components and your app's own components
*/

export default class ExamplePage extends React.Component {
  static propTypes = {
    match: PropTypes.object.isRequired,
    resources: PropTypes.shape({
      health: PropTypes.shape({
        hasLoaded: PropTypes.bool.isRequired,
        records: PropTypes.arrayOf(PropTypes.shape({
          healthMessage: PropTypes.string.isRequired,
          healthStatus: PropTypes.bool.isRequired,
          instId: PropTypes.string.isRequired,
          srvcId: PropTypes.string.isRequired
        })).isRequired
      })
    }).isRequired
  }

  static manifest = Object.freeze({
    health: {
      type: 'okapi',
      path: '_/discovery/health',
    }
  });

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

  getHealthSummary() {
    const {
      records: healthData
    } = this.props.resources.health;

    const defaultlHealthSummary = {
      healthyInstances: 0,
      notHealthyInstances: 0
    };

    return healthData.reduce((healthSummary, { healthStatus }) => {
      if (healthStatus) {
        healthSummary.healthyInstances++;
      } else {
        healthSummary.notHealthyInstances++;
      }

      return healthSummary;
    }, defaultlHealthSummary);
  }

  renderHealthSummary() {
    const {
      healthyInstances,
      notHealthyInstances,
    } = this.getHealthSummary();

    return (
      <Fragment>
        <b>{healthyInstances}</b>
        &nbsp;
        <FormattedMessage id="<%= uiAppName %>.example-page.instances-healthy" />
        ,&nbsp;
        <b>{notHealthyInstances}</b>
        &nbsp;
        <FormattedMessage id="<%= uiAppName %>.example-page.instances-instances-not-healthy" />
      </Fragment>
    );
  }

  render() {
    const { health } = this.props.resources;
    const healthResourceAvaliable = health && health.hasLoaded;

    return (
      <Paneset static>
        <Pane defaultWidth="20%" paneTitle="Examples">
          <Headline size="small">Paneset and Panes</Headline>
          These columns are created with Paneset and Pane components.
          <hr />
          <div data-test-example-page-home>
            <Link to="<%= appRoute %>">home page</Link>
          </div>
        </Pane>
        <Pane defaultWidth="80%" paneTitle="Some Stripes Components">
          <Headline size="small" margin="medium">Button with modal</Headline>
          <div data-test-example-page-button>
            <Button onClick={this.buttonClick}>Click me</Button>
          </div>
          <GreetingModal onClose={this.onClose} open={this.state.showModal} />
          <hr />
          <Headline
            size="small"
            margin="medium"
          >
            <FormattedMessage id="<%= uiAppName %>.example-page.sample-request" />
          </Headline>
          {healthResourceAvaliable
            ? this.renderHealthSummary()
            : <Icon icon="spinner-ellipsis" />
          }
          <hr />
          <Headline size="small" margin="medium">More...</Headline>
          Please refer to the
          {' '}
          <a
            data-test-example-page-components-link
            href="https://github.com/folio-org/stripes-components/blob/master/README.md"
          >
            Stripes Components README
          </a>
          {' '}
          for more components and examples.
        </Pane>
      </Paneset>
    );
  }
}
