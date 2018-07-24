// @flow
import React, { Component } from 'react';
import { List, Grid, Pagination } from 'semantic-ui-react';
import _ from 'lodash';

type Props = {
  actions: {},
  account: {},
  getActions: string => {}
};

export default class History extends Component<Props> {
  props: Props;
  state = { activePage: 1 };

  handlePaginationChange = (e, { activePage }) => {
    const { getActions, account, actions } = this.props;
    const lastActionSeq =
      actions.length === 0 ? 0 : actions[actions.length - 1].account_action_seq;
    let position = lastActionSeq - (activePage - 1) * 20;
    const end = position - 19 < 0 ? 0 : position - 19;
    if (position < 0) position = 20;

    if (
      actions.findIndex(element => element.account_action_seq === position) ===
        -1 ||
      actions.findIndex(element => element.account_action_seq === end) === -1
    ) {
      getActions(account.account_name, position);
    }

    this.setState({ activePage });
  };

  render() {
    const { actions } = this.props;
    const { activePage } = this.state;
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    const options2 = { hour: '2-digit', minute: '2-digit' };
    const days = [];
    const lastActionSeq =
      actions.length === 0 ? 0 : actions[actions.length - 1].account_action_seq;
    const totalPages = Math.ceil(lastActionSeq / 20);
    const endSequene = lastActionSeq - (activePage - 1) * 20;
    const startSequence = endSequene - 19 < 0 ? 0 : endSequene - 19;
    const end = actions.findIndex(e => e.account_action_seq === endSequene);
    const start = actions.findIndex(
      e => e.account_action_seq === startSequence
    );
    const pageHistory = _.slice(actions, start, end + 1);

    pageHistory.forEach(value => {
      const { block_time, account_action_seq } = value; // eslint-disable-line camelcase
      const date = new Date(block_time);
      const day = date.toLocaleDateString('en-US', options);
      const time = date.toLocaleTimeString('en-US', options2);

      let dayActions = _.find(days, { day });
      if (!dayActions) {
        dayActions = { day, actions: [], timestamp: date.getTime() };
        days.push(dayActions);
      }

      const { trx_id } = value.action_trace; // eslint-disable-line camelcase
      const { account, name, data } = value.action_trace.act;
      const { act_digest } = value.action_trace.receipt; // eslint-disable-line camelcase
      const action = {
        sequence: account_action_seq,
        time,
        txId: trx_id,
        txIdShort: `${trx_id.slice(0, 5)}...${trx_id.slice(-5)}`,
        account,
        name,
        data,
        digest: act_digest
      };

      if (!dayActions.actions.find(el => el.digest === action.digest)) {
        dayActions.actions.push(action);
      }
    });

    const items = _.map(_.reverse(days), dayGroup => (
      <List.Item key={dayGroup.day} style={{ marginBottom: '1em' }}>
        {dayGroup.day}
        <List.Content>
          <List selection relaxed divided>
            {_.map(_.reverse(dayGroup.actions), action => (
              <List.Item key={`${action.time}-${action.txId}-${action.digest}`}>
                <List.Content>{renderAction(action)}</List.Content>
              </List.Item>
            ))}
          </List>
        </List.Content>
      </List.Item>
    ));

    return (
      <div id="scrollable-history">
        <List style={{ marginBottom: '2em' }}>{items}</List>
        <div />
        {days.length > 0 && (
          <Grid>
            <Grid.Row centered>
              <Pagination
                activePage={activePage}
                totalPages={totalPages}
                size="mini"
                onPageChange={this.handlePaginationChange}
              />
            </Grid.Row>
          </Grid>
        )}
      </div>
    );
  }
}

function renderAction(action) {
  let data = '';
  Object.keys(action.data).forEach(key => {
    data = [data, key, action.data[key]].join(' ');
  });

  return (
    <Grid>
      <Grid.Column width={3}>{action.time}</Grid.Column>
      <Grid.Column width={3}>{action.txIdShort}</Grid.Column>
      <Grid.Column width={3}>{action.name}</Grid.Column>
      <Grid.Column width={7}>{data.trim()}</Grid.Column>
    </Grid>
  );
}
