import {
    Button,
    Grid,
    LinearProgress,
    Paper,
    Typography,
} from '@material-ui/core';
import {
    Case,
    GenomeSequence,
    Location,
    Travel,
    Variant,
    VerificationStatus,
} from './Case';
import React, { useEffect, useState } from 'react';
import AppModal from './AppModal';
import EditIcon from '@material-ui/icons/EditOutlined';
import { Link } from 'react-router-dom';
import MuiAlert from '@material-ui/lab/Alert';
import Scroll from 'react-scroll';
import StaticMap from './StaticMap';
import axios from 'axios';
import createHref from './util/links';
import { makeStyles } from '@material-ui/core';
import renderDate, { renderDateRange } from './util/date';
import shortId from 'shortid';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useTheme } from '@material-ui/core/styles';
import Highlighter from 'react-highlight-words';
import { useSelector } from 'react-redux';
import {
    selectSearchQuery,
    selectFilterBreadcrumbs,
} from './App/redux/selectors';
import Chip from '@material-ui/core/Chip';

const styles = makeStyles((theme) => ({
    errorMessage: {
        height: 'fit-content',
        width: '100%',
    },
}));

interface Props {
    id: string;
    enableEdit?: boolean;
    onModalClose: () => void;
}

export default function ViewCase(props: Props): JSX.Element {
    const [c, setCase] = useState<Case>();
    const [loading, setLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>();

    useEffect(() => {
        setLoading(true);
        axios
            .get<Case[]>(`/api/cases/${props.id}`)
            .then((resp) => {
                setCase(resp.data[0]);
                setErrorMessage(undefined);
            })
            .catch((e) => {
                setCase(undefined);
                setErrorMessage(e.response?.data?.message || e.toString());
            })
            .finally(() => setLoading(false));
    }, [props.id]);

    const classes = styles();

    return (
        <AppModal title="Case details" onModalClose={props.onModalClose}>
            {loading && <LinearProgress />}
            {errorMessage && (
                <MuiAlert
                    className={classes.errorMessage}
                    elevation={6}
                    variant="filled"
                    severity="error"
                >
                    {errorMessage}
                </MuiAlert>
            )}
            {c && <CaseDetails enableEdit={props.enableEdit} c={c} />}
        </AppModal>
    );
}

interface CaseDetailsProps {
    c: Case;
    enableEdit?: boolean;
}

const useStyles = makeStyles((theme) => ({
    paper: {
        background: theme.palette.background.paper,
        marginTop: '1em',
    },
    caseTitle: {
        marginTop: '1em',
    },
    grid: {
        margin: '1em',
    },
    sectionTitle: {
        margin: '1em',
    },
    container: {
        marginTop: '1em',
        marginBottom: '1em',
    },
    editBtn: {
        marginLeft: '1em',
    },
    navMenu: {
        position: 'fixed',
        lineHeight: '2em',
        width: '10em',
        textTransform: 'uppercase',
    },
    alert: {
        backgroundColor: theme.palette.background.paper,
        borderRadius: theme.spacing(1),
        marginTop: theme.spacing(1),
    },
    casebox: {
        paddingRight: '20px',
        wordBreak: 'break-all',
    },
    breadcrumbChip: {
        margin: theme.spacing(0.5),
        marginRight: '8px',
    },
}));

function ageRange(range?: { start: number; end: number }): string {
    if (!range) {
        return '';
    }
    return range.start === range.end
        ? `${range.start}`
        : `${range.start}-${range.end}`;
}

function CaseDetails(props: CaseDetailsProps): JSX.Element {
    const theme = useTheme();
    const showNavMenu = useMediaQuery(theme.breakpoints.up('sm'));
    const classes = useStyles();

    const scrollTo = (name: string): void => {
        Scroll.scroller.scrollTo(name, {
            duration: 100,
            smooth: true,
            containerId: 'scroll-container',
        });
    };

    const isExcluded = () => {
        if (props.c.isSourceExcluded) {
            return 'Excluded';
        } else {
            return props.c.caseReference.verificationStatus || 'Unverified';
        }
    };

    const searchedKeywords = useSelector(selectSearchQuery);
    const filtersBreadcrumb = useSelector(selectFilterBreadcrumbs);

    return (
        <>
            {showNavMenu && (
                <nav className={classes.navMenu}>
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('case-data')}
                    >
                        case data
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('demographics')}
                    >
                        demographics
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('location')}
                    >
                        location
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('event-history')}
                    >
                        event history
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('symptoms')}
                    >
                        symptoms
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('transmission')}
                    >
                        transmission
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('travel-history')}
                    >
                        travel history
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('pathogens')}
                    >
                        pathogens
                    </Button>
                    <br />
                    <Button
                        variant="text"
                        onClick={(): void => scrollTo('notes')}
                    >
                        notes
                    </Button>
                </nav>
            )}
            <div
                className={classes.container}
                style={{
                    marginLeft: showNavMenu ? '10em' : '0',
                }}
            >
                {searchedKeywords && (
                    <>
                        <Chip
                            label="Searched query:"
                            color="primary"
                            className={classes.breadcrumbChip}
                        />

                        {filtersBreadcrumb.map((breadcrumb) => (
                            <Chip
                                key={breadcrumb.key}
                                label={`${breadcrumb.key} - ${breadcrumb.value}`}
                                className={classes.breadcrumbChip}
                            />
                        ))}
                    </>
                )}
                <Typography className={classes.caseTitle} variant="h5">
                    Case {props.c._id}{' '}
                    {props.enableEdit && (
                        <Link
                            to={`/cases/edit/${props.c._id}`}
                            style={{ textDecoration: 'none' }}
                        >
                            <Button
                                variant="outlined"
                                color="primary"
                                className={classes.editBtn}
                                endIcon={<EditIcon />}
                            >
                                Edit
                            </Button>
                        </Link>
                    )}
                </Typography>
                {(props.c.caseReference.verificationStatus ===
                    VerificationStatus.Excluded ||
                    props.c.isSourceExcluded) && (
                    <MuiAlert
                        classes={{ root: classes.alert }}
                        variant="outlined"
                        severity="error"
                    >
                        This case is excluded. That means it's ignored in the
                        automated ingestion process
                    </MuiAlert>
                )}
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="case-data"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Case data
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Data source" />
                            <RowContent
                                content={props.c.caseReference?.sourceId}
                            />

                            <RowHeader title="Data source URL" />
                            <RowContent
                                content={props.c.caseReference?.sourceUrl}
                                isLink
                            />

                            <RowHeader title="Data source entry ID" />
                            <RowContent
                                content={
                                    props.c.caseReference?.sourceEntryId || ''
                                }
                            />

                            <RowHeader title="Data upload IDs" />
                            <RowContent
                                content={
                                    props.c.caseReference?.uploadIds?.join(
                                        ', ',
                                    ) || ''
                                }
                            />

                            {props.c.caseReference?.additionalSources && (
                                <>
                                    <RowHeader title="Additional sources" />
                                    <MultilinkRowContent
                                        links={props.c.caseReference?.additionalSources?.map(
                                            (e) => {
                                                return {
                                                    title: e.sourceUrl,
                                                    link: e.sourceUrl,
                                                };
                                            },
                                        )}
                                    />
                                </>
                            )}

                            <RowHeader title="Date of creation" />
                            <RowContent
                                content={renderDate(
                                    props.c.revisionMetadata?.creationMetadata
                                        ?.date,
                                )}
                            />

                            <RowHeader title="Created by" />
                            <RowContent
                                content={
                                    props.c.revisionMetadata?.creationMetadata
                                        ?.curator || ''
                                }
                            />

                            {/* Consider surfacing this as a top-level icon on this page. */}
                            <RowHeader title="Verification status" />
                            <RowContent content={isExcluded()} />

                            {props.c.revisionMetadata?.updateMetadata && (
                                <>
                                    <RowHeader title="Date of edit" />
                                    <RowContent
                                        content={renderDate(
                                            props.c.revisionMetadata
                                                ?.updateMetadata?.date,
                                        )}
                                    />

                                    <RowHeader title="Edited by" />
                                    <RowContent
                                        content={
                                            props.c.revisionMetadata
                                                ?.updateMetadata?.curator || ''
                                        }
                                    />
                                </>
                            )}
                        </Grid>
                    </Scroll.Element>
                </Paper>
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="demographics"
                        className={classes.casebox}
                    ></Scroll.Element>
                    <Typography
                        className={classes.sectionTitle}
                        variant="overline"
                    >
                        Demographics
                    </Typography>
                    <Grid container className={classes.grid}>
                        <RowHeader title="Age" />
                        <RowContent
                            content={ageRange(props.c.demographics?.ageRange)}
                        />

                        <RowHeader title="Gender" />
                        <RowContent content={props.c.demographics?.gender} />

                        <RowHeader title="Occupation" />
                        <RowContent
                            content={props.c.demographics?.occupation}
                        />

                        <RowHeader title="Nationalities" />
                        <RowContent
                            content={props.c.demographics?.nationalities?.join(
                                ', ',
                            )}
                        />

                        <RowHeader title="Race / Ethnicity" />
                        <RowContent content={props.c.demographics?.ethnicity} />
                    </Grid>
                </Paper>
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element name="location" className={classes.casebox}>
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Location
                        </Typography>
                        <Grid container className={classes.grid}>
                            <LocationRows loc={props.c.location} />
                        </Grid>
                    </Scroll.Element>
                </Paper>
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="event-history"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Event history
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Confirmed case date" />
                            <RowContent
                                content={renderDateRange(
                                    props.c.events?.find(
                                        (e) => e.name === 'confirmed',
                                    )?.dateRange,
                                )}
                            />

                            <RowHeader title="Confirmation method" />
                            <RowContent
                                content={
                                    props.c.events?.find(
                                        (e) => e.name === 'confirmed',
                                    )?.value || ''
                                }
                            />

                            <RowHeader title="Symptom onset date" />
                            <RowContent
                                content={renderDateRange(
                                    props.c.events?.find(
                                        (e) => e.name === 'onsetSymptoms',
                                    )?.dateRange,
                                )}
                            />

                            <RowHeader title="First clinical consultation" />
                            <RowContent
                                content={renderDateRange(
                                    props.c.events?.find(
                                        (e) =>
                                            e.name ===
                                            'firstClinicalConsultation',
                                    )?.dateRange,
                                )}
                            />

                            <RowHeader title="Date of self isolation" />
                            <RowContent
                                content={renderDateRange(
                                    props.c.events?.find(
                                        (e) => e.name === 'selfIsolation',
                                    )?.dateRange,
                                )}
                            />

                            <RowHeader title="Hospital admission" />
                            <RowContent
                                content={
                                    props.c.events?.find(
                                        (e) => e.name === 'hospitalAdmission',
                                    )?.value || ''
                                }
                            />

                            <RowHeader title="Hospital admission date" />
                            <RowContent
                                content={renderDateRange(
                                    props.c.events?.find(
                                        (e) => e.name === 'hospitalAdmission',
                                    )?.dateRange,
                                )}
                            />

                            <RowHeader title="Date admitted to isolation unit" />
                            <RowContent
                                content={renderDateRange(
                                    props.c.events?.find(
                                        (e) => e.name === 'icuAdmission',
                                    )?.dateRange,
                                )}
                            />

                            <RowHeader title="Outcome" />
                            <RowContent
                                content={
                                    props.c.events?.find(
                                        (e) => e.name === 'outcome',
                                    )?.value || ''
                                }
                            />

                            <RowHeader title="Outcome date" />
                            <RowContent
                                content={renderDateRange(
                                    props.c.events?.find(
                                        (e) => e.name === 'outcome',
                                    )?.dateRange,
                                )}
                            />
                        </Grid>
                    </Scroll.Element>
                </Paper>
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element name="symptoms" className={classes.casebox}>
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Symptoms
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Symptoms status" />
                            <RowContent content={props.c.symptoms?.status} />
                            <RowHeader title="Symptoms" />
                            <RowContent
                                content={props.c.symptoms?.values?.join(', ')}
                            />
                        </Grid>
                    </Scroll.Element>
                </Paper>
                <Paper className={classes.paper} variant="outlined" square>
                    <Typography
                        className={classes.sectionTitle}
                        variant="overline"
                    >
                        Preexisting conditions
                    </Typography>
                    <Grid container className={classes.grid}>
                        <RowHeader title="Has preexisting conditions" />
                        <RowContent
                            content={
                                props.c.preexistingConditions
                                    ?.hasPreexistingConditions === undefined
                                    ? ''
                                    : props.c.preexistingConditions
                                          .hasPreexistingConditions
                                    ? 'Yes'
                                    : 'No'
                            }
                        />

                        <RowHeader title="Preexisting conditions" />
                        <RowContent
                            content={
                                props.c.preexistingConditions?.values?.join(
                                    ', ',
                                ) || ''
                            }
                        />
                    </Grid>
                </Paper>
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="transmission"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Transmission
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Route of transmission" />
                            <RowContent
                                content={props.c.transmission?.routes?.join(
                                    ', ',
                                )}
                            />

                            <RowHeader title="Places of transmission" />
                            <RowContent
                                content={props.c.transmission?.places?.join(
                                    ', ',
                                )}
                            />

                            <RowHeader title="Related cases" />
                            <MultilinkRowContent
                                links={props.c.transmission?.linkedCaseIds?.map(
                                    (e) => {
                                        return {
                                            title: e,
                                            link: `/cases/view/${e}`,
                                        };
                                    },
                                )}
                            />
                        </Grid>
                    </Scroll.Element>
                </Paper>
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="travel-history"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Travel history
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Travelled in last 30 days" />
                            <RowContent
                                content={
                                    props.c.travelHistory
                                        ?.traveledPrior30Days === undefined
                                        ? ''
                                        : props.c.travelHistory
                                              .traveledPrior30Days
                                        ? 'Yes'
                                        : 'No'
                                }
                            />

                            {props.c.travelHistory?.travel?.map((e) => (
                                <TravelRow
                                    key={shortId.generate()}
                                    travel={e}
                                />
                            ))}
                        </Grid>
                    </Scroll.Element>
                </Paper>
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element
                        name="pathogens"
                        className={classes.casebox}
                    >
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Pathogens & genome sequencing
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Pathogens" />
                            <RowContent
                                content={props.c.pathogens
                                    ?.map((e) => `${e.name} (${e.id})`)
                                    .join(', ')}
                            />

                            {props.c.genomeSequences?.map((e) => (
                                <GenomeSequenceRows
                                    key={shortId.generate()}
                                    sequence={e}
                                />
                            ))}
                            <VariantRows variant={props.c.variant} />
                        </Grid>
                    </Scroll.Element>
                </Paper>
                <Paper className={classes.paper} variant="outlined" square>
                    <Scroll.Element name="notes" className={classes.casebox}>
                        <Typography
                            className={classes.sectionTitle}
                            variant="overline"
                        >
                            Notes
                        </Typography>
                        <Grid container className={classes.grid}>
                            <RowHeader title="Notes" />
                            <RowContent content={props.c.notes} />
                        </Grid>
                    </Scroll.Element>
                </Paper>
            </div>
        </>
    );
}

