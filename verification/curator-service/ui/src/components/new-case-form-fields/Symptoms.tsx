import {
    FormikAutocomplete,
    SelectField,
} from '../common-form-fields/FormikFields';

import CaseFormValues from './CaseFormValues';
import { Chip } from '@material-ui/core';
import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import React from 'react';
import Scroll from 'react-scroll';
import axios from 'axios';
import { makeStyles } from '@material-ui/core';
import { useFormikContext } from 'formik';

const useStyles = makeStyles(() => ({
    chip: {
        margin: '0.5em',
    },
    section: {
        marginBottom: '1em',
    },
}));

// If changing this list, also modify https://github.com/globaldothealth/list/blob/main/data-serving/data-service/api/openapi.yaml
const symptomStatusValues = [
    'Unknown',
    'Asymptomatic',
    'Symptomatic',
    'Presymptomatic',
];

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Symptom status:</strong> Enter the symptom status for
                the case.
                <ul>
                    <li>
                        <strong>Asymtomatic:</strong> Case is a confirmed
                        carrier of the disease but has not experienced any
                        symptoms.
                    </li>
                    <li>
                        <strong>Symptomatic:</strong> Case is a confirmed
                        carrier of the disease and experiences symptoms.
                    </li>
                    <li>
                        <strong>Presymptomatic:</strong> Case is a confirmed
                        carrier but hasn’t developed symptoms at the time of
                        confirmation but may have at a later time point.
                    </li>
                    <li>
                        <strong>Unknown:</strong> There is no symptom data
                        provided for the case.
                    </li>
                </ul>
                If no data is provided select unknown.
            </li>
            <li>
                <strong>Symptoms:</strong> Select the symptoms reported for the
                case.
                <ul>
                    <li>
                        You can either manually search in the field by typing
                        and selecting each from the prepopulated list or click
                        the most common symptom from the list below.
                    </li>
                    <li>
                        You can select multiple symptoms per case as reported by
                        the source. Try and be as specific as possible.
                    </li>
                </ul>
            </li>
        </ul>
    </StyledTooltip>
);

export default function Symptoms(): JSX.Element {
    const { values, initialValues, setFieldValue } =
        useFormikContext<CaseFormValues>();
    const [commonSymptoms, setCommonSymptoms] = React.useState([]);

    React.useEffect(
        () => {
            axios
                .get('/api/cases/symptoms?limit=5')
                .then((response) =>
                    setCommonSymptoms(response.data.symptoms ?? []),
                );
        },
        // Using [] here means this will only be called once at the beginning of the lifecycle
        [],
    );

    const classes = useStyles();
    return (
        <Scroll.Element name="symptoms">
            <FieldTitle title="Symptoms" tooltip={<TooltipText />}></FieldTitle>
            <SelectField
                name="symptomsStatus"
                label="Symptom status"
                values={symptomStatusValues}
            ></SelectField>
            {values.symptomsStatus === 'Symptomatic' && (
                <>
                    {commonSymptoms.length > 0 && (
                        <>
                            <div className={classes.section}>
                                Frequently added symptoms
                            </div>
                            <div className={classes.section}>
                                {commonSymptoms.map((symptom) => (
                                    <Chip
                                        key={symptom}
                                        className={classes.chip}
                                        label={symptom}
                                        onClick={(): void => {
                                            if (
                                                !values.symptoms.includes(
                                                    symptom,
                                                )
                                            ) {
                                                setFieldValue(
                                                    'symptoms',
                                                    values.symptoms.concat([
                                                        symptom,
                                                    ]),
                                                );
                                            }
                                        }}
                                    ></Chip>
                                ))}
                            </div>
                        </>
                    )}
                    <FormikAutocomplete
                        name="symptoms"
                        label="Symptoms"
                        initialValue={initialValues.symptoms}
                        multiple
                        optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/symptoms.txt"
                    />
                </>
            )}
        </Scroll.Element>
    );
}
