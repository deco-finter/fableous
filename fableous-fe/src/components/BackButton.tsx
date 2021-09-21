import { Button, Icon } from "@material-ui/core";
import { useHistory } from "react-router-dom";

export default function BackButton() {
  const history = useHistory();
  return (
    <Button
      startIcon={<Icon>arrow_backward</Icon>}
      onClick={() => history.goBack()}
      style={{ color: "white", opacity: 0.85 }}
    >
      Back
    </Button>
  );
}
