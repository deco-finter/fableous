import { Route, Switch } from "react-router-dom";
import ControllerCanvasPage from "./containers/ControllerCanvasPage";
import HubCanvasPage from "./containers/HubCanvasPage";
import HomePage from "./containers/HomePage";

export default function Routes() {
  return (
    <Switch>
      <Route path="/" exact component={HomePage} />
      <Route
        path="/classroom/:classroomId/hub"
        component={HubCanvasPage}
        exact
      />
      <Route path="/join" exact component={ControllerCanvasPage} />
    </Switch>
  );
}
