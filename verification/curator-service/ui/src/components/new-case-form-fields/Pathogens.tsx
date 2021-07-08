import { Field, FormikTouched, useFormikContext } from 'formik';

import { Autocomplete } from '@material-ui/lab';
import CaseFormValues from './CaseFormValues';
import FieldTitle from '../common-form-fields/FieldTitle';
import React from 'react';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';
import { StyledTooltip } from './StyledTooltip';
import axios from 'axios';

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                You can search for pathogens by starting to type and then
                selecting from the autocomplete list.{' '}
            </li>
            <li>Multiple pathogens can be selected if required.</li>
            <li>
                You do not need to select the pathogen for the disease of the
                dataset e.g. coronavirus, that will automatically be selected
                for the case.
            </li>
        </ul>
    </StyledTooltip>
);

export default function Pathogens(): JSX.Element {
    return (
        <Scroll.Element name="pathogens">
            <FieldTitle
                title="Pathogens"
                tooltip={<TooltipText />}
            ></FieldTitle>
            <PathogensAutocomplete />
        </Scroll.Element>
    );
}

// Based on https://material-ui.com/components/autocomplete/#asynchronous-requests.
export function PathogensAutocomplete(): JSX.Element {
    const [open, setOpen] = React.useState(false);
    const [options, setOptions] = React.useState<Map<string, number>>(
        new Map(),
    );
    const loading = open && options.keys.length === 0;
    const { setFieldValue, setTouched, initialValues } =
        useFormikContext<CaseFormValues>();

    React.useEffect(() => {
        let active = true;

        if (!loading) {
            return undefined;
        }

        (async (): Promise<void> => {
            const resp = await axios.get<string>(
                'https://raw.githubusercontent.com/globaldothealth/list/main/suggest/pathogens.csv',
            );
            // CSV lines are of the form '123,Disease name' and we want to
            // map that to [{'Disease name', 123}]
            const retrievedOptions = new Map(
                resp.data.split('\n').map((option) => {
                    const optionArray = option.split(',');
                    return [optionArray[1], +optionArray[0]];
                }),
            );

            if (active) {
                setOptions(retrievedOptions);
            }
        })();

        return (): void => {
            active = false;
        };
    }, [initialValues, loading, setFieldValue, setOptions, setTouched]);

    React.useEffect(() => {
        if (!open) {
            setOptions(new Map());
        }
    }, [open, setOptions]);

    return (
        <Autocomplete
            multiple
            filterSelectedOptions
            itemType="string"
            open={open}
            onOpen={(): void => {
                setOpen(true);
            }}
            onClose={(): void => {
                setOpen(false);
            }}
            options={Array.from(options.keys())}
            loading={loading}
            onChange={(_, values): void => {
                setFieldValue(
                    'pathogens',
                    values?.map((pathogenName) => {
                        return {
                            name: pathogenName,
                            id: options.get(pathogenName),
                        };
                    }) ?? undefined,
                );
            }}
            onBlur={(): void =>
                setTouched({
                    pathogens: true,
                } as unknown as FormikTouched<CaseFormValues>)
            }
            defaultValue={initialValues.pathogens?.map(
                (pathogen) => pathogen.name,
            )}
            renderInput={(params): JSX.Element => (
                // Do not use FastField here
                <Field
                    {...params}
                    // Setting the name properly allows any typed value
                    // to be set in the form values, rather than only selected
                    // dropdown values. Thus we use an unused form value here.
                    name="unused"
                    data-testid={'pathogens'}
                    label={'Pathogens'}
                    component={TextField}
                ></Field>
            )}
        />
    );
}
