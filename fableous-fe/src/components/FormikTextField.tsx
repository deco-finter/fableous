/* eslint-disable react/jsx-props-no-spreading */
import { TextField, TextFieldProps } from "@material-ui/core";
import { FormikProps } from "formik";

/**
 * Convenience formik wrapper around Mui's TextField
 */
export default function FormikTextField(props: {
  formik: FormikProps<any>;
  name: string;
  label: string;
  overrides?: TextFieldProps;
}) {
  const { formik, name, label, overrides } = props;
  return (
    <TextField
      name={name}
      label={label}
      value={formik.values[name]}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={formik.touched[name] && !!formik.errors[name]}
      helperText={formik.touched[name] && formik.errors[name]}
      {...overrides}
    />
  );
}

FormikTextField.defaultProps = {
  overrides: {},
};
