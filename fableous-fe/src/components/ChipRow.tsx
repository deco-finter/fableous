/* eslint-disable react/jsx-props-no-spreading */
import { Chip, ChipProps } from "@material-ui/core";
import React from "react";

interface ChipRowProps {
  left: ChipProps | string;
  middle: (React.ReactNode | ChipProps | string)[];
  right: (React.ReactNode | ChipProps | string)[];
}

export default function ChipRow(props: ChipRowProps) {
  const { left, middle, right } = props;

  return (
    <div className="flex flex-wrap gap-y-4">
      <div className="flex justify-evenly flex-grow flex-wrap gap-y-4">
        <Chip
          className="flex-initial ml-4"
          label={typeof left === "string" ? left : left.label}
          color="primary"
          {...left}
        />
        {middle.map((item) =>
          React.isValidElement(item) ? (
            item
          ) : (
            <Chip
              className="flex-initial"
              label={
                typeof item === "string" ? item : (item as ChipProps).label
              }
              color="primary"
              variant="outlined"
              {...item}
            />
          )
        )}
      </div>
      <div className="flex justify-evenly flex-shrink flex-grow flex-wrap gap-y-4">
        {right.map((item) =>
          React.isValidElement(item) ? (
            item
          ) : (
            <Chip
              className="flex-initial"
              label={
                typeof item === "string" ? item : (item as ChipProps).label
              }
              color="secondary"
              {...item}
            />
          )
        )}
      </div>
    </div>
  );
}
