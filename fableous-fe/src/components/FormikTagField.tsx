/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable react/jsx-props-no-spreading */
import { Chip, ChipProps, TextField, TextFieldProps } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import { FormikProps } from "formik";
import { useState } from "react";

/**
 * Convenience formik wrapper for custom tag input
 */
export default function FormikTagField(props: {
  formik: FormikProps<any>;
  name: string;
  label: string;
  options?: string[];
  maxTags?: number;
  maxTagLength?: number;
  tagProps?: ChipProps;
  overrides?: TextFieldProps;
}) {
  const {
    formik,
    name,
    label,
    options,
    maxTags,
    maxTagLength,
    tagProps,
    overrides,
  } = props;
  const [value, setValue] = useState<string[]>(
    formik.values[name]
      .split(",")
      .map((tag: string) => tag.trim())
      .filter((tag: string) => tag.length > 0)
  );
  const [inputValue, setInputValue] = useState("");

  const handleChange = (event: React.ChangeEvent<{}>, newValue: string[]) => {
    event.persist();
    formik.setTouched({ ...formik.touched, [name]: true });
    if (maxTags === undefined || newValue.length <= maxTags) {
      setValue(newValue);
      formik.setFieldValue(name, newValue.join(","));
    }
  };

  const handleInputChange = (
    event: React.ChangeEvent<{}>,
    newInputValue: string
  ) => {
    const newTags = newInputValue.split(/[ ,]+/);
    const newValue = value
      .concat(newTags)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    if (newTags.length > 1) {
      handleChange(event, newValue);
    } else if (
      !newTags.length ||
      maxTagLength === undefined ||
      newTags[0].length <= maxTagLength
    )
      setInputValue(newInputValue);
  };

  return (
    <Autocomplete
      multiple
      disableClearable
      clearOnBlur
      value={value}
      inputValue={inputValue}
      inputMode={overrides?.inputMode || "text"}
      disabled={overrides?.disabled}
      options={options || []}
      freeSolo={formik.values[name].split(",").length < 3}
      noOptionsText="Maximum number of tags"
      onChange={handleChange}
      onBlur={formik.handleBlur}
      onInputChange={handleInputChange}
      renderTags={(tags: readonly string[], getTagProps) =>
        tags.map((option: string, index: number) => (
          <Chip {...getTagProps({ index })} {...tagProps} label={option} />
        ))
      }
      renderInput={(params) => (
        <TextField
          {...params}
          variant={overrides?.variant || "standard"}
          name={name}
          label={label}
          error={formik.touched[name] && !!formik.errors[name]}
          helperText={
            formik.touched[name] && formik.errors[name]
              ? formik.errors[name]
              : "Press space or enter to add tag"
          }
          InputProps={{ ...params.InputProps, ...overrides?.InputProps }}
          InputLabelProps={{
            ...params.InputLabelProps,
            ...overrides?.InputLabelProps,
          }}
        />
      )}
    />
  );
}

FormikTagField.defaultProps = {
  options: [],
  maxTags: undefined,
  maxTagLength: undefined,
  tagProps: {},
  overrides: {},
};
