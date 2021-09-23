/* eslint-disable no-nested-ternary */
import { Icon, IconButton, Typography } from "@material-ui/core";
import { colors } from "../../colors";
import { ControllerRole, ROLE_ICON } from "../../constant";

export default function LayerIcon(props: {
  role: ControllerRole;
  focusLayer: ControllerRole | undefined;
  setFocusLayer: React.Dispatch<
    React.SetStateAction<ControllerRole | undefined>
  >;
  joinedControllers: {
    [key in ControllerRole]?: string | null;
  };
}) {
  const { role, focusLayer, setFocusLayer, joinedControllers } = props;

  return (
    <div className="flex flex-col justify-center items-center">
      <IconButton
        style={{
          color:
            focusLayer === role
              ? colors.orange.main
              : !focusLayer && joinedControllers[role]
              ? colors.blue.main
              : colors.gray.main,
        }}
        disabled={!joinedControllers[role]}
        onClick={() => setFocusLayer(focusLayer === role ? undefined : role)}
      >
        <Icon fontSize="large">{ROLE_ICON[role].icon}</Icon>
      </IconButton>
      <Typography
        variant="subtitle2"
        className="-mt-4 font-bold"
        style={{
          color:
            focusLayer === role
              ? colors.orange.main
              : !focusLayer && joinedControllers[role]
              ? colors.blue.main
              : colors.gray.main,
        }}
      >
        {ROLE_ICON[role].text}
      </Typography>
    </div>
  );
}
