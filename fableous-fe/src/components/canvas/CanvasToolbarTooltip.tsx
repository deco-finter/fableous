import { ReactElement } from "react";
import { ClickAwayListener, makeStyles, Tooltip } from "@material-ui/core";

interface CanvasToolbarTooltipProps {
  children: ReactElement<any, any>;
  // cannot use tailwind classes on tooltipTitle due to mui portal DOM placement
  tooltipTitle:
    | boolean
    | React.ReactChild
    | React.ReactFragment
    | React.ReactPortal;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  disableCloseOnClickAway?: boolean;
}

const useStyles = makeStyles({
  unsetMaxWidth: {
    maxWidth: "none",
  },
});

const CanvasToolbarTooltip = (props: CanvasToolbarTooltipProps) => {
  const { children, tooltipTitle, isOpen, setIsOpen, disableCloseOnClickAway } =
    props;

  const classes = useStyles();

  const customizedTooltip = (
    <Tooltip
      interactive
      classes={{
        tooltip: classes.unsetMaxWidth,
      }}
      onClose={() => setIsOpen(false)}
      open={isOpen}
      arrow
      placement="right"
      leaveTouchDelay={undefined}
      disableFocusListener
      disableHoverListener
      disableTouchListener
      title={tooltipTitle}
    >
      {children}
    </Tooltip>
  );

  return disableCloseOnClickAway ? (
    customizedTooltip
  ) : (
    <ClickAwayListener onClickAway={() => setIsOpen(false)}>
      {customizedTooltip}
    </ClickAwayListener>
  );
};

CanvasToolbarTooltip.defaultProps = {
  disableCloseOnClickAway: false,
};

export default CanvasToolbarTooltip;
