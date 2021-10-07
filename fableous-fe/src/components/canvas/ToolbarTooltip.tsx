import { ReactElement } from "react";
import { ClickAwayListener, makeStyles, Tooltip } from "@material-ui/core";

interface ToolbarTooltipProps {
  children: ReactElement<any, any>;
  // cannot use tailwind classes on tooltipTitle due to mui portal DOM placement
  tooltipTitle:
    | boolean
    | React.ReactChild
    | React.ReactFragment
    | React.ReactPortal;
  isOpen?: boolean;
  setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  disableCloseOnClickAway?: boolean;
  disabled?: boolean;
}

const useStyles = makeStyles({
  tooltip: {
    maxWidth: "none",
    backgroundColor: "#FFFFFFD0",
    padding: 4,
    borderRadius: 8,
  },
});

const ToolbarTooltip = (props: ToolbarTooltipProps) => {
  const {
    children,
    tooltipTitle,
    isOpen,
    setIsOpen,
    disableCloseOnClickAway,
    disabled,
  } = props;

  const classes = useStyles();

  const customizedTooltip = (
    <Tooltip
      interactive
      classes={{
        tooltip: classes.tooltip,
      }}
      onClose={() => setIsOpen && setIsOpen(false)}
      open={isOpen && !disabled}
      placement="right"
      leaveTouchDelay={undefined}
      disableFocusListener={!!setIsOpen || disabled}
      disableHoverListener={!!setIsOpen || disabled}
      disableTouchListener={!!setIsOpen || disabled}
      enterDelay={!setIsOpen ? 500 : undefined}
      enterTouchDelay={!setIsOpen ? 500 : undefined}
      title={tooltipTitle}
    >
      {children}
    </Tooltip>
  );

  return disableCloseOnClickAway ? (
    customizedTooltip
  ) : (
    <ClickAwayListener onClickAway={() => setIsOpen && setIsOpen(false)}>
      {customizedTooltip}
    </ClickAwayListener>
  );
};

ToolbarTooltip.defaultProps = {
  isOpen: undefined,
  setIsOpen: undefined,
  disableCloseOnClickAway: false,
  disabled: false,
};

export default ToolbarTooltip;
