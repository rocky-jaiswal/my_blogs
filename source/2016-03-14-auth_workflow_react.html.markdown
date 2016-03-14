---
title: "Authentication workflow with React"
tags: Clojure, JavaScript, React
date: 14/03/2016
---

Having worked with a few frontend frameworks, I definitely find [React](https://facebook.github.io/react/) to be a very good choice. For me, it delivers on the promise of creating clean frontend components that can be used across projects while being easily extensible and flexible. On top of that React encourages good functional programming practices and also has mobile covered with [React Native](https://facebook.github.io/react-native/).

We have looked at Reagent [before](http://rockyj.in/2016/01/02/weather_with_reagent.html) and also at building Single Page Apps with [Rails API](http://rockyj.in/2013/10/24/angular_rails.html) and [AngularJS](http://rockyj.in/2013/11/04/angular_rails_2.html). Building on that, in this post we will create a common authentication workflow with React and [React Router](https://github.com/reactjs/react-router). Before we look at the code, here is how the application looks like (the solid lines outline the components) -

Login user - 

![React Login Page](/images/react_login.png "React Login Page")

Register user -

![React Register Page](/images/react_register.png "React Register Page")

Once the user logs in, the home page is displayed and the navigation bar is updated accordingly -

![React Home Page](/images/react_home.png "React Home Page")

The code for this application is available on [Github](https://github.com/rocky-jaiswal/lehrer-node). Let's look at some main components -

It starts with the Router -

    var React = require('react');
    var ReactRouter = require('react-router');

    var Router = ReactRouter.Router;
    var Route = ReactRouter.Route;
    var hashHistory = ReactRouter.hashHistory;
    var IndexRoute = ReactRouter.IndexRoute;

    var AppContainer = require('../containers/AppContainer');
    var Login = require('../components/Login');
    var Register = require('../components/Register');
    var Logout = require('../components/Logout');
    var Home = require('../components/Home');
    var Settings = require('../components/Settings');

    var authentication = require('../services/authentication');
    var eventManager = require('../services/event_manager');

    function checkAuth(nextState, replace, cb) {
      const promise = authentication.isAuthenticated();
      promise.then(function(resp) {
        eventManager.getEmitter().emit(eventManager.authChannel, true);
        cb();
      }).catch(function(err) {
        eventManager.getEmitter().emit(eventManager.authChannel, false);
        replace({
          pathname: '/login',
          state: { nextPathname: nextState.location.pathname }
        });
        cb();
      });
    }

    var routes = (
      <Router history={hashHistory}>
        <Route path='/' component={AppContainer}>
          <IndexRoute component={Home} onEnter={checkAuth} />
          <Route path="login" component={Login}/>
          <Route path="register" component={Register}/>
          <Route path="logout" component={Logout} />
          <Route path="settings" component={Settings} onEnter={checkAuth} />
        </Route>
      </Router>
    );
    
    module.exports = routes;

The main AppContainer - 

    var React = require('react');
    var Navbar = require('../components/Navbar');
    var authentication = require('../services/authentication');
    var eventManager = require('../services/event_manager');

    var styles = {
    }

    var AppContainer = React.createClass({
      contextTypes: {
        router: React.PropTypes.object.isRequired
      },

      getInitialState () {
        return {
          loggedIn: false
        }
      },

      updateAuth(loggedIn) {
        this.setState({
          loggedIn: loggedIn
        })
      },

      componentDidMount () {
        this.subscription = eventManager.getEmitter().addListener(eventManager.authChannel, this.updateAuth);
        const promise = authentication.isAuthenticated();
        promise.then(resp => {this.setState({loggedIn: true})})
          .catch(err => {this.setState({loggedIn: false})});
      },

      componentWillUnmount () {
        this.subscription.remove();
      },

      render () {
        return (
          <div className="container is-fluid">
            <Navbar loggedIn={this.state.loggedIn}/>
            <div className="columns">
              {React.cloneElement(this.props.children, { loggedIn: this.state.loggedIn })}
            </div>
          </div>
        )
      }
    })

    module.exports = AppContainer;

Navbar.js -

    var React = require('react');
    var PropTypes = React.PropTypes;
    var ReactRouter = require('react-router');
    var Link = ReactRouter.Link;

    var styles = {
      head: {
        backgroundColor: "#ecf0f1",
        height: "75px",
        padding: "10px"
      },
      heading: {
        color: "#34495e"

      }
    }

    var Navbar = React.createClass({
      notLoggedIn: function () {
        return(
          <div className="navbar-right">
            <span className="navbar-item">
              <Link to="/login">Login</Link>
            </span>
            <span className="navbar-item">
              <Link to="/register">Register</Link>
            </span>
          </div>
        );
      },

      loggedIn: function () {
        return(
          <div className="navbar-right">
            <span className="navbar-item">
              <Link to="/">Home</Link>
            </span>
            <span className="navbar-item">
              <Link to="/settings">Settings</Link>
            </span>
            <span className="navbar-item">
              <Link to="/logout">Logout</Link>
            </span>
          </div>
        );
      },

      render: function () {
        return (
          <nav className="navbar" style={styles.head}>
            <span className="navbar-item is-text-centered">
              <h1 className="title"><Link to="/" style={styles.heading}>Lehrer</Link></h1>
            </span>
            {this.props.loggedIn? this.loggedIn() : this.notLoggedIn()}
          </nav>
        );
      }
    })

    module.exports = Navbar;

Login.js -

    var React = require('react');
    var PropTypes = React.PropTypes;
    var authentication = require('../services/authentication');

    var styles = {
      error: {
        color: '#FF0000',
        marginTop: '15px'
      }
    }

    var Login = React.createClass({
      contextTypes: {
        router: React.PropTypes.object.isRequired
      },

      getInitialState() {
        return { error: false }
      },

      onSubmitLogin(event) {
        event.preventDefault();

        const email = this.refs.email.value;
        const pass = this.refs.password.value;

        authentication.login(email, pass, (loggedIn) => {
          if (loggedIn)
            this.context.router.push({pathname: '/'});
          else
            return this.setState({ error: true });
        });
      },

      render() {
        return (
          <section className="column is-offset-6 is-4">
            <h1 className="title">Login</h1>
            <form onSubmit={this.onSubmitLogin}>
              <p className="control">
                <input className="input" type="email" placeholder="Email" ref="email"/>
              </p>
              <p className="control">
                <input className="input" type="password" placeholder="Password" ref="password"/>
              </p>
              <p className="control">
                <button className="button is-success">
                  Login
                </button>
              </p>
            </form>
            {this.state.error && (
                <p style={styles.error}>Bad login information</p>
            )}
          </section>
        )
      }
    })

    module.exports = Login;

Home.js -

    var React = require('react');
    var PropTypes = React.PropTypes;
    var greeting = require('../services/greeting');

    var styles = {
    }

    var Home = React.createClass({
      getInitialState () {
        return {
          message: ''
        }
      },

      componentDidMount () {
        const promise = greeting.fetch();
        promise.then(response => {this.setState({message: response.data.greeting})})
          .catch(err => {this.setState({message: 'An error occured!'})});
      },

      render: function () {
        return (
          <section className="column is-12">
            <div className="hero">
              <h1>{this.state.message}</h1>
            </div>
          </section>
        )
      }
    })

    module.exports = Home;

authentication.js -

    var axios = require('axios');

    var authentication = {

      isAuthenticated () {
        const token = localStorage.getItem('token');
        if(token) {
          return axios.get("http://localhost:3000/api/session", {headers: {"Authorization": token}});
        } else {
          return new Promise(function(resolve, reject){ reject(); });
        }
      },

      login (email, password, cb) {
        const promise = axios.post("http://localhost:3000/api/session", {email: email,
                                                                                  password: password});
        this.handleAuth(promise, cb);
      },

      register (email, password, passwordConfirmation, cb) {
        const promise = axios.post("http://localhost:3000/api/users", {email: email,
                                                                       password: password,
                                                                       passwordConfirmation: passwordConfirmation});
        this.handleAuth(promise, cb);
      },

      logout () {
        const token = localStorage.getItem('token');
        localStorage.removeItem('token');
        axios.delete("http://localhost:3000/api/session", {headers: {"Authorization": token}});
        return true;
      },

      handleAuth (promise, cb) {
        promise.then((resp) => {
          if (resp.data.token) {
            localStorage.setItem('token', resp.data.token);
            cb(true);
          }
        }).catch((error) => cb(false));
      }

    }

    module.exports = authentication;

Finally, an eventing system to keep the sibling components in sync - 

    var {EventEmitter} = require('fbemitter');

    const EventManager = function () {
      this.emitter = this.emitter || new EventEmitter();

      this.authChannel = 'authState';

      this.getEmitter = function() {
        return this.emitter;
      }
    }

    module.exports = new EventManager();

Hope this was useful. The [Github project](https://github.com/rocky-jaiswal/lehrer-node) has the complete source code and the backend API is written in [Hapi.js](http://hapijs.com/). With time I plan to improve the code, feel free to send a PR.
