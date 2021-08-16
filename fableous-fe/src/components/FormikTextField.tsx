/* eslint-disable react/jsx-props-no-spreading */
import { TextField } from "@material-ui/core";

export default function FormikTextField(props: {
  formik: any;
  name: string;
  label: string;
  overrides?: { [propName: string]: any };
}) {
  const { formik, name, label, overrides } = props;
  return (
    <TextField
      name={name}
      label={label}
      value={formik.values[name]}
      onChange={formik.handleChange}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      {...overrides}
    />
  );
}

FormikTextField.defaultProps = {
  overrides: {},
};
