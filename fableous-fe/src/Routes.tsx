import { Route, Switch } from "react-router-dom";
import CanvasPage from "./containers/CanvasPage";
import HomePage from "./containers/HomePage";

export default function Routes() {
  return (
    <Switch>
      <Route path="/" exact component={HomePage} />
      <Route path="/canvas" exact component={CanvasPage} />
    </Switch>
  );
}
