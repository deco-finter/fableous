/* eslint-disable react/jsx-props-no-spreading */
import { Chip, ChipProps } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

interface ChipRowProps {
  left: (ChipProps | string)[];
  middle: ChipProps | string;
  right: (ChipProps | string)[];
}

const useStyles = makeStyles({
  hideScrollbar: {
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "&::-webkit-scrollbar": {
      width: 0,
      height: 0,
    },
  },
});

export default function ChipRow(props: ChipRowProps) {
  const { left, middle, right } = props;
  const classes = useStyles();

  return (
    <div
      className={`flex justify-between items-stretch overflow-x-scroll ${classes.hideScrollbar}`}
    >
      <div className="flex flex-1">
        {left.map((leftProp) => (
          <Chip
            className="flex-initial"
            label={typeof leftProp === "string" ? leftProp : leftProp.label}
            color="secondary"
            {...leftProp}
          />
        ))}
      </div>
      <Chip
        className="flex-initial ml-4"
        label={typeof middle === "string" ? middle : middle.label}
        color="primary"
        {...middle}
      />
      <div className="flex flex-1 justify-end">
        {right.map((rightProp) => (
          <Chip
            className="flex-initial"
            label={typeof rightProp === "string" ? rightProp : rightProp.label}
            color="primary"
            variant="outlined"
            {...rightProp}
          />
        ))}
      </div>
    </div>
  );
}
