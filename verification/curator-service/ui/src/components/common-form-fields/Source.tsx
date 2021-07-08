import { Autocomplete, createFilterOptions } from '@material-ui/lab';
import { FastField, Field, useFormikContext } from 'formik';
import { Typography, makeStyles } from '@material-ui/core';

import BulkCaseFormValues from '../bulk-case-form-fields/BulkCaseFormValues';
import CaseFormValues from '../new-case-form-fields/CaseFormValues';
import { CaseReference } from '../Case';
import FieldTitle from './FieldTitle';
import React from 'react';
import { RequiredHelperText } from './FormikFields';
import Scroll from 'react-scroll';
import { TextField } from 'formik-material-ui';
import { StyledTooltip } from '../new-case-form-fields/StyledTooltip';
import axios from 'axios';
import { throttle } from 'lodash';

interface SourceProps {
    initialValue?: CaseReference;
    hasSourceEntryId?: boolean;
    freeSolo?: boolean;
    sourcesWithStableIdentifiers?: boolean;
}

const TooltipText = () => (
    <StyledTooltip>
        <ul>
            <li>
                <strong>New data source:</strong> If this is a new data source
                you will need to add it to the system along with the root data
                source name. For example if the raw source was the ""7th July
                Press Release from Honduras” the source name would be the issuer
                of the press release e.g. “Honduras ministry of health'. The
                source name needs to reflect the actually provider of the data,
                not the method of reporting.
            </li>
            <li>
                <strong>Existing data source:</strong> If the URL is an existing
                source already in the system, select the appropriate source from
                the list provided.
            </li>
        </ul>
    </StyledTooltip>
);

export default class Source extends React.Component<SourceProps, unknown> {
    render(): JSX.Element {
        const freeSolo =
            this.props.freeSolo === undefined ? true : this.props.freeSolo;
        return (
            <Scroll.Element name="source">
                <FieldTitle
                    title="Data Source"
                    tooltip={<TooltipText />}
                ></FieldTitle>
                <SourcesAutocomplete
                    initialValue={this.props.initialValue}
                    freeSolo={freeSolo}
                    sourcesWithStableIdentifiers={
                        this.props.sourcesWithStableIdentifiers
                    }
                />
                {this.props.hasSourceEntryId && (
                    <FastField
                        label="Source entry ID"
                        name="caseReference.sourceEntryId"
                        type="text"
                        data-testid="sourceEntryId"
                        component={TextField}
                        fullWidth
                    />
                )}
            </Scroll.Element>
        );
    }
}

interface OriginData {
    url: string;
}

interface SourceData {
    _id: string;
    name: string;
    origin: OriginData;
    hasStableIdentifiers?: boolean;
}

interface ListSourcesResponse {
    sources: SourceData[];
}

interface SourceAutocompleteProps {
    initialValue?: CaseReferenceForm;
    freeSolo: boolean;
    sourcesWithStableIdentifiers?: boolean;
}

export interface CaseReferenceForm extends CaseReference {
    inputValue?: string;
    sourceName?: string;
}

export async function submitSource(opts: {
    name: string;
    url: string;
    format?: string;
}): Promise<CaseReference> {
    const newSource = {
        name: opts.name,
        origin: {
            url: opts.url,
        },
        format: opts.format,
    };
    const resp = await axios.post<SourceData>('/api/sources', newSource);
    return {
        sourceId: resp.data._id,
        sourceUrl: opts.url,
        additionalSources: [] as unknown as [{ sourceUrl: string }],
    };
}

const filter = createFilterOptions<CaseReferenceForm>();

const useStyles = makeStyles(() => ({
    sourceNameField: {
        marginTop: '1em',
    },
}));

