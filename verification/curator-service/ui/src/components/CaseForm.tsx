import * as Yup from 'yup';

import { Button, LinearProgress, Typography } from '@material-ui/core';
import { Case, VerificationStatus } from './Case';
import { Form, Formik } from 'formik';
import { GenomeSequence, Travel } from './new-case-form-fields/CaseFormValues';
import { Paper, makeStyles } from '@material-ui/core';
import Source, { submitSource } from './common-form-fields/Source';
import { green, grey, red } from '@material-ui/core/colors';

import AppModal from './AppModal';
import CaseFormValues from './new-case-form-fields/CaseFormValues';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import Demographics from './new-case-form-fields/Demographics';
import ErrorIcon from '@material-ui/icons/Error';
import Events from './new-case-form-fields/Events';
import GenomeSequences from './new-case-form-fields/GenomeSequences';
import LocationForm from './new-case-form-fields/LocationForm';
import MuiAlert from '@material-ui/lab/Alert';
import Notes from './new-case-form-fields/Notes';
import NumCases from './new-case-form-fields/NumCases';
import Pathogens from './new-case-form-fields/Pathogens';
import PreexistingConditions from './new-case-form-fields/PreexistingConditions';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import React from 'react';
import Scroll from 'react-scroll';
import Symptoms from './new-case-form-fields/Symptoms';
import Transmission from './new-case-form-fields/Transmission';
import TravelHistory from './new-case-form-fields/TravelHistory';
import Variant from './new-case-form-fields/Variant';
import User from './User';
import axios from 'axios';
import { cloneDeep } from 'lodash';
import { hasKey } from './Utils';
import shortId from 'shortid';
import { toUTCDate } from './util/date';
import { useHistory } from 'react-router-dom';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useTheme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    appBar: {
        background: theme.palette.background.paper,
    },
    tableOfContents: {
        position: 'fixed',
    },
    tableOfContentsRow: {
        alignItems: 'center',
        display: 'flex',
    },
    form: {
        paddingLeft: '18em',
    },
    formSection: {
        padding: '0.5em 1em 1em',
        margin: '2em 0',
    },
    statusMessage: {
        marginTop: '1em',
        maxWidth: '80%',
    },
    cancelButton: { marginLeft: '1em' },
}));

