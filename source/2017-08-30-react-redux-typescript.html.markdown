---
title: "React, Redux with TypeScript"
tags: JavaScript, React
date: 30/08/2017
---

The most important element of a [React](https://facebook.github.io/react/) + [Redux](http://redux.js.org/) application is "state". The state decides what the user interface will look like therefore it becomes essential to make sure that the state is always in a consistent and stable state.

To take a simple example, if a React application shows a simple counter and the state holds the counter value we need to make sure that no action sets the counter's value to a string (for example). So it would be nice if we can protect the state with tests as well as "__types__". Being a JS, Ruby and Clojure programmer I have never been a fan of types, however I do admit types provide some safety, and in case of Redux this safety is really nice to have.

Let's look at a very simple example application (the entire source code is available on [GitHub](https://github.com/rocky-jaiswal/react-ts-starter)). I recommend starting with [create-react-app-typescript](https://github.com/wmonk/create-react-app-typescript) and add a few packages on top so that the package.json looks somewhat like -

    {
      "dependencies": {
        "axios": "^0.16.2",
        "classnames": "^2.2.5",
        "react": "^15.6.1",
        "react-dom": "^15.6.1",
        "react-intl": "^2.3.0",
        "react-redux": "^5.0.6",
        "react-router": "^4.1.2",
        "react-router-dom": "^4.1.2",
        "react-router-redux": "^4.0.8",
        "react-scripts-ts": "2.6.0",
        "redux": "^3.7.2",
        "redux-actions": "^2.2.1",
        "redux-saga": "^0.15.6",
        "seamless-immutable": "^7.1.2"
      },
      "devDependencies": {
        "@types/enzyme": "^2.8.6",
        "@types/jest": "^20.0.7",
        "@types/node": "^8.0.24",
        "@types/react": "^16.0.3",
        "@types/react-dom": "^15.5.4",
        "@types/react-intl": "^2.3.1",
        "@types/react-redux": "^5.0.4",
        "@types/react-router": "^4.0.15",
        "@types/react-router-dom": "^4.0.7",
        "@types/react-router-redux": "^5.0.7",
        "@types/redux-actions": "^1.2.8",
        "@types/seamless-immutable": "^7.1.1",
        "autoprefixer": "^7.1.1",
        "enzyme": "^2.9.1",
        "postcss-cli": "^4.0.0",
        "react-test-renderer": "^15.6.1"
      },
    }

With this setup (and some boilerplate) we are ready to create a type safe React + Redux project. The first thing we need is a type for is the state, plus we can also use Enums to make sure that certain values are always within the ones we expect. So we can create (for example) -


    // src/constants/types.ts

    export enum LocaleEnum {
      en = 'en',
      de = 'de'
    }

    export interface AppState {
      counter: number;
      error?: string;
      loading: boolean;
      locale: LocaleEnum;
      rightSidebarVisible: boolean;
    }

    export type AppStateType = AppState;

    interface Action<T> {
      type: string;
      payload?: T;
    }

    export type ActionType<T> = Action<T>;

So this is the structure and type of our basic state. Now we need to create an initial state and a reducer that modifies this state -

    import * as Immutable from 'seamless-immutable';

    import { ActionType, AppStateType } from '../../constants/types';
    import { LocaleEnum } from '../../constants/enums';

    import {
      INCREMENT_COUNTER,
      SWITCH_LANGUAGE,
      TOGGLE_RIGHT_SIDEBAR,
    } from './constants';

    const iState: AppStateType = {
      counter: 0,
      error: undefined,
      loading: false,
      locale: LocaleEnum.en,
      rightSidebarVisible: false
    };

    export const initialState = Immutable.from(iState);

    const appReducer = (state = initialState, action: ActionType<{}>): AppStateType => {
      switch (action.type) {

        case SWITCH_LANGUAGE:
          return state
            .set('locale', action.payload);

        case TOGGLE_RIGHT_SIDEBAR:
          return state
            .set('rightSidebarVisible', !state.rightSidebarVisible);

        case INCREMENT_COUNTER:
          return state
            .set('counter', state.counter + 1);

        default:
          return state;
      }
    };

    export default appReducer;

Here as you can see we also use [seamless-immutable](https://github.com/rtfeldman/seamless-immutable) to make sure that the state is immutable. Addtionally during the initial state creation / mutation we add type checks.

React components also benefit from TypeScript since we can clearly define what PropTypes are needed and the type of each. A simple stateless component looks like -

    import * as React from 'react';

    import './styles.css';

    interface Props {
      visible: boolean;
    }

    const LoadingSpinner: React.SFC<Props> = (props) => {

      return (
        <div className={props.visible ? 'spinnerWrapper' : 'hidden'}>
          <div className="spinner" />
        </div>
      );

    };

    export default LoadingSpinner;

Visual Studio code additionally makes it easier to identify the PropTypes needed for any included component (having great auto-completion in the editor is nice as well). Finally, for a stateful component we can also easily and clearly define the state / props and the actions.

    import * as React from 'react';
    import { FormattedMessage } from 'react-intl';
    import { connect } from 'react-redux';
    import { ActionCreatorsMapObject, bindActionCreators } from 'redux';

    import { fetchInfo, incrementCounter } from '../../redux/app/actions';
    import { ActionType, Dispatch, RootStateType } from '../../constants/types';
    import LoadingSpinner from '../../components/LoadingSpinner';

    import './styles.css';

    interface Props {
      counter: number;
      loading: boolean;
    }

    interface DispatchProps extends ActionCreatorsMapObject {
      incrementCounter(): ActionType<{}>;
      fetchInfo(): ActionType<string>;
    }

    const mapStateToProps = (state: RootStateType, ownProps: {}) => {
      return {
        counter: state.app.counter,
        loading: state.app.loading
      };
    };

    const actions: DispatchProps = {
      incrementCounter,
      fetchInfo
    };

    const mapDispatchToProps = (dispatch: Dispatch) => bindActionCreators(actions, dispatch);

    export class Root extends React.Component<Props & DispatchProps> {

      componentDidMount() {
        // this.props.fetchInfo();
      }

      render() {
        return (
          <div>
            <LoadingSpinner visible={this.props.loading} />
            <h1 className="title">
              <FormattedMessage id="root.heading" />
            </h1>
            <h2>{this.props.counter}</h2>
            <button onClick={this.props.incrementCounter}>
              Increment Counter
            </button>
          </div>
        );
      }

    }

    export default connect(mapStateToProps, mapDispatchToProps)(Root);

With this setup we have very clear definitions of the state / props and the actions so anyone looking at the code can immediately recognize what the conatiner's interfaces are.

Plus there is additional benefit of declaring each action's input and return types which makes the intent of the action clear and helps catch errors. e.g. -

    export function switchLanguage(payload: LocaleEnum): ActionType<LocaleEnum> {
      return {
        payload,
        type: SWITCH_LANGUAGE
      };
    }


I hope this post was useful to understand some benefits of using TypeScript with React + Redux. Ofcourse, types can be annoying and sometimes get in the way but if used correctly can be very useful.
