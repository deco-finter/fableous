/* eslint-disable react/jsx-props-no-spreading */
import { useContext } from "react";
import { Redirect, Route, RouteProps, Switch } from "react-router-dom";
import ControllerCanvasPage from "./containers/ControllerCanvasPage";
import HubCanvasPage from "./containers/HubCanvasPage";
import HomePage from "./containers/HomePage";
import LoginPage from "./containers/LoginPage";
import RegisterPage from "./containers/RegisterPage";
import GalleryPage from "./containers/GalleryPage";
import ClassroomDetailPage from "./containers/ClassroomDetailPage";
import ClassroomListPage from "./containers/ClassroomListPage";
import { AuthContext } from "./components/AuthProvider";
import NotFoundPage from "./containers/NotFoundPage";
import StoryDetailPage from "./containers/StoryDetailPage";
import ProfilePage from "./containers/ProfilePage";

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
      <PrivateRoute path="/profile" component={ProfilePage} exact />
      <PrivateRoute path="/classroom" component={ClassroomListPage} exact />
      <Route path="/gallery/:classroomId" component={GalleryPage} exact />
      <Route
        path="/gallery/:classroomId/:sessionId"
        component={StoryDetailPage}
        exact
      />
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
