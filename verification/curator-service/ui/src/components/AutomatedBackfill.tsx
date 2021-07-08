import * as Yup from 'yup';

import { Button, CircularProgress, Typography } from '@material-ui/core';
import { Form, Formik } from 'formik';
import Source, { CaseReferenceForm } from './common-form-fields/Source';

import AppModal from './AppModal';
import { DateField } from './common-form-fields/FormikFields';
import MuiAlert from '@material-ui/lab/Alert';
import { Paper } from '@material-ui/core';
import React from 'react';
import User from './User';
import axios from 'axios';
import { makeStyles } from '@material-ui/core/styles';
import { useInterval } from '../hooks/useInterval';

/**
 * The amount of time allowed before timing out a backfill.
 *
 * Parsing functions, on AWS Lambda, have a 15 minute limit. It's possible for
 * retrieval to take a few minutes as well, so we allot five additional minutes
 * for that, too.
 *
 * This is 20 minutes, times 60 seconds per minute, to milliseconds.
 */
const _BACKFILL_TIME_LIMIT_MS = 20 * 60 * 1000;

interface RetrievalResult {
    bucket: string;
    key: string;
    upload_id: string;
}

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const useStyles = makeStyles(() => ({
    headerBlurb: {
        maxWidth: '70%',
        paddingBottom: '3em',
        paddingTop: '1em',
    },
    headerText: {
        marginTop: '2em',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        paddingLeft: '3em',
        paddingRight: '4em',
    },
    formSection: {
        paddingBottom: '2em',
    },
    allFormSections: {
        marginBottom: '2em',
        maxWidth: '60%',
        paddingBottom: '0.5em',
        paddingLeft: '1em',
        paddingRight: '1em',
        paddingTop: '0.5em',
    },
    statusMessage: {
        marginTop: '2em',
        maxWidth: '60%',
        whiteSpace: 'pre-line',
    },
    buttonBar: {
        alignItems: 'center',
        display: 'flex',
        height: '4em',
        marginTop: 'auto',
    },
    cancelButton: {
        marginLeft: '1em',
    },
    progressIndicator: {
        alignItems: 'center',
        display: 'flex',
    },
    progressText: {
        marginLeft: '1em',
    },
    uploadDetails: {
        marginLeft: '2em',
    },
}));

interface SourceResponse {
    uploads: Upload[];
}

interface Upload {
    _id: string;
    status: string;
    summary: UploadSummary;
    created: Date;
}

interface UploadSummary {
    numCreated?: number;
    numUpdated?: number;
    error?: string;
}

interface Props {
    user: User;
    onModalClose: () => void;
}

export interface AutomatedBackfillValues {
    caseReference?: CaseReferenceForm;
    startDate: string | null;
    endDate: string | null;
}

const AutomatedBackfillSchema = Yup.object().shape({
    caseReference: Yup.object().shape({
        sourceId: Yup.string().required('Required'),
    }),
    startDate: Yup.string().nullable().required('Required'),
    endDate: Yup.string().nullable().required('Required'),
});

