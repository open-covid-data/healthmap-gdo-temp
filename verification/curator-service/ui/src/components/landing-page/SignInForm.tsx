import React from 'react';
import { Formik, Form, Field, FieldProps } from 'formik';
import { makeStyles, Theme } from '@material-ui/core/styles';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import {
    FormHelperText,
    LinearProgress,
    Button,
    TextField,
    Checkbox,
} from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) => ({
    checkboxRoot: {
        display: 'block',
    },
    required: {
        color: theme.palette.error.main,
    },
}));

interface Props {
    handleSubmit: (email: string, resetForm: () => void) => void;
    setIsAgreementChecked: (value: boolean) => void;
    setIsAgreementMessage: (value: boolean) => void;
    setIsNewsletterChecked: (value: boolean) => void;
    isSubmitting: boolean;
    isAgreementChecked: boolean;
    isAgreementMessage: boolean;
    isNewsletterChecked: boolean;
    classes: {
        emailField: string;
        divider: string;
        loader: string;
        signInButton: string;
    };
}

interface FormValues {
    email: string;
    isAgreementChecked: boolean;
    isNewsletterChecked: boolean;
}

export default function SignInForm({
    handleSubmit,
    setIsAgreementChecked,
    setIsAgreementMessage,
    setIsNewsletterChecked,
    isSubmitting,
    isAgreementChecked,
    isAgreementMessage,
    isNewsletterChecked,
    classes,
}: Props): JSX.Element {
    const signInClasses = useStyles();

    return (
        <Formik
            initialValues={{
                email: '',
                isAgreementChecked: false,
                isNewsletterChecked: false,
            }}
            validate={(values) => {
                const errors: Partial<FormValues> = {};
                if (!values.email) {
                    errors.email = 'Required';
                } else if (
                    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(
                        values.email,
                    )
                ) {
                    errors.email = 'Invalid email address';
                }
                if (!values.isAgreementChecked) {
                    errors.isAgreementChecked = true;
                }

                return errors;
            }}
            onSubmit={(values, { resetForm }) =>
                handleSubmit(values.email, resetForm)
            }
        >
            {({ errors, touched, submitForm }) => (
                <Form>
                    <Field name="email">
                        {({ field, meta }: FieldProps<FormValues>) => (
                            <>
                                <TextField
                                    className={classes.emailField}
                                    label="Email"
                                    type="email"
                                    variant="outlined"
                                    disabled={isSubmitting}
                                    error={
                                        meta.error !== undefined && meta.touched
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
                    <div className={classes.divider} />
                    <Field name="isAgreementChecked">
                        {({ field }: FieldProps<FormValues>) => (
                            <FormControlLabel
                                classes={{ root: signInClasses.checkboxRoot }}
                                control={
                                    <Checkbox
                                        checked={isAgreementChecked}
                                        disabled={isSubmitting}
                                        onClick={() => {
                                            setIsAgreementChecked(
                                                !isAgreementChecked,
                                            );
                                            setIsAgreementMessage(
                                                isAgreementChecked,
                                            );
                                        }}
                                        {...field}
                                    />
                                }
                                label={
                                    <small>
                                        By creating an account, I accept the
                                        Global.health{' '}
                                        <a
                                            href="https://global.health/terms-of-use/"
                                            rel="noopener noreferrer"
                                            target="_blank"
                                        >
                                            Terms of Use
                                        </a>{' '}
                                        and{' '}
                                        <a
                                            href="https://global.health/privacy/"
                                            rel="noopener noreferrer"
                                            target="_blank"
                                        >
                                            Privacy Policy
                                        </a>{' '}
                                        <span
                                            className={signInClasses.required}
                                        >
                                            *
                                        </span>
                                    </small>
                                }
                            />
                        )}
                    </Field>
                    {(isAgreementMessage ||
                        (errors.isAgreementChecked &&
                            touched.isAgreementChecked)) && (
                        <FormHelperText error>
                            This agreement is required
                        </FormHelperText>
                    )}
                    <Field name="isNewsletterChecked">
                        {({ field }: FieldProps<FormValues>) => (
                            <FormControlLabel
                                classes={{ root: signInClasses.checkboxRoot }}
                                control={
                                    <Checkbox
                                        checked={isNewsletterChecked}
                                        disabled={isSubmitting}
                                        onClick={() => {
                                            setIsNewsletterChecked(
                                                !isNewsletterChecked,
                                            );
                                        }}
                                        {...field}
                                    />
                                }
                                label={
                                    <small>
                                        I agree to be added to the Global.health
                                        newsletter
                                    </small>
                                }
                            />
                        )}
                    </Field>
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
                        Sign in
                    </Button>
                </Form>
            )}
        </Formik>
    );
}
