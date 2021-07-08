import React from 'react';
import { Formik, Form, Field, FieldProps } from 'formik';
import {
    FormHelperText,
    LinearProgress,
    Button,
    TextField,
} from '@material-ui/core';

interface Props {
    handleSubmit: (code: string) => void;
    setWrongCodeMessage: (value: boolean) => void;
    wrongCodeMessage: boolean;
    isSubmitting: boolean;
    classes: { emailField: string; loader: string; signInButton: string };
}

interface FormProps {
    code: string;
}

export default function VerificationCodeForm({
    handleSubmit,
    setWrongCodeMessage,
    wrongCodeMessage,
    isSubmitting,
    classes,
}: Props): JSX.Element {
    return (
        <Formik
            initialValues={{ code: '' }}
            validate={(values) => {
                const errors: Partial<FormProps> = {};

                if (wrongCodeMessage) {
                    setWrongCodeMessage(false);
                }

                if (!values.code) {
                    errors.code = 'Required';
                }

                return errors;
            }}
            onSubmit={(values) => handleSubmit(values.code)}
        >
            {({ submitForm }) => (
                <Form>
                    <Field name="code">
                        {({ field, meta }: FieldProps<FormProps>) => (
                            <>
                                <TextField
                                    className={classes.emailField}
                                    label="Verification code"
                                    type="text"
                                    variant="outlined"
                                    disabled={isSubmitting}
                                    error={
                                        (meta.error !== undefined &&
                                            meta.touched) ||
                                        wrongCodeMessage
                                    }
                                    fullWidth
                                    {...field}
                                />
                                {meta.touched && meta.error && (
                                    <FormHelperText error>
                                        {meta.error}
                                    </FormHelperText>
                                )}
                            </>
                        )}
                    </Field>
                    {wrongCodeMessage && (
                        <FormHelperText error>
                            Wrong verification code entered
                        </FormHelperText>
                    )}
                    {isSubmitting && (
                        <LinearProgress
                            className={classes.loader}
                            data-testid="loader"
                        />
                    )}
                    <Button
                        className={classes.signInButton}
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting}
                        onClick={submitForm}
                    >
                        Submit
                    </Button>
                </Form>
            )}
        </Formik>
    );
}
