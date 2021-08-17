/* eslint-disable react/jsx-props-no-spreading */
import { Redirect, Route, RouteProps, Switch } from "react-router-dom";
import ControllerCanvasPage from "./containers/ControllerCanvasPage";
import HubCanvasPage from "./containers/HubCanvasPage";
import HomePage from "./containers/HomePage";
import LoginPage from "./containers/LoginPage";
import RegisterPage from "./containers/RegisterPage";
import ClassroomDetailPage from "./containers/ClassroomDetailPage";
import ClassroomListPage from "./containers/ClassroomListPage";
import auth from "./Auth";

const PrivateRoute = ({ ...routeProps }: RouteProps) => {
  return auth.isAuthenticated() ? (
    <Route {...routeProps} />
  ) : (
    <Redirect to="/login" />
  );
};

const PublicRoute = ({ ...routeProps }: RouteProps) => {
  return auth.isAuthenticated() ? (
    <Redirect to="/classroom" />
  ) : (
    <Route {...routeProps} />
  );
};

export default function Routes() {
  return (
    <Switch>
      <PublicRoute path="/" component={HomePage} exact />
      <PublicRoute path="/login" component={LoginPage} exact />
      <PublicRoute path="/register" component={RegisterPage} exact />
      <PrivateRoute path="/classroom" component={ClassroomListPage} exact />
      <PrivateRoute
        path="/classroom/:classroomId"
        component={ClassroomDetailPage}
        exact
      />
      <PrivateRoute
        path="/classroom/:classroomId/hub"
        component={HubCanvasPage}
        exact
      />
      <Route path="/join" component={ControllerCanvasPage} exact />
      <Route>
        <Redirect to="/" />
      </Route>
    </Switch>
  );
}