function initialValuesFromCase(c?: Case): CaseFormValues {
    if (!c) {
        return {
            caseReference: { sourceId: '', sourceUrl: '' },
            gender: '',
            minAge: undefined,
            maxAge: undefined,
            age: undefined,
            ethnicity: undefined,
            nationalities: [],
            occupation: '',
            location: undefined,
            confirmedDate: null,
            methodOfConfirmation: '',
            onsetSymptomsDate: null,
            firstClinicalConsultationDate: null,
            selfIsolationDate: null,
            admittedToHospital: '',
            hospitalAdmissionDate: null,
            admittedToIcu: '',
            icuAdmissionDate: null,
            outcomeDate: null,
            outcome: '',
            symptomsStatus: '',
            symptoms: [],
            variantName: undefined,
            hasPreexistingConditions: '',
            preexistingConditions: [],
            transmissionRoutes: [],
            transmissionPlaces: [],
            transmissionLinkedCaseIds: [],
            traveledPrior30Days: '',
            travelHistory: [],
            genomeSequences: [],
            pathogens: [],
            notes: '',
            numCases: 1,
        };
    }
    return {
        caseReference: c.caseReference,
        gender: c.demographics?.gender || '',
        minAge:
            c.demographics?.ageRange?.start !== c.demographics?.ageRange?.end
                ? c.demographics?.ageRange?.start
                : undefined,
        maxAge:
            c.demographics?.ageRange?.start !== c.demographics?.ageRange?.end
                ? c.demographics?.ageRange?.end
                : undefined,
        age:
            c.demographics?.ageRange?.start === c.demographics?.ageRange?.end
                ? c.demographics?.ageRange?.start
                : undefined,
        ethnicity: c.demographics?.ethnicity,
        nationalities: c.demographics?.nationalities,
        occupation: c.demographics?.occupation ?? '',
        location: c.location,
        confirmedDate:
            c.events.find((event) => event.name === 'confirmed')?.dateRange
                ?.start || null,
        methodOfConfirmation:
            c.events.find((event) => event.name === 'confirmed')?.value || '',
        onsetSymptomsDate:
            c.events.find((event) => event.name === 'onsetSymptoms')?.dateRange
                ?.start || null,
        firstClinicalConsultationDate:
            c.events.find((event) => event.name === 'firstClinicalConsultation')
                ?.dateRange?.start || null,
        selfIsolationDate:
            c.events.find((event) => event.name === 'selfIsolation')?.dateRange
                ?.start || null,
        admittedToHospital:
            c.events.find((event) => event.name === 'hospitalAdmission')
                ?.value || '',
        hospitalAdmissionDate:
            c.events.find((event) => event.name === 'hospitalAdmission')
                ?.dateRange?.start || null,
        admittedToIcu:
            c.events.find((event) => event.name === 'icuAdmission')?.value ||
            '',
        icuAdmissionDate:
            c.events.find((event) => event.name === 'icuAdmission')?.dateRange
                ?.start || null,
        outcomeDate:
            c.events.find((event) => event.name === 'outcome')?.dateRange
                ?.start || null,
        outcome:
            c.events.find((event) => event.name === 'outcome')?.value || '',
        symptomsStatus: c.symptoms?.status || '',
        symptoms: c.symptoms?.values,
        variantName: c.variant?.name || undefined,
        hasPreexistingConditions:
            c.preexistingConditions?.hasPreexistingConditions === undefined
                ? ''
                : c.preexistingConditions?.hasPreexistingConditions
                ? 'Yes'
                : 'No',
        preexistingConditions: c.preexistingConditions?.values ?? [],
        transmissionRoutes: c.transmission?.routes,
        transmissionPlaces: c.transmission?.places,
        transmissionLinkedCaseIds: c.transmission?.linkedCaseIds,
        traveledPrior30Days:
            c.travelHistory?.traveledPrior30Days === undefined
                ? ''
                : c.travelHistory.traveledPrior30Days
                ? 'Yes'
                : 'No',
        travelHistory: c.travelHistory?.travel?.map((travel) => {
            return { reactId: shortId.generate(), ...travel };
        }),
        genomeSequences: c.genomeSequences?.map((genomeSequence) => {
            return { reactId: shortId.generate(), ...genomeSequence };
        }),
        pathogens: c.pathogens,
        notes: c.notes,
        numCases: undefined,
    };
}

interface Props {
    user: User;
    initialCase?: Case;
    onModalClose: () => void;
}

// TODO: get 0 and 120 min/max age values from the backend.
const NewCaseValidation = Yup.object().shape(
    {
        caseReference: Yup.object().shape({
            sourceUrl: Yup.string().required('Required'),
            sourceName: Yup.string().when('sourceId', {
                is: (sourceId) => !sourceId,
                then: Yup.string().required('Required'),
            }),
        }),
        minAge: Yup.number()
            .min(0, 'Age must be between 0 and 120')
            .max(120, 'Age must be between 0 and 120')
            .when('maxAge', {
                is: (maxAge) => maxAge !== undefined && maxAge !== '',
                then: Yup.number().required(
                    'Min age required in range. Minimum value is 0.',
                ),
            }),
        maxAge: Yup.number()
            .min(0, 'Age must be between 0 and 120')
            .max(120, 'Age must be between 0 and 120')
            .when('minAge', {
                is: (minAge) => minAge !== undefined && minAge !== '',
                then: Yup.number()
                    .min(
                        Yup.ref('minAge'),
                        'Max age must be greater than than min age',
                    )
                    .required(
                        'Max age required in range. Maximum value is 120.',
                    ),
            }),
        age: Yup.number()
            .min(0, 'Age must be between 0 and 120')
            .max(120, 'Age must be between 0 and 120')
            .when('minAge', {
                is: (minAge) => minAge !== undefined && minAge !== '',
                then: Yup.number().oneOf(
                    [undefined],
                    'Cannot enter age and age range',
                ),
            })
            .when('maxAge', {
                is: (maxAge) => maxAge !== undefined && maxAge !== '',
                then: Yup.number().oneOf(
                    [undefined],
                    'Cannot enter age and age range',
                ),
            }),
        transmissionLinkedCaseIds: Yup.array().of(
            Yup.string().matches(new RegExp('[a-z0-9]{24}'), 'Invalid case ID'),
        ),
        confirmedDate: Yup.string().nullable().required('Required'),
        location: Yup.object().required('Required'),
        numCases: Yup.number()
            .nullable()
            .min(1, 'Must enter one or more cases'),
    },
    [['maxAge', 'minAge']],
);

