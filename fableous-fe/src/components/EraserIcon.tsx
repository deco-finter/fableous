/* eslint-disable react/jsx-props-no-spreading */
import { SvgIcon, SvgIconProps } from "@material-ui/core";

export default function EraserIcon(props: SvgIconProps) {
  return (
    <SvgIcon {...props}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
        <g
          id="Icon_awesome-eraser"
          data-name="Icon awesome-eraser"
          transform="translate(0)"
        >
          <path
            id="Icon_awesome-eraser-2"
            data-name="Icon awesome-eraser"
            d="M48.627,29.252a5.912,5.912,0,0,0,0-7.576L33,3.819a4.285,4.285,0,0,0-6.629,0l-25,28.571a5.912,5.912,0,0,0,0,7.576l9.375,10.714a4.412,4.412,0,0,0,3.315,1.569H48.828A1.264,1.264,0,0,0,50,50.911V46.446a1.264,1.264,0,0,0-1.172-1.339H34.754L48.627,29.252Zm-29.553-6.99L32.489,37.595l-6.574,7.513H14.71L6.9,36.179,19.074,22.263Z"
            transform="translate(0 -2.25)"
            // fill="#1583d8"
          />
        </g>
      </svg>
    </SvgIcon>
  );
}