function GenomeSequenceRows(props: { sequence: GenomeSequence }): JSX.Element {
    return (
        <>
            <RowHeader title="Date of sample collection" />
            <RowContent
                content={renderDate(props.sequence?.sampleCollectionDate)}
            />

            <RowHeader title="Genome sequence repository" />
            <RowContent content={props.sequence?.repositoryUrl || ''} isLink />

            <RowHeader title="Genome sequence name" />
            <RowContent content={props.sequence?.sequenceName || ''} />

            <RowHeader title="Genome sequence length" />
            <RowContent content={`${props.sequence?.sequenceLength}` || ''} />

            <RowHeader title="Genome sequence accession" />
            <RowContent content={props.sequence?.sequenceId || ''} />
        </>
    );
}

function VariantRows(props: { variant: Variant }): JSX.Element {
    return (
        <>
            <RowHeader title="Variant of Concern" />
            <RowContent content={props.variant?.name || ''} />
        </>
    );
}

function LocationRows(props: { loc?: Location }): JSX.Element {
    return (
        <>
            <RowHeader title="Location" />
            <RowContent content={props.loc?.name || ''} />

            <RowHeader title="Location type" />
            <RowContent content={props.loc?.geoResolution || ''} />

            <RowHeader title="Admin area 1" />
            <RowContent content={props.loc?.administrativeAreaLevel1 || ''} />

            <RowHeader title="Admin area 2" />
            <RowContent content={props.loc?.administrativeAreaLevel2 || ''} />

            <RowHeader title="Admin area 3" />
            <RowContent content={props.loc?.administrativeAreaLevel3 || ''} />

            <RowHeader title="Country" />
            <RowContent content={props.loc?.country || ''} />

            <RowHeader title="Latitude" />
            <RowContent
                content={`${props.loc?.geometry?.latitude?.toFixed(4)}`}
            />
            <RowHeader title="Longitude" />
            <RowContent
                content={`${props.loc?.geometry?.longitude?.toFixed(4)}`}
            />
            <MapRow location={props.loc} />
        </>
    );
}

