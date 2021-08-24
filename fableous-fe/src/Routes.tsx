/* eslint-disable react/jsx-props-no-spreading */
import { useContext } from "react";
import { Redirect, Route, RouteProps, Switch } from "react-router-dom";
import ControllerCanvasPage from "./containers/ControllerCanvasPage";
import HubCanvasPage from "./containers/HubCanvasPage";
import HomePage from "./containers/HomePage";
import LoginPage from "./containers/LoginPage";
import RegisterPage from "./containers/RegisterPage";
import ClassroomDetailPage from "./containers/ClassroomDetailPage";
import ClassroomListPage from "./containers/ClassroomListPage";
import { AuthContext } from "./components/AuthProvider";
import NotFoundPage from "./containers/NotFoundPage";

const PrivateRoute = ({ ...routeProps }: RouteProps) => {
  const [, isAuthenticated] = useContext(AuthContext);
  return isAuthenticated ? <Route {...routeProps} /> : <Redirect to="/login" />;
};

const PublicRoute = ({ ...routeProps }: RouteProps) => {
  const [, isAuthenticated] = useContext(AuthContext);
  return isAuthenticated ? (
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
      <Route component={NotFoundPage} />
    </Switch>
  );
}
