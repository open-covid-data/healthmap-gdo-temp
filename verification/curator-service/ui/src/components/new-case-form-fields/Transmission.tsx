import { Chip, makeStyles } from '@material-ui/core';

import CaseFormValues from './CaseFormValues';
import ChipInput from 'material-ui-chip-input';
import FieldTitle from '../common-form-fields/FieldTitle';
import { StyledTooltip } from './StyledTooltip';
import { FormikAutocomplete } from '../common-form-fields/FormikFields';
import React from 'react';
import Scroll from 'react-scroll';
import axios from 'axios';
import { useFormikContext } from 'formik';

const useStyles = makeStyles(() => ({
    fieldRow: {
        marginBottom: '2em',
        width: '100%',
    },
    chip: {
        margin: '0.5em',
    },
    section: {
        marginBottom: '1em',
    },
}));

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>Route of transmission:</strong> Enter the route of
                transmission if provided by the source.
            </li>
            <li>
                <strong>Place of transmission:</strong> Enter the place of
                transmission if provided by the source.
            </li>
        </ul>
    </StyledTooltip>
);

export default function Transmission(): JSX.Element {
    const { setFieldValue, setTouched, initialValues, values } =
        useFormikContext<CaseFormValues>();
    const [commonPlacesOfTransmission, setCommonPlacesOfTransmission] =
        React.useState([]);
    const classes = useStyles();

    React.useEffect(
        () => {
            axios
                .get('/api/cases/placesOfTransmission?limit=5')
                .then((response) =>
                    setCommonPlacesOfTransmission(
                        response.data.placesOfTransmission ?? [],
                    ),
                );
        },
        // Using [] here means this will only be called once at the beginning of the lifecycle
        [],
    );

    return (
        <Scroll.Element name="transmission">
            <FieldTitle
                title="Transmission"
                tooltip={<TooltipText />}
            ></FieldTitle>
            <div className={classes.fieldRow}>
                <FormikAutocomplete
                    name="transmissionRoutes"
                    freeSolo
                    label="Route of transmission"
                    initialValue={initialValues.transmissionRoutes}
                    multiple
                    optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/route_of_transmission.txt"
                />
            </div>
            <div className={classes.fieldRow}>
                {commonPlacesOfTransmission.length > 0 && (
                    <>
                        <div className={classes.section}>
                            Frequently added places of transmission
                        </div>{' '}
                        <div className={classes.section}>
                            {commonPlacesOfTransmission.map((place) => (
                                <Chip
                                    key={place}
                                    className={classes.chip}
                                    label={place}
                                    onClick={(): void => {
                                        if (
                                            !values.transmissionPlaces.includes(
                                                place,
                                            )
                                        ) {
                                            setFieldValue(
                                                'transmissionPlaces',
                                                values.transmissionPlaces.concat(
                                                    [place],
                                                ),
                                            );
                                        }
                                    }}
                                ></Chip>
                            ))}
                        </div>
                    </>
                )}
                <FormikAutocomplete
                    name="transmissionPlaces"
                    freeSolo
                    label="Places of transmission"
                    initialValue={initialValues.transmissionPlaces}
                    multiple
                    optionsLocation="https://raw.githubusercontent.com/globaldothealth/list/main/suggest/place_of_transmission.txt"
                />
            </div>
            <ChipInput
                fullWidth
                alwaysShowPlaceholder
                placeholder="Contacted case IDs"
                defaultValue={initialValues.transmissionLinkedCaseIds}
                onBlur={(): void =>
                    setTouched({ transmissionLinkedCaseIds: true })
                }
                onChange={(values): void => {
                    setFieldValue(
                        'transmissionLinkedCaseIds',
                        values ?? undefined,
                    );
                }}
            ></ChipInput>
        </Scroll.Element>
    );
}