const headerStyles = makeStyles(() => ({
    separatedHeader: {
        marginTop: '3em',
    },
}));

function TravelRow(props: { travel: Travel }): JSX.Element {
    const classes = headerStyles();
    return (
        <>
            <span className={classes.separatedHeader}></span>

            <RowHeader title="Methods of travel" />
            <RowContent content={props.travel.methods?.join(', ') || ''} />

            <RowHeader title="Travel dates" />
            <RowContent content={renderDateRange(props.travel.dateRange)} />

            <RowHeader title="Primary reason of travel" />
            <RowContent content={props.travel.purpose || ''} />

            <LocationRows loc={props.travel.location} />
        </>
    );
}

function MapRow(props: { location?: Location }): JSX.Element {
    return (
        <Grid item xs={12}>
            {props.location?.geometry && (
                <StaticMap geometry={props.location.geometry} />
            )}
        </Grid>
    );
}

function RowHeader(props: { title: string }): JSX.Element {
    return (
        <Grid item xs={4}>
            <Typography variant="body2">{props.title}</Typography>
        </Grid>
    );
}

function RowContent(props: { content: string; isLink?: boolean }): JSX.Element {
    const searchQuery = useSelector(selectSearchQuery);
    const searchQueryArray =
        searchQuery.match(/(?<=")[^"]+(?=")|\w{3,}/g) ?? [];

    return (
        <Grid item xs={8}>
            {props.isLink && props.content ? (
                <a
                    href={createHref(props.content)}
                    rel="noopener noreferrer"
                    target="_blank"
                >
                    <Highlighter
                        highlightStyle={{ fontWeight: 'bold' }}
                        className="highlighted"
                        searchWords={searchQueryArray}
                        autoEscape={true}
                        textToHighlight={props.content}
                    />
                </a>
            ) : (
                <Highlighter
                    highlightStyle={{ fontWeight: 'bold' }}
                    className="highlighted"
                    searchWords={searchQueryArray}
                    autoEscape={true}
                    textToHighlight={props.content}
                />
            )}
        </Grid>
    );
}

function MultilinkRowContent(props: {
    links?: { title: string; link: string }[];
}): JSX.Element {
    return (
        <Grid item xs={8}>
            {props.links?.map((e) => (
                <p key={e.title} style={{ margin: 0 }}>
                    <a
                        href={createHref(e.link)}
                        rel="noopener noreferrer"
                        target="_blank"
                    >
                        {e.title}
                    </a>
                </p>
            ))}
        </Grid>
    );
}