function hasErrors(
    fields: string[],
    errors: Record<string, unknown>,
    touched: Record<string, unknown>,
): boolean {
    for (const field of fields) {
        if (
            hasKey(touched, field) &&
            touched[field] &&
            hasKey(errors, field) &&
            errors[field] !== undefined
        ) {
            return true;
        }
    }
    return false;
}

function unknownOrEmptyToUndefined(
    value: string | undefined,
): string | undefined {
    if (value === 'Unknown' || value === '') return undefined;
    return value;
}

export default function CaseForm(props: Props): JSX.Element {
    const { initialCase } = props;
    const theme = useTheme();
    const showTableOfContents = useMediaQuery(theme.breakpoints.up('sm'));
    const classes = useStyles();
    const history = useHistory();
    const [errorMessage, setErrorMessage] = React.useState('');

    const filterTravel = (travel: Travel[]): Travel[] => {
        const filteredTravel = cloneDeep(travel);
        filteredTravel?.forEach((travel) => {
            delete travel.reactId;
            if (
                travel.dateRange.start === null &&
                travel.dateRange.end === null
            ) {
                delete travel.dateRange;
            } else {
                if (travel.dateRange.start === null) {
                    delete travel.dateRange.start;
                }
                if (travel.dateRange.end === null) {
                    delete travel.dateRange.end;
                }
            }
            if (travel.dateRange?.start) {
                travel.dateRange.start = toUTCDate(travel.dateRange.start);
            }
            if (travel.dateRange?.end) {
                travel.dateRange.end = toUTCDate(travel.dateRange.end);
            }
            if (travel.purpose === 'Unknown') {
                travel.purpose = undefined;
            }
        });
        return filteredTravel;
    };

    const filterGenomeSequences = (
        genomeSequences: GenomeSequence[],
    ): GenomeSequence[] => {
        const filteredGenomeSequences = cloneDeep(genomeSequences);
        filteredGenomeSequences?.forEach((genomeSequence) => {
            delete genomeSequence.reactId;
            if (genomeSequence.sampleCollectionDate) {
                genomeSequence.sampleCollectionDate = toUTCDate(
                    genomeSequence.sampleCollectionDate,
                );
            }
        });
        return filteredGenomeSequences;
    };

    const submitCase = async (values: CaseFormValues): Promise<void> => {
        if (values.caseReference && values.caseReference.sourceId === '') {
            try {
                const newCaseReference = await submitSource({
                    name: values.caseReference.sourceName as string,
                    url: values.caseReference.sourceUrl,
                });
                values.caseReference.sourceId = newCaseReference.sourceId;
            } catch (e) {
                setErrorMessage(
                    `System error during source creation: ${JSON.stringify(e)}`,
                );
                return;
            }
        }
        const ageRange = values.age
            ? { start: values.age, end: values.age }
            : { start: values.minAge, end: values.maxAge };
        const newCase = {
            caseReference: {
                ...values.caseReference,
                verificationStatus: VerificationStatus.Verified,
            },
            demographics: {
                gender: unknownOrEmptyToUndefined(values.gender),
                ageRange: ageRange,
                ethnicity: values.ethnicity,
                nationalities: values.nationalities,
                occupation: unknownOrEmptyToUndefined(values.occupation),
            },
            location: values.location,
            events: [
                {
                    name: 'confirmed',
                    dates: values.confirmedDate,
                    value: values.methodOfConfirmation,
                },
                {
                    name: 'onsetSymptoms',
                    dates: values.onsetSymptomsDate,
                    value: undefined,
                },
                {
                    name: 'firstClinicalConsultation',
                    dates: values.firstClinicalConsultationDate,
                    value: undefined,
                },
                {
                    name: 'selfIsolation',
                    dates: values.selfIsolationDate,
                    value: undefined,
                },
                {
                    name: 'hospitalAdmission',
                    dates:
                        values.admittedToHospital === 'Yes'
                            ? values.hospitalAdmissionDate
                            : undefined,
                    value: values.admittedToHospital,
                },
                {
                    name: 'icuAdmission',
                    dates:
                        values.admittedToIcu === 'Yes'
                            ? values.icuAdmissionDate
                            : undefined,
                    value: values.admittedToIcu,
                },
                {
                    name: 'outcome',
                    dates:
                        values.outcome !== '' && values.outcome !== 'Unknown'
                            ? values.outcomeDate
                            : undefined,
                    value: values.outcome,
                },
            ]
                .filter((elem) => elem.dates || elem.value)
                .map((elem) => {
                    return {
                        name: elem.name,
                        dateRange: elem.dates
                            ? {
                                  start: toUTCDate(elem.dates),
                                  end: toUTCDate(elem.dates),
                              }
                            : undefined,
                        value: unknownOrEmptyToUndefined(elem.value),
                    };
                }),
            symptoms: {
                status: unknownOrEmptyToUndefined(values.symptomsStatus),
                values:
                    values.symptomsStatus === 'Symptomatic'
                        ? values.symptoms
                        : [],
            },
            variant: {
                name: values.variantName,
            },
            preexistingConditions: {
                hasPreexistingConditions:
                    values.hasPreexistingConditions === 'Yes'
                        ? true
                        : values.hasPreexistingConditions === 'No'
                        ? false
                        : undefined,
                values:
                    values.hasPreexistingConditions === 'Yes'
                        ? values.preexistingConditions
                        : [],
            },
            transmission: {
                routes: values.transmissionRoutes,
                places: values.transmissionPlaces,
                linkedCaseIds: values.transmissionLinkedCaseIds,
            },
            travelHistory: {
                traveledPrior30Days:
                    values.traveledPrior30Days === 'Yes'
                        ? true
                        : values.traveledPrior30Days === 'No'
                        ? false
                        : undefined,
                travel:
                    values.traveledPrior30Days === 'Yes'
                        ? filterTravel(values.travelHistory)
                        : undefined,
            },
            genomeSequences: filterGenomeSequences(values.genomeSequences),
            pathogens: values.pathogens,
            notes: values.notes,
        };
        let newCaseIds = [];
        try {
            // Update or create depending on the presence of the initial case ID.
            if (props.initialCase?._id) {
                await axios.put(
                    `/api/cases/${props.initialCase?._id}`,
                    newCase,
                );
            } else {
                const numCases = values.numCases ?? 1;
                const postResponse = await axios.post(
                    `/api/cases?num_cases=${numCases}`,
                    newCase,
                );
                if (numCases === 1) {
                    newCaseIds = [postResponse.data._id];
                } else {
                    newCaseIds = postResponse.data.cases.map(
                        (c: Case) => c._id,
                    );
                }
            }
            setErrorMessage('');
        } catch (e) {
            setErrorMessage(e.response?.data?.message || e.toString());
            return;
        }
        // Navigate to cases after successful submit
        history.push({
            pathname: '/cases',
            state: {
                newCaseIds: newCaseIds,
                editedCaseIds: props.initialCase?._id
                    ? [props.initialCase._id]
                    : [],
            },
        });
    };

    const tableOfContentsIcon = (opts: {
        isChecked: boolean;
        hasError: boolean;
    }): JSX.Element => {
        return opts.hasError ? (
            <ErrorIcon
                data-testid="error-icon"
                style={{
                    color: red[500],
                    margin: '0.25em 0.5em',
                }}
            ></ErrorIcon>
        ) : opts.isChecked ? (
            <CheckCircleIcon
                data-testid="check-icon"
                style={{
                    color: green[500],
                    margin: '0.25em 0.5em',
                }}
            ></CheckCircleIcon>
        ) : (
            <RadioButtonUncheckedIcon
                style={{
                    color: grey[500],
                    margin: '0.25em 0.5em',
                }}
            ></RadioButtonUncheckedIcon>
        );
    };

    const scrollTo = (name: string): void => {
        Scroll.scroller.scrollTo(name, {
            duration: 100,
            smooth: true,
            offset: -64, // Account for header height
            containerId: 'scroll-container',
        });
    };

    return (
        <AppModal
            title={
                props.initialCase
                    ? 'Edit case'
                    : 'Create new COVID-19 line list case'
            }
            onModalClose={props.onModalClose}
        >
            <Formik
                initialValues={initialValuesFromCase(initialCase)}
                validationSchema={NewCaseValidation}
                // Validating on change slows down the form too much. It will
                // validate on blur and form submission.
                validateOnChange={false}
                onSubmit={(values) => submitCase(values)}
            >
                {({
                    submitForm,
                    isSubmitting,
                    values,
                    errors,
                    touched,
                }): JSX.Element => (
                    <div>
                        {showTableOfContents && (
                            <nav className={classes.tableOfContents}>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void => scrollTo('source')}
                                >
                                    {tableOfContentsIcon({
                                        isChecked:
                                            values.caseReference !==
                                                undefined &&
                                            values.caseReference !== null &&
                                            values.caseReference.sourceUrl !==
                                                null &&
                                            values.caseReference.sourceUrl !==
                                                undefined &&
                                            values.caseReference.sourceUrl !==
                                                '',
                                        hasError: hasErrors(
                                            ['caseReference'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Source'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void =>
                                        scrollTo('demographics')
                                    }
                                >
                                    {tableOfContentsIcon({
                                        isChecked:
                                            values.gender !== '' ||
                                            (values.age !== undefined &&
                                                values.age.toString() !== '') ||
                                            (values.minAge !== undefined &&
                                                values.minAge.toString() !==
                                                    '' &&
                                                values.maxAge !== undefined &&
                                                values.maxAge.toString() !==
                                                    '') ||
                                            values.ethnicity !== undefined ||
                                            values.nationalities?.length > 0 ||
                                            values.occupation !== '',
                                        hasError: hasErrors(
                                            [
                                                'gender',
                                                'minAge',
                                                'maxAge',
                                                'age',
                                                'ethnicity',
                                                'nationalities',
                                                'occupation',
                                            ],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Demographics'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void => scrollTo('location')}
                                >
                                    {tableOfContentsIcon({
                                        isChecked:
                                            values.location !== null &&
                                            values.location !== undefined,
                                        hasError: hasErrors(
                                            ['location'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Location'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void => scrollTo('events')}
                                >
                                    {tableOfContentsIcon({
                                        isChecked:
                                            values.confirmedDate !== null,
                                        hasError: hasErrors(
                                            [
                                                'confirmedDate',
                                                'methodOfConfirmation',
                                                'onsetSymptomsDate',
                                                'firstClinicalConsultationDate',
                                                'selfIsolationDate',
                                                'admittedToHospital',
                                                'hospitalAdmissionDate',
                                                'icuAdmissionDate',
                                                'outcomeDate',
                                                'outcome',
                                            ],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Events'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void => scrollTo('symptoms')}
                                >
                                    {tableOfContentsIcon({
                                        isChecked: values.symptomsStatus !== '',
                                        hasError: hasErrors(
                                            ['symptomsStatus', 'symptoms'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Symptoms'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void =>
                                        scrollTo('preexistingConditions')
                                    }
                                >
                                    {tableOfContentsIcon({
                                        isChecked:
                                            values.hasPreexistingConditions !==
                                            '',
                                        hasError: hasErrors(
                                            [
                                                'hasPreexistingConditions',
                                                'preexistingConditions',
                                            ],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Preexisting conditions'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void =>
                                        scrollTo('transmission')
                                    }
                                >
                                    {tableOfContentsIcon({
                                        isChecked:
                                            values.transmissionRoutes?.length >
                                                0 ||
                                            values.transmissionPlaces?.length >
                                                0 ||
                                            values.transmissionLinkedCaseIds
                                                ?.length > 0,
                                        hasError: hasErrors(
                                            [
                                                'transmissionRoutes',
                                                'transmissionPlaces',
                                                'transmissionLinkedCaseIds',
                                            ],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Transmission'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void =>
                                        scrollTo('travelHistory')
                                    }
                                >
                                    {tableOfContentsIcon({
                                        isChecked:
                                            values.traveledPrior30Days !== '',
                                        hasError: hasErrors(
                                            [
                                                'traveledPrior30Days',
                                                'travelHistory',
                                            ],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Travel History'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void =>
                                        scrollTo('genomeSequences')
                                    }
                                >
                                    {tableOfContentsIcon({
                                        isChecked:
                                            values.genomeSequences?.length > 0,
                                        hasError: hasErrors(
                                            ['genomeSequences'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Genome Sequences'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void =>
                                        scrollTo('variantOfConcern')
                                    }
                                >
                                    {tableOfContentsIcon({
                                        isChecked:
                                            values?.variantName !== undefined &&
                                            (values?.variantName?.length ?? 0) >
                                                0,
                                        hasError: hasErrors(
                                            ['variant'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Variant of Concern'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void => scrollTo('pathogens')}
                                >
                                    {tableOfContentsIcon({
                                        isChecked: values.pathogens?.length > 0,
                                        hasError: hasErrors(
                                            ['pathogens'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Pathogens'.toLocaleUpperCase()}
                                </div>
                                <div
                                    className={classes.tableOfContentsRow}
                                    onClick={(): void => scrollTo('notes')}
                                >
                                    {tableOfContentsIcon({
                                        isChecked: values.notes?.trim() !== '',
                                        hasError: hasErrors(
                                            ['notes'],
                                            errors,
                                            touched,
                                        ),
                                    })}
                                    {'Notes'.toLocaleUpperCase()}
                                </div>
                                {!props.initialCase && (
                                    <div
                                        className={classes.tableOfContentsRow}
                                        onClick={(): void =>
                                            scrollTo('numCases')
                                        }
                                    >
                                        {tableOfContentsIcon({
                                            isChecked: values.numCases !== 1,
                                            hasError: hasErrors(
                                                ['numCases'],
                                                errors,
                                                touched,
                                            ),
                                        })}
                                        {'Number of cases'.toLocaleUpperCase()}
                                    </div>
                                )}
                            </nav>
                        )}
                        <div
                            className={showTableOfContents ? classes.form : ''}
                        >
                            <Typography variant="h4">
                                Enter the details for{' '}
                                {props.initialCase
                                    ? 'an existing case'
                                    : 'a new case'}
                            </Typography>
                            <Typography variant="body2">
                                Complete all available data for the case.
                                Required fields are marked.
                            </Typography>
                            <Form>
                                <Paper classes={{ root: classes.formSection }}>
                                    <Source
                                        initialValue={values.caseReference}
                                        hasSourceEntryId={true}
                                    ></Source>
                                </Paper>
                                <Paper classes={{ root: classes.formSection }}>
                                    <Demographics></Demographics>
                                </Paper>
                                <Paper classes={{ root: classes.formSection }}>
                                    <LocationForm></LocationForm>
                                </Paper>
                                <Paper classes={{ root: classes.formSection }}>
                                    <Events></Events>
                                </Paper>
                                <Paper classes={{ root: classes.formSection }}>
                                    <Symptoms></Symptoms>
                                </Paper>
                                <Paper classes={{ root: classes.formSection }}>
                                    <PreexistingConditions></PreexistingConditions>
                                </Paper>
                                <Paper classes={{ root: classes.formSection }}>
                                    <Transmission></Transmission>
                                </Paper>
                                <Paper classes={{ root: classes.formSection }}>
                                    <TravelHistory></TravelHistory>
                                </Paper>
                                <Paper classes={{ root: classes.formSection }}>
                                    <GenomeSequences></GenomeSequences>
                                </Paper>
                                <Paper classes={{ root: classes.formSection }}>
                                    <Variant></Variant>
                                </Paper>
                                <Paper classes={{ root: classes.formSection }}>
                                    <Pathogens></Pathogens>
                                </Paper>
                                <Paper classes={{ root: classes.formSection }}>
                                    <Notes></Notes>
                                </Paper>
                                {!props.initialCase && (
                                    <Paper
                                        classes={{ root: classes.formSection }}
                                    >
                                        <NumCases></NumCases>
                                    </Paper>
                                )}
                                {isSubmitting && <LinearProgress />}
                                <br />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    disableElevation
                                    data-testid="submit"
                                    disabled={isSubmitting}
                                    onClick={submitForm}
                                >
                                    {props.initialCase
                                        ? 'Submit case edit'
                                        : 'Submit case'}
                                </Button>
                                <Button
                                    className={classes.cancelButton}
                                    color="primary"
                                    variant="outlined"
                                    onClick={props.onModalClose}
                                >
                                    Cancel
                                </Button>
                            </Form>
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
                        </div>
                    </div>
                )}
            </Formik>
        </AppModal>
    );
}
