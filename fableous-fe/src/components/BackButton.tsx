import { Button, Icon } from "@material-ui/core";
import { useHistory } from "react-router-dom";

export default function BackButton(props: { className?: string }) {
  const { className } = props;
  const history = useHistory();
  return (
    <Button
      startIcon={<Icon>arrow_backward</Icon>}
      style={{ color: "white", opacity: 0.85 }}
      className={className}
      onClick={() => history.goBack()}
    >
      Back
    </Button>
  );
}

BackButton.defaultProps = {
  className: "",
};
