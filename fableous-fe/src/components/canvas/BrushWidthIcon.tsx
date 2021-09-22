/* eslint-disable react/jsx-props-no-spreading */
import { SvgIcon, SvgIconProps } from "@material-ui/core";
import { useTheme } from "@material-ui/core/styles";

interface BrushWidthIconProps extends SvgIconProps {
  strokeWidth: number;
}

export default function BrushWidthIcon(props: BrushWidthIconProps) {
  const { strokeWidth, color } = props;
  const theme = useTheme();
  const stroke =
    color === "primary"
      ? theme.palette.primary.main
      : theme.palette.secondary.main;

  return (
    <SvgIcon {...props}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 31.183 20.525">
        <path
          id="Path_1171"
          data-name="Path 1171"
          d="M-9770.666-11926.13s1.032,12.417,4.806,13.831,6.3-4.638,6.3-4.638,3.1-6.826,4.933-9.193,6.311-1.806,7.631,2.279c.981,3.03,2.375,8.856,2.316,11.552"
          transform="translate(9773.364 11930.073)"
          fill="none"
          stroke={stroke}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokeWidth}
        />
      </svg>
    </SvgIcon>
  );
}
