/* eslint-disable react/jsx-props-no-spreading */
import { Chip, ChipProps } from "@material-ui/core";
import React from "react";

interface ChipRowProps {
  chips: (React.ReactNode | ChipProps | string)[];
  primary?: boolean;
}

export default function ChipRow(props: ChipRowProps) {
  const { chips, primary } = props;

  return (
    <div className="flex justify-evenly flex-grow flex-wrap gap-y-4">
      {chips.map((chip) =>
        React.isValidElement(chip) ? (
          chip
        ) : (
          <Chip
            label={typeof chip === "string" ? chip : (chip as ChipProps).label}
            color={primary ? "secondary" : "primary"}
            variant={primary ? "default" : "outlined"}
            {...chip}
          />
        )
      )}
    </div>
  );
}

ChipRow.defaultProps = {
  primary: false,
};