export function SourcesAutocomplete(
    props: SourceAutocompleteProps,
): JSX.Element {
    const classes = useStyles();
    const name = 'caseReference';
    const [value, setValue] = React.useState<CaseReferenceForm | null>(
        props.initialValue ? props.initialValue : null,
    );

    const [inputValue, setInputValue] = React.useState('');
    const [options, setOptions] = React.useState<CaseReferenceForm[]>([]);
    const { setFieldValue, setTouched, values } = useFormikContext<
        CaseFormValues | BulkCaseFormValues
    >();

    const fetch = React.useMemo(
        () =>
            throttle(
                async (
                    request: { url: string },
                    callback: (results?: SourceData[]) => void,
                ) => {
                    const resp = await axios.get<ListSourcesResponse>(
                        '/api/sources',
                        {
                            params: request,
                        },
                    );
                    // this filtering could also be done server-side but there isn't a big number of sources
                    if (props.sourcesWithStableIdentifiers) {
                        callback(
                            resp.data.sources.filter((s) => {
                                return (
                                    s.hasStableIdentifiers === undefined ||
                                    s.hasStableIdentifiers === true
                                );
                            }),
                        );
                    } else {
                        callback(resp.data.sources);
                    }
                },
                250,
            ),
        [props.sourcesWithStableIdentifiers],
    );

    const sourceURLValidation = (str: string) => {
        if (str.length > 0) {
            const pattern = new RegExp(
                '^(https?:\\/\\/)?' + // protocol
                    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                    '(\\#[-a-z\\d_]*)?$',
                'i',
            ); // fragment locator
            return !!pattern.test(str);
        } else {
            return true;
        }
    };

    React.useEffect(() => {
        let active = true;

        fetch({ url: inputValue }, (results?: SourceData[]) => {
            if (active) {
                let newOptions = [] as CaseReferenceForm[];

                if (results) {
                    newOptions = [
                        ...newOptions,
                        ...results.map((source) => ({
                            sourceId: source._id,
                            sourceUrl: source.origin.url,
                            sourceName: source.name,
                            additionalSources: [] as unknown as [
                                { sourceUrl: string },
                            ],
                        })),
                    ];
                }

                setOptions(newOptions);
            }
        });

        return (): void => {
            active = false;
        };
    }, [value, inputValue, fetch]);

    return (
        <React.Fragment>
            <Autocomplete
                itemType="CaseReferenceForm"
                getOptionLabel={(option: CaseReferenceForm): string =>
                    // option is a string if the user typed a URL and did not
                    // select a dropdown value.
                    typeof option === 'string' ? option : option.sourceUrl
                }
                getOptionSelected={(
                    option: CaseReferenceForm,
                    value: CaseReferenceForm,
                ): boolean => {
                    return (
                        option.sourceId === value.sourceId &&
                        option.sourceUrl === value.sourceUrl
                    );
                }}
                onChange={(
                    _: unknown,
                    newValue: CaseReferenceForm | string | null,
                ): void => {
                    // newValue is a string if the user typed a URL and did not
                    // select a dropdown value.
                    if (typeof newValue === 'string') {
                        const existingOption = options.find(
                            (option) => option.sourceUrl === newValue,
                        );
                        newValue = existingOption ?? {
                            inputValue: newValue,
                            sourceUrl: newValue,
                            sourceId: '',
                            sourceName: values.caseReference?.sourceName ?? '',
                            additionalSources: [] as unknown as [
                                { sourceUrl: string },
                            ],
                        };
                    }
                    setValue(newValue);
                    setFieldValue(name, newValue);
                }}
                filterOptions={(
                    options: CaseReferenceForm[],
                    params,
                ): CaseReferenceForm[] => {
                    const filtered = filter(
                        options,
                        params,
                    ) as CaseReferenceForm[];

                    if (
                        params.inputValue !== '' &&
                        !filtered.find(
                            (caseRef) =>
                                caseRef.sourceUrl === params.inputValue,
                        ) &&
                        props.freeSolo
                    ) {
                        filtered.push({
                            inputValue: params.inputValue,
                            sourceUrl: params.inputValue,
                            sourceId: '',
                            sourceName: values.caseReference?.sourceName ?? '',
                            additionalSources: [] as unknown as [
                                { sourceUrl: string },
                            ],
                        });
                    }

                    return filtered;
                }}
                autoSelect
                freeSolo={props.freeSolo}
                selectOnFocus
                handleHomeEndKeys
                options={options}
                value={value}
                onBlur={(): void => setTouched({ [name]: true })}
                onInputChange={(event, newInputValue): void => {
                    setInputValue(newInputValue);
                }}
                renderInput={(params): JSX.Element => (
                    <div>
                        {/* Do not use FastField here */}
                        <Field
                            {...params}
                            // Setting the name properly allows any typed value
                            // to be set in the form values, rather than only selected
                            // dropdown values. Thus we use an unused form value here.
                            name="unused"
                            data-testid={name}
                            label="Paste URL for data source or search"
                            placeholder="https://..."
                            component={TextField}
                            fullWidth
                        ></Field>
                        <RequiredHelperText
                            name={name}
                            wrongUrl={sourceURLValidation(inputValue)}
                        ></RequiredHelperText>
                    </div>
                )}
                renderOption={(option: CaseReferenceForm): React.ReactNode => {
                    return (
                        <span>
                            <Typography variant="body2">
                                {option.sourceUrl}
                            </Typography>
                        </span>
                    );
                }}
            />
            {/* If this is a new source, show option to add name */}
            {inputValue &&
                props.freeSolo &&
                !options.find((option) => option.sourceUrl === inputValue) && (
                    <>
                        <FastField
                            className={classes.sourceNameField}
                            label="Source name"
                            name={`${name}.sourceName`}
                            helperText="Required"
                            type="text"
                            data-testid="sourceName"
                            component={TextField}
                            fullWidth
                        />
                    </>
                )}
        </React.Fragment>
    );
}