export default function AutomatedBackfill(props: Props): JSX.Element {
    const classes = useStyles();
    const [errorMessage, setErrorMessage] = React.useState('');
    const [successMessage, setSuccessMessage] = React.useState('');
    const [sourceId, setSourceId] = React.useState('');
    const [uploadId, setUploadId] = React.useState('');
    const [uploadStart, setUploadStart] = React.useState(0);
    const [uploadStatus, setUploadStatus] = React.useState('');

    useInterval(async () => {
        if (uploadStatus === 'IN_PROGRESS') {
            const response = await axios.get<SourceResponse>(
                `/api/sources/${sourceId}`,
            );
            const upload = response.data.uploads.find(
                (u) => u._id === uploadId,
            );
            if (!upload) {
                setUploadStatus('');
                setErrorMessage(
                    'Internal error saving upload. Please try again after a few minutes.',
                );
            } else if (upload.status === 'ERROR') {
                setUploadStatus(upload.status);
                setErrorMessage(
                    `Upload ${uploadId} failed with error: ${upload.summary.error}`,
                );
            } else if (upload.status === 'SUCCESS') {
                setUploadStatus(upload.status);
                const baseMessage = `Upload ${uploadId} completed successfully.`;
                const createMessage = upload.summary?.numCreated
                    ? ` Created ${upload.summary.numCreated} case(s).`
                    : '';
                const updateMessage = upload.summary?.numUpdated
                    ? ` Updated ${upload.summary.numUpdated} case(s).`
                    : '';
                setSuccessMessage(
                    baseMessage.concat(createMessage, updateMessage),
                );
            } else if (uploadStart && outOfTime(uploadStart)) {
                setUploadStatus('ERROR');
                setErrorMessage(
                    `Upload ${uploadId} failed with timeout.
                     This typically means that the parsing function wasn't able to ingest all cases in the provided range within the function time limit.
                     Please search the line list by the above upload ID to find what dates were covered, and for subsequent backfills, try running over a date range with fewer cases.`,
                );
                await axios.put(
                    `/api/sources/${sourceId}/uploads/${uploadId}`,
                    {
                        status: 'ERROR',
                        summary: {
                            error: 'TIMEOUT',
                        },
                    },
                );
            }
        }
    }, 10000);

    /**
     * Determines whether or not backfill has exceeded the configured time
     * limit.
     *
     * @param startTime - Time at which backfill began.
     */
    const outOfTime = (startTime: number): boolean => {
        return Date.now() - startTime > _BACKFILL_TIME_LIMIT_MS;
    };

    /**
     * Convert the supplied date to a local YYYY-MM-DD format.
     *
     * Our date picker component returns a timezoned datetime, but for the
     * purposes of backfill, users really just want to select a timezone-less
     * date, as opposed to an instant in time.
     *
     * Converting to this format allows a proper range comparison for retrieval
     * and parsing.
     */
    const isoDateString = (date: Date): string => {
        const offsetMs = date.getTimezoneOffset() * 60 * 1000;
        const msLocal = date.getTime() - offsetMs;
        return new Date(msLocal).toISOString().split('T')[0];
    };

    const triggerBackfill = async (
        values: AutomatedBackfillValues,
    ): Promise<void> => {
        try {
            setErrorMessage('');
            setSuccessMessage('');
            // This will never happen, because of Yup validation.
            if (
                values.caseReference === undefined ||
                values.startDate === null ||
                values.endDate === null
            ) {
                setErrorMessage('Please enter valid source and dates');
                return;
            }
            setSourceId(values.caseReference.sourceId);
            const utcStartDateString = isoDateString(
                new Date(values.startDate),
            );
            const utcEndDateString = isoDateString(new Date(values.endDate));
            const baseUri = `/api/sources/${values.caseReference.sourceId}/retrieve`;
            const fullUri = `${baseUri}?parse_start_date=${utcStartDateString}&parse_end_date=${utcEndDateString}`;
            const response = await axios.post<RetrievalResult>(
                encodeURI(fullUri),
            );
            setUploadStart(Date.now());
            setUploadStatus('IN_PROGRESS');
            setUploadId(response.data.upload_id);
        } catch (e) {
            setSuccessMessage('');
            setErrorMessage(e.response?.data?.message || e.toString());
            return;
        }
    };

    return (
        <AppModal
            title="New automated source backfill"
            onModalClose={props.onModalClose}
        >
            <Formik
                validationSchema={AutomatedBackfillSchema}
                validateOnChange={false}
                initialValues={{
                    caseReference: undefined,
                    startDate: null,
                    endDate: null,
                }}
                onSubmit={(values): Promise<void> => {
                    return triggerBackfill(values);
                }}
            >
                {({ isSubmitting, submitForm }): JSX.Element => (
                    <div className={classes.form}>
                        <div className={classes.headerText}>
                            <Typography data-testid="header-title" variant="h5">
                                Backfill historical data
                            </Typography>
                            <Typography
                                className={classes.headerBlurb}
                                data-testid="header-blurb"
                                variant="body2"
                            >
                                Automatically ingest cases for a configured
                                source over a specified date range.
                            </Typography>
                        </div>
                        <Form>
                            <Paper className={classes.allFormSections}>
                                <div className={classes.formSection}>
                                    <Source
                                        freeSolo={false}
                                        sourcesWithStableIdentifiers
                                    />
                                </div>
                                <DateField
                                    name="startDate"
                                    label="First date to backfill (inclusive)"
                                    required
                                ></DateField>
                                <DateField
                                    name="endDate"
                                    label="Last date to backfill (inclusive)"
                                    required
                                ></DateField>
                            </Paper>
                        </Form>
                        {successMessage && (
                            <MuiAlert
                                className={classes.statusMessage}
                                elevation={6}
                                variant="filled"
                                severity="success"
                            >
                                {successMessage}
                            </MuiAlert>
                        )}
                        {errorMessage && (
                            <MuiAlert
                                className={classes.statusMessage}
                                elevation={6}
                                variant="filled"
                                severity="error"
                            >
                                {errorMessage}
                            </MuiAlert>
                        )}
                        {(isSubmitting || uploadStatus === 'IN_PROGRESS') && (
                            <MuiAlert
                                className={classes.statusMessage}
                                data-testid="progressDetails"
                                elevation={6}
                                severity="info"
                                variant="filled"
                            >
                                <strong>Backfill in progress.</strong>
                                <br />
                                This can take up to 15 minutes. Do not run
                                another backfill until this completes.
                                <br />
                                This page will automatically update with upload
                                details.
                                {uploadId && (
                                    <>
                                        <br />
                                        Upload ID: {uploadId}.
                                    </>
                                )}
                            </MuiAlert>
                        )}
                        <div className={classes.buttonBar}>
                            <Button
                                variant="contained"
                                color="primary"
                                data-testid="submit"
                                disabled={
                                    isSubmitting ||
                                    uploadStatus === 'IN_PROGRESS'
                                }
                                onClick={submitForm}
                            >
                                Backfill source
                            </Button>
                            <Button
                                className={classes.cancelButton}
                                color="primary"
                                disabled={
                                    isSubmitting ||
                                    uploadStatus === 'IN_PROGRESS'
                                }
                                onClick={props.onModalClose}
                                variant="outlined"
                            >
                                Cancel
                            </Button>
                            <span style={{ flexGrow: 1 }}></span>
                            {(isSubmitting ||
                                uploadStatus === 'IN_PROGRESS') && (
                                <div className={classes.progressIndicator}>
                                    <CircularProgress data-testid="progress" />
                                    <span className={classes.progressText}>
                                        <strong>Processing backfill.</strong>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Formik>
        </AppModal>
    );
}
