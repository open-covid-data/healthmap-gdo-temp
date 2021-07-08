import React, { RefObject, useState, useEffect } from 'react';
import { RouteComponentProps, withRouter, useLocation } from 'react-router-dom';
import axios from 'axios';
import qs from 'qs';
import { round } from 'lodash';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    Menu,
    MenuItem,
    Paper,
    TablePagination,
    Theme,
    Typography,
    makeStyles,
    withStyles,
    LinearProgress,
    InputLabel,
    FormHelperText,
    FormControl,
    Select,
    Tooltip,
} from '@material-ui/core';
import { createStyles } from '@material-ui/core/styles';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import MaterialTable, { MTableToolbar, QueryResult } from 'material-table';
import Chip from '@material-ui/core/Chip';

import { Case, VerificationStatus } from './Case';
import CircularProgress from '@material-ui/core/CircularProgress';
import DeleteIcon from '@material-ui/icons/DeleteOutline';
import EditIcon from '@material-ui/icons/EditOutlined';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import { Link } from 'react-router-dom';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import MuiAlert from '@material-ui/lab/Alert';
import SaveAltIcon from '@material-ui/icons/SaveAlt';
import { ReactComponent as VerifiedIcon } from './assets/verified_icon.svg';
import { ReactComponent as UnverifiedIcon } from './assets/unverified_icon.svg';
import { ReactComponent as ExcludedIcon } from './assets/excluded_icon.svg';
import User from './User';
import VerificationStatusHeader from './VerificationStatusHeader';
import VerificationStatusIndicator from './VerificationStatusIndicator';
import CaseExcludeDialog from './CaseExcludeDialog';
import CaseIncludeDialog from './CaseIncludeDialog';
import renderDate, { renderDateRange } from './util/date';
import { URLToSearchQuery } from './util/searchQuery';
import { ChipData } from './App/App';
import { SortBy, SortByOrder } from '../constants/types';
import { connect, ConnectedProps } from 'react-redux';
import { RootState } from '../store';
import { SnackbarAlert } from './SnackbarAlert';

// Limit number of data that can be displayed or downloaded to avoid long execution times of mongo queries
const DATA_LIMIT = 10000;

interface ListResponse {
    cases: Case[];
    nextPage: number;
    total: number;
}

const mapStateToProps = (state: RootState) => ({
    filterBreadcrumbs: state.app.filterBreadcrumbs,
});
const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

interface LinelistTableState {
    url: string;
    error: string;
    page: number;
    pageSize: number;
    // The rows which are selected on the current page.
    selectedRowsCurrentPage: TableRow[];
    // The total number of rows selected. This can be larger than
    // selectedRowsCurrentPage.length if rows across all pages are selected.
    numSelectedRows: number;
    totalNumRows: number;
    deleteDialogOpen: boolean;
    excludeDialogOpen: boolean;
    includeDialogOpen: boolean;
    isLoading: boolean;
    isDeleting: boolean;

    selectedVerificationStatus: VerificationStatus;
    searchQuery: string;
}

// Material table doesn't handle structured fields well, we flatten all fields in this row.
interface TableRow {
    id: string;
    confirmedDate: Date | null;
    adminArea3: string;
    adminArea2: string;
    adminArea1: string;
    country: string;
    latitude: number;
    longitude: number;
    age: [number, number]; // start, end.
    gender: string;
    outcome?: string;
    hospitalizationDateRange?: string;
    symptomsOnsetDate?: string;
    sourceUrl: string;
    verificationStatus?: VerificationStatus;
    exclusionData?: {
        date: string;
        note: string;
    };
    nationalities?: string;
}

interface LocationState {
    newCaseIds: string[];
    editedCaseIds: string[];
    bulkMessage: string;
    page: number;
    pageSize: number;
}

interface Props
    extends PropsFromRedux,
        RouteComponentProps<never, never, LocationState>,
        WithStyles<typeof styles> {
    user: User;
    page: number;
    pageSize: number;
    sortBy: SortBy;
    sortByOrder: SortByOrder;

    onChangePage: (page: number) => void;

    onChangePageSize: (pageSize: number) => void;

    handleBreadcrumbDelete: (breadcrumbToDelete: ChipData) => void;
    setTotalDataCount: (value: number) => void;
    setFiltersModalOpen: (value: boolean) => void;
    setActiveFilterInput: (value: string) => void;
    setSortBy: (value: SortBy) => void;
    setSortByOrder: (value: SortByOrder) => void;
}

const styles = (theme: Theme) =>
    createStyles({
        alert: {
            backgroundColor: theme.palette.background.paper,
            borderRadius: theme.spacing(1),
            marginTop: theme.spacing(1),
        },
        centeredContent: {
            display: 'flex',
            justifyContent: 'center',
            cursor: 'pointer',
            margin: 'auto',
            width: 'fit-content',
            paddingBottom: '1px',
            '&:hover': {
                borderBottomWidth: '1px',
                borderBottomStyle: 'dotted',
                borderColor: 'black',
            },
        },
        dialogLoadingSpinner: {
            marginRight: theme.spacing(2),
            padding: '6px',
        },
        tablePaginationBar: {
            alignItems: 'center',
            backgroundColor: theme.palette.background.default,
            display: 'flex',
            justifyContent: 'space-between',
            height: '64px',
        },
        tableTitle: {
            minWidth: '150px',
        },
        tableToolbar: {
            backgroundColor: '#31A497',
        },
        toolbarItems: {
            color: theme.palette.background.paper,
        },
        breadcrumbChip: {
            margin: theme.spacing(0.5),
        },
    });

const rowMenuStyles = makeStyles((theme: Theme) => ({
    menuItemTitle: {
        marginLeft: theme.spacing(1),
    },
    dialogLoadingSpinner: {
        marginRight: theme.spacing(2),
        padding: '6px',
    },
}));

const StyledDownloadButton = withStyles((theme: Theme) => ({
    root: {
        whiteSpace: 'nowrap',
        minWidth: '240px',
    },
}))(Button);

const downloadDataModalStyles = makeStyles((theme: Theme) =>
    createStyles({
        downloadButton: {
            margin: '16px 0',
            width: '100%',
        },
        loader: {
            marginTop: '16px',
        },
        formControl: {
            maxWidth: '50%',
            margin: '8px 8px 8px 24px',
        },
        selectMenu: {
            paddingLeft: '20px',
        },
        MuiInputBase: {
            '& .MuiInput-input': {
                paddingLeft: '20px',
            },
        },
    }),
);

const sortSelectStyles = makeStyles((theme: Theme) => ({
    formControl: {
        minWidth: 150,
        margin: '0 20px 0 0',
    },
}));

function RowMenu(props: {
    rowId: string;
    rowData: TableRow;
    setError: (error: string) => void;
    refreshData: () => void;
}): JSX.Element {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] =
        React.useState<boolean>(false);
    const [excludeDialogOpen, setExcludeDialogOpen] =
        React.useState<boolean>(false);
    const [includeDialogOpen, setIncludeDialogOpen] =
        React.useState<boolean>(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const classes = rowMenuStyles();

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClose = (event?: any): void => {
        event?.stopPropagation();
        setAnchorEl(null);
    };

    const openDeleteDialog = async (
        event?: React.BaseSyntheticEvent,
    ): Promise<void> => {
        event?.stopPropagation();
        setDeleteDialogOpen(true);
    };

    const openExcludeDialog = async (
        event?: React.BaseSyntheticEvent,
    ): Promise<void> => {
        event?.stopPropagation();
        setExcludeDialogOpen(true);
    };

    const openIncludeDialog = async (
        event?: React.BaseSyntheticEvent,
    ): Promise<void> => {
        event?.stopPropagation();
        setIncludeDialogOpen(true);
    };

    const handleDelete = async (
        event?: React.BaseSyntheticEvent,
    ): Promise<void> => {
        event?.stopPropagation();
        try {
            setIsDeleting(true);
            props.setError('');
            const deleteUrl = '/api/cases/' + props.rowId;
            await axios.delete(deleteUrl);
            props.refreshData();
        } catch (e) {
            props.setError(e.toString());
        } finally {
            setDeleteDialogOpen(false);
            setIsDeleting(false);
            handleClose();
        }
    };

    const handleStatusChange = async (
        status: VerificationStatus,
        note?: string,
    ): Promise<void> => {
        try {
            props.setError('');
            await axios.post(`/api/cases/batchStatusChange`, {
                status,
                caseIds: [props.rowId],
                ...(note ? { note } : {}),
            });
            props.refreshData();
        } catch (e) {
            props.setError(e.toString());
        } finally {
            status === VerificationStatus.Excluded
                ? setIncludeDialogOpen(false)
                : setExcludeDialogOpen(false);
            handleClose();
        }
    };

    const isCaseExcluded =
        props.rowData.verificationStatus === VerificationStatus.Excluded;

    return (
        <>
            <IconButton
                aria-controls="topbar-menu"
                aria-haspopup="true"
                aria-label="row menu"
                data-testid="row menu"
                onClick={handleClick}
                color="inherit"
            >
                <MoreVertIcon />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                <Link onClick={handleClose} to={`/cases/edit/${props.rowId}`}>
                    <MenuItem>
                        <EditIcon />
                        <span className={classes.menuItemTitle}>Edit</span>
                    </MenuItem>
                </Link>
                <MenuItem onClick={openDeleteDialog}>
                    <DeleteIcon />
                    <span className={classes.menuItemTitle}>Delete</span>
                </MenuItem>
                {isCaseExcluded ? (
                    <MenuItem onClick={openIncludeDialog}>
                        <NotInterestedIcon />
                        <span className={classes.menuItemTitle}>Include</span>
                    </MenuItem>
                ) : (
                    <MenuItem onClick={openExcludeDialog}>
                        <NotInterestedIcon />
                        <span className={classes.menuItemTitle}>Exclude</span>
                    </MenuItem>
                )}
            </Menu>
            <Dialog
                open={deleteDialogOpen}
                onClose={(): void => setDeleteDialogOpen(false)}
                // Stops the click being propagated to the table which
                // would trigger the onRowClick action.
                onClick={(e): void => e.stopPropagation()}
            >
                <DialogTitle>
                    Are you sure you want to delete this case?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Case {props.rowId} will be permanently deleted.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    {isDeleting ? (
                        <CircularProgress
                            classes={{ root: classes.dialogLoadingSpinner }}
                        />
                    ) : (
                        <>
                            <Button
                                onClick={(): void => {
                                    setDeleteDialogOpen(false);
                                }}
                                color="primary"
                                autoFocus
                            >
                                Cancel
                            </Button>
                            <Button onClick={handleDelete} color="primary">
                                Yes
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>
            <CaseExcludeDialog
                isOpen={excludeDialogOpen}
                onClose={(): void => setExcludeDialogOpen(false)}
                onSubmit={(values: { note: string }): Promise<void> =>
                    handleStatusChange(VerificationStatus.Excluded, values.note)
                }
                caseIds={[props.rowId]}
            />
            <CaseIncludeDialog
                isOpen={includeDialogOpen}
                onClose={(): void => setIncludeDialogOpen(false)}
                onSubmit={(): Promise<void> =>
                    handleStatusChange(VerificationStatus.Unverified)
                }
                caseIds={[props.rowId]}
            />
        </>
    );
}

interface SortSelectProps {
    sortBy: SortBy;
    sortByOrder: SortByOrder;
    handleSortByChange: (sortBy: SortBy) => void;
    handleSortByOrderChange: (sortByOrder: SortByOrder) => void;
}

export function SortSelect({
    sortBy,
    sortByOrder,
    handleSortByChange,
    handleSortByOrderChange,
}: SortSelectProps): JSX.Element {
    const classes = sortSelectStyles();

    const sortKeywords = [
        { name: 'None', value: SortBy.Default },
        // Commenting out until fix is found for big queries sorting in mongodb
        // { name: 'Confirmed date', value: SortBy.ConfirmedDate },
        { name: 'Country', value: SortBy.Country },
        { name: 'Location admin 1', value: SortBy.Admin1 },
        { name: 'Location admin 2', value: SortBy.Admin2 },
        { name: 'Location admin 3', value: SortBy.Admin3 },
        { name: 'Age', value: SortBy.Age },
    ];

    const handleChange = (
        event: React.ChangeEvent<{ value: unknown; name?: string | undefined }>,
    ) => {
        const { value, name } = event.target;

        if (name === 'sortBy') {
            handleSortByChange(value as SortBy);
        } else {
            handleSortByOrderChange(value as SortByOrder);
        }
    };

    return (
        <>
            <FormControl className={classes.formControl}>
                <InputLabel id="sort-by-label">Sort by</InputLabel>
                <Select
                    id="sort-by-select"
                    labelId="sort-by-label"
                    name="sortBy"
                    value={sortBy}
                    onChange={handleChange}
                >
                    {sortKeywords.map((keyword) => (
                        <MenuItem
                            value={keyword.value}
                            key={keyword.value}
                            data-testid="sortby-option"
                        >
                            {keyword.name}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {sortBy !== SortBy.Default && (
                <FormControl className={classes.formControl}>
                    <InputLabel id="sort-by-order-label">Order</InputLabel>
                    <Select
                        labelId="sort-by-order-label"
                        name="sortByOrder"
                        value={sortByOrder}
                        onChange={handleChange}
                    >
                        <MenuItem value={SortByOrder.Ascending}>
                            Ascending
                        </MenuItem>
                        <MenuItem value={SortByOrder.Descending}>
                            Descending
                        </MenuItem>
                    </Select>
                </FormControl>
            )}
        </>
    );
}

interface DownloadButtonProps {
    totalCasesCount: number;
}

export function DownloadButton({
    totalCasesCount,
}: DownloadButtonProps): JSX.Element {
    const location = useLocation<LocationState>();
    const [isDownloadModalOpen, setIsDownloadModalOpen] =
        useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [fileFormat, setFileFormat] = useState('');
    const [showFullDatasetButton, setShowFullDatasetButton] = useState(true);
    const [downloadButtonDisabled, setDownloadButtonDisable] = useState(true);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const classes = downloadDataModalStyles();

    const downloadDataSet = async (dataSet: string, formatType?: string) => {
        setIsLoading(true);

        const searchQuery: string = URLToSearchQuery(location.search);
        switch (dataSet) {
            case 'fullDataset':
                try {
                    const response = await axios({
                        method: 'post',
                        url: '/api/cases/getDownloadLink',
                        data: { format: 'csv' },
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    window.location.href = response.data.signedUrl;
                } catch (err) {
                    alert(
                        `There was an error while downloading data, please try again later. ${err}`,
                    );
                }
                break;

            case 'mailDataset':
                try {
                    const response = await axios({
                        method: 'post',
                        url: '/api/cases/downloadAsync',
                        data: {
                            format: formatType,
                            query: searchQuery,
                        },
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });

                    if (response.status === 204) {
                        setSnackbarOpen(true);
                    }
                } catch (err) {
                    alert(
                        `There was an error while downloading data, please try again later. ${err}`,
                    );
                }
                break;

            case 'partialDataset':
                try {
                    const response = await axios({
                        method: 'post',
                        url: '/api/cases/download',
                        data: qs.stringify({
                            format: formatType,
                            limit: DATA_LIMIT,
                            query: searchQuery,
                        }),
                        responseType: 'blob',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                    });

                    const filename = response.headers['content-disposition']
                        .split('filename=')[1]
                        .replace(/["]/g, '');
                    const downloadUrl = window.URL.createObjectURL(
                        new Blob([response.data]),
                    );
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.setAttribute('download', filename);
                    document.body.appendChild(link);
                    link.click();
                } catch (err) {
                    alert(
                        `There was an error while downloading data, please try again later. ${err}`,
                    );
                }
                break;
        }

        setIsLoading(false);
        setIsDownloadModalOpen(false);
    };

    const disabledButtonTooltipText = downloadButtonDisabled
        ? 'Please first select the file format you want to download'
        : '';

    useEffect(() => {
        if (location.search !== '') {
            setShowFullDatasetButton(false);
        } else {
            setShowFullDatasetButton(true);
        }
    }, [location.search]);

    const handleFileFormatChange = (
        event: React.ChangeEvent<{ value: unknown }>,
    ) => {
        if (
            event.target.value === 'csv' ||
            event.target.value === 'tsv' ||
            event.target.value === 'json'
        ) {
            setDownloadButtonDisable(false);
        } else {
            setDownloadButtonDisable(true);
        }

        setFileFormat(event.target.value as string);
    };

    return (
        <>
            <SnackbarAlert
                isOpen={snackbarOpen}
                setIsOpen={setSnackbarOpen}
                message="Email sent successfully. Please check your inbox."
                type="success"
            />
            <StyledDownloadButton
                variant="outlined"
                color="primary"
                onClick={(): void => setIsDownloadModalOpen(true)}
                startIcon={<SaveAltIcon />}
            >
                Download dataset
            </StyledDownloadButton>
            <Dialog
                open={isDownloadModalOpen}
                onClose={(): void => setIsDownloadModalOpen(false)}
                // Stops the click being propagated to the table which
                // would trigger the onRowClick action.
                onClick={(e): void => e.stopPropagation()}
                fullWidth
            >
                <DialogTitle>Download dataset</DialogTitle>

                {!showFullDatasetButton && (
                    <FormControl className={classes.formControl}>
                        <InputLabel
                            shrink
                            id="demo-simple-select-placeholder-label-label"
                        ></InputLabel>
                        <Select
                            labelId="demo-simple-select-placeholder-label-label"
                            id="demo-simple-select-placeholder-label"
                            value={fileFormat}
                            onChange={handleFileFormatChange}
                            displayEmpty
                            className={classes.MuiInputBase}
                        >
                            <MenuItem value="">
                                <em>Data format</em>
                            </MenuItem>
                            <MenuItem value="csv">csv</MenuItem>
                            <MenuItem value="tsv">tsv</MenuItem>
                            <MenuItem value="json">json</MenuItem>
                        </Select>
                        <FormHelperText>
                            Please choose the file export format
                        </FormHelperText>
                    </FormControl>
                )}

                <DialogContent>
                    {showFullDatasetButton && (
                        <Typography variant="body2">
                            This download link provides access to the full
                            Global.health line list dataset, cached daily at
                            12:00am UTC. Any cases added past that time will not
                            be in the current download, but will be available
                            the next day.
                        </Typography>
                    )}

                    {isLoading && <LinearProgress className={classes.loader} />}
                    {showFullDatasetButton && (
                        <Button
                            variant="contained"
                            color="primary"
                            className={classes.downloadButton}
                            onClick={() => downloadDataSet('fullDataset')}
                            disabled={isLoading}
                        >
                            Download Full Dataset
                        </Button>
                    )}
                    {!showFullDatasetButton && (
                        <Tooltip
                            title={disabledButtonTooltipText}
                            placement="top"
                        >
                            <span>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    className={classes.downloadButton}
                                    onClick={() =>
                                        downloadDataSet(
                                            'partialDataset',
                                            fileFormat,
                                        )
                                    }
                                    disabled={
                                        isLoading || downloadButtonDisabled
                                    }
                                >
                                    {totalCasesCount >= DATA_LIMIT
                                        ? `Download up to ${DATA_LIMIT} rows immediately`
                                        : `Download ${totalCasesCount} rows`}
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                    {!showFullDatasetButton && totalCasesCount >= DATA_LIMIT && (
                        <Tooltip
                            title={disabledButtonTooltipText}
                            placement="top"
                        >
                            <span>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    className={classes.downloadButton}
                                    onClick={() =>
                                        downloadDataSet(
                                            'mailDataset',
                                            fileFormat,
                                        )
                                    }
                                    disabled={
                                        isLoading || downloadButtonDisabled
                                    }
                                >
                                    Download more than {DATA_LIMIT} rows through
                                    link delivered by email
                                </Button>
                                <p>
                                    Please add info@global.health to your email
                                    contacts list or check spam so that you
                                    don't miss the download link
                                </p>
                            </span>
                        </Tooltip>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

interface ColumnHeaderProps {
    theClass: string;
    columnTitle: string;
    onClickAction: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const ColumnHeaderTitle: React.FC<ColumnHeaderProps> = ({
    theClass,
    columnTitle,
    onClickAction,
}) => {
    return (
        <div
            className={theClass}
            title="Click to add this filter"
            onClick={onClickAction}
        >
            {columnTitle}
        </div>
    );
};

class LinelistTable extends React.Component<Props, LinelistTableState> {
    maxDeletionThreshold = 10000;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tableRef: RefObject<any> = React.createRef();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formRef: RefObject<any> = React.createRef();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    unlisten: () => void = () => {};

    constructor(props: Props) {
        super(props);
        this.state = {
            url: '/api/cases/',
            error: '',
            page: this.props.page ?? 0,
            pageSize: this.props.pageSize ?? 50,
            selectedRowsCurrentPage: [],
            numSelectedRows: 0,
            totalNumRows: 0,
            deleteDialogOpen: false,
            excludeDialogOpen: false,
            includeDialogOpen: false,
            isLoading: false,
            isDeleting: false,
            selectedVerificationStatus: VerificationStatus.Unverified,
            searchQuery:
                encodeURIComponent(
                    URLToSearchQuery(this.props.location.search),
                ) ?? '',
        };
        this.deleteCases = this.deleteCases.bind(this);
        this.setCaseVerification = this.setCaseVerification.bind(this);
        this.confirmationDialogTitle = this.confirmationDialogTitle.bind(this);
        this.confirmationDialogBody = this.confirmationDialogBody.bind(this);
        this.showConfirmationDialogError =
            this.showConfirmationDialogError.bind(this);
        this.changeVerificationStatus =
            this.changeVerificationStatus.bind(this);
        this.getExcludedCaseIds = this.getExcludedCaseIds.bind(this);
        this.handleSortByChange = this.handleSortByChange.bind(this);
        this.handleSortByOrderChange = this.handleSortByOrderChange.bind(this);
    }

    componentDidMount() {
        localStorage.setItem('searchQuery', '');
    }

    componentDidUpdate(
        prevProps: Readonly<Props>,
        prevState: Readonly<LinelistTableState>,
    ): void {
        if (this.props.location.search !== prevProps.location.search) {
            this.setState(
                {
                    page: 0,
                    searchQuery: encodeURIComponent(
                        URLToSearchQuery(this.props.location.search),
                    ),
                },
                this.tableRef.current?.onQueryChange(),
            );
        }
    }
    componentWillUnmount(): void {
        this.unlisten();
    }

    handleSortByChange(sortBy: SortBy): void {
        this.props.setSortBy(sortBy);
        this.tableRef.current?.onQueryChange();
    }

    handleSortByOrderChange(sortByOrder: SortByOrder): void {
        this.props.setSortByOrder(sortByOrder);
        this.tableRef.current?.onQueryChange();
    }

    async deleteCases(): Promise<void> {
        this.setState({ error: '', isDeleting: true });
        let requestBody;
        if (this.hasSelectedRowsAcrossPages()) {
            requestBody = {
                data: { query: decodeURIComponent(this.state.searchQuery) },
            };
        } else {
            requestBody = {
                data: {
                    caseIds: this.state.selectedRowsCurrentPage.map(
                        (row: TableRow) => row.id,
                    ),
                },
            };
        }
        try {
            await axios.delete('/api/cases', requestBody);
            this.tableRef.current.onQueryChange();
        } catch (e) {
            this.setState({ error: e.toString() });
        } finally {
            this.setState({ deleteDialogOpen: false, isDeleting: false });
        }
    }
    hasSelectedRowsAcrossPages(): boolean {
        return (
            this.state.totalNumRows === this.state.numSelectedRows &&
            this.state.numSelectedRows > this.state.pageSize
        );
    }
    async setCaseVerification(
        rowData: TableRow[],
        verificationStatus: VerificationStatus,
        note?: string,
    ): Promise<void> {
        this.setState({ error: '', isLoading: true });
        const payload = {
            status: verificationStatus,
            ...(note ? { note } : {}),
            ...(this.hasSelectedRowsAcrossPages()
                ? { query: decodeURIComponent(this.state.searchQuery) }
                : { caseIds: rowData.map((row: TableRow) => row.id) }),
        };

        try {
            await axios.post(`/api/cases/batchStatusChange`, payload);

            this.tableRef.current.onQueryChange();
        } catch (e) {
            this.setState({ error: e.toString(), isLoading: false });
        } finally {
            verificationStatus === VerificationStatus.Excluded
                ? this.setState({ excludeDialogOpen: false, isLoading: false })
                : this.setState({ includeDialogOpen: false, isLoading: false });
        }
    }

    confirmationDialogTitle(): string {
        if (this.showConfirmationDialogError()) {
            return 'Error';
        }
        return (
            'Are you sure you want to delete ' +
            (this.state.numSelectedRows === 1
                ? '1 case'
                : `${this.state.numSelectedRows} cases`) +
            '?'
        );
    }

    confirmationDialogBody(): string {
        if (this.showConfirmationDialogError()) {
            return (
                `${this.state.numSelectedRows} cases selected to delete which is greater than the allowed maximum of ${this.maxDeletionThreshold}.` +
                ' An admin can perform the deletion if it is valid.'
            );
        }
        return (
            (this.state.numSelectedRows === 1
                ? '1 case'
                : `${this.state.numSelectedRows} cases`) +
            ' will be permanently deleted.'
        );
    }

    showConfirmationDialogError(): boolean {
        return (
            !this.props.user.roles.includes('admin') &&
            this.state.numSelectedRows > this.maxDeletionThreshold
        );
    }

    async changeVerificationStatus(
        rows: TableRow[],
        status: VerificationStatus,
    ): Promise<void> {
        const excludedCases = this.getExcludedCaseIds(rows);

        if (excludedCases.length) {
            this.setState({
                selectedVerificationStatus: status,
                includeDialogOpen: true,
            });

            return;
        }

        await this.setCaseVerification(rows, status);
    }

    getExcludedCaseIds(rows: TableRow[]): string[] {
        return rows
            .filter(
                ({ verificationStatus }) =>
                    verificationStatus === VerificationStatus.Excluded,
            )
            .map(({ id }) => id);
    }

    handleAddFilterClick(e: React.MouseEvent<HTMLDivElement>, filter: string) {
        e.preventDefault();

        this.props.setFiltersModalOpen(true);
        this.props.setActiveFilterInput(filter);
    }

    render(): JSX.Element {
        const { history, classes } = this.props;

        return (
            <>
                {this.state.error && (
                    <MuiAlert
                        classes={{ root: classes.alert }}
                        variant="outlined"
                        severity="error"
                    >
                        {this.state.error}
                    </MuiAlert>
                )}
                {!this.props.location.state?.bulkMessage &&
                    this.props.location.state?.newCaseIds &&
                    this.props.location.state?.newCaseIds.length > 0 &&
                    (this.props.location.state.newCaseIds.length === 1 ? (
                        <MuiAlert
                            classes={{
                                root: classes.alert,
                            }}
                            variant="standard"
                            action={
                                <Link
                                    to={`/cases/view/${this.props.location.state.newCaseIds}`}
                                >
                                    <Button
                                        color="primary"
                                        size="small"
                                        data-testid="view-case-btn"
                                    >
                                        VIEW
                                    </Button>
                                </Link>
                            }
                        >
                            {`Case ${this.props.location.state.newCaseIds} added`}
                        </MuiAlert>
                    ) : (
                        <MuiAlert
                            classes={{ root: classes.alert }}
                            variant="standard"
                        >
                            {`${this.props.location.state.newCaseIds.length} cases added`}
                        </MuiAlert>
                    ))}
                {!this.props.location.state?.bulkMessage &&
                    (this.props.location.state?.editedCaseIds?.length ?? 0) >
                        0 && (
                        <MuiAlert
                            variant="standard"
                            classes={{ root: classes.alert }}
                            action={
                                <Link
                                    to={`/cases/view/${this.props.location.state.editedCaseIds}`}
                                >
                                    <Button color="primary" size="small">
                                        VIEW
                                    </Button>
                                </Link>
                            }
                        >
                            {`Case ${this.props.location.state.editedCaseIds} edited`}
                        </MuiAlert>
                    )}
                {this.props.location.state?.bulkMessage && (
                    <MuiAlert
                        classes={{ root: classes.alert }}
                        variant="standard"
                    >
                        {this.props.location.state.bulkMessage}
                    </MuiAlert>
                )}
                <CaseExcludeDialog
                    isOpen={this.state.excludeDialogOpen}
                    onClose={(): void =>
                        this.setState({ excludeDialogOpen: false })
                    }
                    onSubmit={(values: { note: string }): Promise<void> =>
                        this.setCaseVerification(
                            this.state.selectedRowsCurrentPage,
                            VerificationStatus.Excluded,
                            values.note,
                        )
                    }
                    caseIds={this.state.selectedRowsCurrentPage.map(
                        ({ id }) => id,
                    )}
                />
                <CaseIncludeDialog
                    isOpen={this.state.includeDialogOpen}
                    onClose={(): void =>
                        this.setState({ includeDialogOpen: false })
                    }
                    onSubmit={(): Promise<void> =>
                        this.setCaseVerification(
                            this.state.selectedRowsCurrentPage,
                            this.state.selectedVerificationStatus,
                        )
                    }
                    caseIds={this.getExcludedCaseIds(
                        this.state.selectedRowsCurrentPage,
                    )}
                />
                <Dialog
                    open={this.state.deleteDialogOpen}
                    onClose={(): void =>
                        this.setState({ deleteDialogOpen: false })
                    }
                    // Stops the click being propagated to the table which
                    // would trigger the onRowClick action.
                    onClick={(e): void => e.stopPropagation()}
                >
                    <DialogTitle>{this.confirmationDialogTitle()}</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {this.confirmationDialogBody()}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        {this.state.isDeleting ? (
                            <CircularProgress
                                classes={{ root: classes.dialogLoadingSpinner }}
                            />
                        ) : (
                            <>
                                <Button
                                    onClick={(): void => {
                                        this.setState({
                                            deleteDialogOpen: false,
                                        });
                                    }}
                                    color="primary"
                                    autoFocus
                                >
                                    Cancel
                                </Button>
                                {!this.showConfirmationDialogError() && (
                                    <Button
                                        onClick={this.deleteCases}
                                        color="primary"
                                    >
                                        Yes
                                    </Button>
                                )}
                            </>
                        )}
                    </DialogActions>
                </Dialog>
                <MaterialTable
                    tableRef={this.tableRef}
                    columns={[
                        ...(this.props.user.roles.includes('curator')
                            ? [
                                  // TODO: move to the left of selection checkboxes when possible
                                  // https://github.com/mbrn/material-table/issues/2317
                                  {
                                      cellStyle: {
                                          padding: '0',
                                      },
                                      render: (
                                          rowData: TableRow,
                                      ): JSX.Element => (
                                          <RowMenu
                                              rowId={rowData.id}
                                              rowData={rowData}
                                              refreshData={(): void =>
                                                  this.tableRef.current.onQueryChange()
                                              }
                                              setError={(error): void =>
                                                  this.setState({
                                                      error: error,
                                                  })
                                              }
                                          ></RowMenu>
                                      ),
                                  },
                              ]
                            : []),
                        {
                            cellStyle: {
                                padding: '0',
                            },
                            headerStyle: {
                                padding: '0',
                            },
                            title: (
                                <div className={classes.centeredContent}>
                                    <VerificationStatusHeader
                                        onClickAction={(
                                            e: React.MouseEvent<HTMLDivElement>,
                                        ) =>
                                            this.handleAddFilterClick(
                                                e,
                                                'verificationstatus',
                                            )
                                        }
                                    />
                                </div>
                            ),
                            field: 'verificationStatus',
                            // The return type in the material-table dts is any.
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            render: (rowData): any => {
                                return (
                                    <div className={classes.centeredContent}>
                                        <VerificationStatusIndicator
                                            status={rowData.verificationStatus}
                                            exclusionData={
                                                rowData.exclusionData
                                            }
                                        />
                                    </div>
                                );
                            },
                        },
                        {
                            title: (
                                <ColumnHeaderTitle
                                    theClass={classes.centeredContent}
                                    columnTitle="Case ID"
                                    onClickAction={(
                                        e: React.MouseEvent<HTMLDivElement>,
                                    ) => this.handleAddFilterClick(e, 'caseid')}
                                />
                            ),
                            field: 'id',
                            type: 'string',
                        },
                        {
                            title: (
                                <ColumnHeaderTitle
                                    theClass={classes.centeredContent}
                                    columnTitle="Confirmed date"
                                    onClickAction={(
                                        e: React.MouseEvent<HTMLDivElement>,
                                    ) =>
                                        this.handleAddFilterClick(
                                            e,
                                            'dateconfirmedafter',
                                        )
                                    }
                                />
                            ),
                            field: 'confirmedDate',
                            render: (rowData): string =>
                                renderDate(rowData.confirmedDate),
                            cellStyle: { whiteSpace: 'nowrap' },
                        },
                        {
                            title: (
                                <ColumnHeaderTitle
                                    theClass={classes.centeredContent}
                                    columnTitle="Admin 3"
                                    onClickAction={(
                                        e: React.MouseEvent<HTMLDivElement>,
                                    ) => this.handleAddFilterClick(e, 'admin3')}
                                />
                            ),
                            field: 'adminArea3',
                        },
                        {
                            title: (
                                <ColumnHeaderTitle
                                    theClass={classes.centeredContent}
                                    columnTitle="Admin 2"
                                    onClickAction={(
                                        e: React.MouseEvent<HTMLDivElement>,
                                    ) => this.handleAddFilterClick(e, 'admin2')}
                                />
                            ),
                            field: 'adminArea2',
                        },
                        {
                            title: (
                                <ColumnHeaderTitle
                                    theClass={classes.centeredContent}
                                    columnTitle="Admin 1"
                                    onClickAction={(
                                        e: React.MouseEvent<HTMLDivElement>,
                                    ) => this.handleAddFilterClick(e, 'admin1')}
                                />
                            ),
                            field: 'adminArea1',
                        },
                        {
                            title: (
                                <ColumnHeaderTitle
                                    theClass={classes.centeredContent}
                                    columnTitle="Country"
                                    onClickAction={(
                                        e: React.MouseEvent<HTMLDivElement>,
                                    ) =>
                                        this.handleAddFilterClick(e, 'country')
                                    }
                                />
                            ),

                            field: 'country',
                        },
                        {
                            title: 'Latitude',
                            field: 'latitude',
                        },
                        {
                            title: 'Longitude',
                            field: 'longitude',
                        },
                        {
                            title: (
                                <ColumnHeaderTitle
                                    theClass={classes.centeredContent}
                                    columnTitle="Nationality"
                                    onClickAction={(
                                        e: React.MouseEvent<HTMLDivElement>,
                                    ) =>
                                        this.handleAddFilterClick(
                                            e,
                                            'nationality',
                                        )
                                    }
                                />
                            ),

                            field: 'nationalities',
                        },
                        {
                            title: 'Age',
                            field: 'age',
                            render: (rowData) =>
                                rowData.age[0] === rowData.age[1]
                                    ? rowData.age[0]
                                    : `${rowData.age[0]}-${rowData.age[1]}`,
                            cellStyle: { whiteSpace: 'nowrap' },
                        },
                        {
                            title: (
                                <ColumnHeaderTitle
                                    theClass={classes.centeredContent}
                                    columnTitle="Gender"
                                    onClickAction={(
                                        e: React.MouseEvent<HTMLDivElement>,
                                    ) => this.handleAddFilterClick(e, 'gender')}
                                />
                            ),
                            field: 'gender',
                            render: (rowData) => rowData.gender,
                        },
                        {
                            title: (
                                <ColumnHeaderTitle
                                    theClass={classes.centeredContent}
                                    columnTitle="Outcome"
                                    onClickAction={(
                                        e: React.MouseEvent<HTMLDivElement>,
                                    ) =>
                                        this.handleAddFilterClick(e, 'outcome')
                                    }
                                />
                            ),
                            field: 'outcome',
                            render: (rowData) => rowData.outcome,
                        },
                        {
                            title: 'Hospitalization date/period',
                            field: 'hospitalizationDateRange',
                        },
                        {
                            title: 'Symptoms onset date',
                            field: 'symptomsOnsetDate',
                        },
                        {
                            title: (
                                <ColumnHeaderTitle
                                    theClass={classes.centeredContent}
                                    columnTitle="Source URL"
                                    onClickAction={(
                                        e: React.MouseEvent<HTMLDivElement>,
                                    ) =>
                                        this.handleAddFilterClick(
                                            e,
                                            'sourceurl',
                                        )
                                    }
                                />
                            ),
                            field: 'sourceUrl',
                            render: (rowData) => rowData.sourceUrl,
                        },
                    ]}
                    isLoading={this.state.isLoading}
                    data={(query): Promise<QueryResult<TableRow>> =>
                        new Promise((resolve, reject) => {
                            let listUrl = this.state.url;
                            listUrl += '?limit=' + query.pageSize;
                            listUrl += '&page=' + (this.state.page + 1);
                            // Limit the maximum number of documents that are being counted in mongoDB in order to make queries faster
                            listUrl += `&count_limit=${DATA_LIMIT}`;
                            listUrl += '&sort_by=' + this.props.sortBy;
                            listUrl += '&order=' + this.props.sortByOrder;
                            if (this.state.searchQuery !== '') {
                                listUrl += '&q=' + this.state.searchQuery;
                            }
                            this.setState({ isLoading: true, error: '' });
                            const response = axios.get<ListResponse>(listUrl);

                            response
                                .then((result) => {
                                    const flattenedCases: TableRow[] = [];
                                    const cases = result.data.cases;
                                    const nationalitiesRender = (
                                        nationalities: string[],
                                    ): string | undefined => {
                                        if (nationalities) {
                                            nationalities.sort();
                                            const nationalitiesString =
                                                nationalities.join(', ');
                                            return nationalitiesString;
                                        } else {
                                            return undefined;
                                        }
                                    };
                                    for (const c of cases) {
                                        nationalitiesRender(
                                            c.demographics?.nationalities,
                                        );

                                        const confirmedEvent = c.events.find(
                                            (event) =>
                                                event.name === 'confirmed',
                                        );
                                        flattenedCases.push({
                                            id: c._id,
                                            confirmedDate: confirmedEvent
                                                ?.dateRange?.start
                                                ? new Date(
                                                      confirmedEvent.dateRange.start,
                                                  )
                                                : null,
                                            adminArea3:
                                                c.location
                                                    ?.administrativeAreaLevel3,
                                            adminArea2:
                                                c.location
                                                    ?.administrativeAreaLevel2,
                                            adminArea1:
                                                c.location
                                                    ?.administrativeAreaLevel1,
                                            country: c.location.country,
                                            latitude: round(
                                                c.location?.geometry?.latitude,
                                                4,
                                            ),
                                            longitude: round(
                                                c.location?.geometry?.longitude,
                                                4,
                                            ),
                                            age: [
                                                c.demographics?.ageRange?.start,
                                                c.demographics?.ageRange?.end,
                                            ],
                                            gender: c.demographics?.gender,
                                            nationalities: nationalitiesRender(
                                                c.demographics?.nationalities,
                                            ),
                                            outcome: c.events.find(
                                                (event) =>
                                                    event.name === 'outcome',
                                            )?.value,
                                            hospitalizationDateRange:
                                                renderDateRange(
                                                    c.events.find(
                                                        (event) =>
                                                            event.name ===
                                                            'hospitalAdmission',
                                                    )?.dateRange,
                                                ),
                                            symptomsOnsetDate: renderDateRange(
                                                c.events.find(
                                                    (event) =>
                                                        event.name ===
                                                        'onsetSymptoms',
                                                )?.dateRange,
                                            ),
                                            sourceUrl:
                                                c.caseReference?.sourceUrl,
                                            verificationStatus:
                                                c.caseReference
                                                    ?.verificationStatus,
                                        });
                                    }
                                    this.props.setTotalDataCount(
                                        result.data.total,
                                    );
                                    this.setState({
                                        totalNumRows: result.data.total,
                                        selectedRowsCurrentPage: [],
                                        numSelectedRows: 0,
                                    });
                                    resolve({
                                        data: flattenedCases,
                                        page: this.state.page,
                                        totalCount: result.data.total,
                                    });
                                })
                                .catch((e) => {
                                    this.setState({
                                        error:
                                            e.response?.data?.message ||
                                            e.toString(),
                                    });
                                    reject(e);
                                })
                                .finally(() => {
                                    this.setState({ isLoading: false });
                                });
                        })
                    }
                    components={{
                        Container: (props): JSX.Element => (
                            <Paper elevation={0} {...props}></Paper>
                        ),
                        Pagination: (props): JSX.Element => {
                            return this.state.numSelectedRows === 0 ? (
                                <div className={classes.tablePaginationBar}>
                                    <Typography className={classes.tableTitle}>
                                        COVID-19 Linelist
                                    </Typography>

                                    <SortSelect
                                        sortBy={this.props.sortBy}
                                        sortByOrder={this.props.sortByOrder}
                                        handleSortByChange={
                                            this.handleSortByChange
                                        }
                                        handleSortByOrderChange={
                                            this.handleSortByOrderChange
                                        }
                                    />

                                    {this.props.filterBreadcrumbs.length >
                                        0 && (
                                        <Chip
                                            label="Filters"
                                            color="primary"
                                            onClick={() =>
                                                this.props.setFiltersModalOpen(
                                                    true,
                                                )
                                            }
                                            className={classes.breadcrumbChip}
                                        />
                                    )}
                                    {this.props.filterBreadcrumbs.map(
                                        (breadcrumb) => (
                                            <Chip
                                                key={breadcrumb.key}
                                                label={`${breadcrumb.key} - ${breadcrumb.value}`}
                                                onDelete={() =>
                                                    this.props.handleBreadcrumbDelete(
                                                        breadcrumb,
                                                    )
                                                }
                                                onClick={() => {
                                                    this.props.setFiltersModalOpen(
                                                        true,
                                                    );
                                                    this.props.setActiveFilterInput(
                                                        breadcrumb.key,
                                                    );
                                                }}
                                                className={
                                                    classes.breadcrumbChip
                                                }
                                            />
                                        ),
                                    )}

                                    <TablePagination
                                        {...props}
                                        onChangeRowsPerPage={(event): void => {
                                            const newPage = 0;
                                            const newPageSize = Number(
                                                event.target.value,
                                            );

                                            this.setState({
                                                page: newPage,
                                                pageSize: newPageSize,
                                            });

                                            props.onChangeRowsPerPage(event);

                                            this.props.onChangePage(newPage);
                                            this.props.onChangePageSize(
                                                newPageSize,
                                            );
                                        }}
                                        onChangePage={(
                                            event,
                                            newPage: number,
                                        ): void => {
                                            this.setState({
                                                page: newPage,
                                            });

                                            this.props.onChangePage(newPage);
                                            props.onChangePage(event, newPage);
                                        }}
                                    />
                                </div>
                            ) : (
                                <></>
                            );
                        },
                        Toolbar: (props): JSX.Element => (
                            <MTableToolbar
                                {...props}
                                classes={{
                                    highlight: classes.tableToolbar,
                                    title: classes.toolbarItems,
                                }}
                                toolbarButtonAlignment="left"
                            />
                        ),
                    }}
                    onSelectionChange={(rows): void =>
                        this.setState({
                            selectedRowsCurrentPage: rows,
                            numSelectedRows: rows.length,
                        })
                    }
                    localization={{
                        pagination: {
                            labelDisplayedRows:
                                // this value has to correspond to count_limit param in /api/cases query
                                this.state.totalNumRows === DATA_LIMIT
                                    ? '{from}-{to} of many'
                                    : '{from}-{to} of {count}',
                        },
                        toolbar: {
                            nRowsSelected:
                                this.state.numSelectedRows === 1
                                    ? '1 row selected'
                                    : `${this.state.numSelectedRows} rows selected`,
                        },
                    }}
                    style={{ fontFamily: 'Inter' }}
                    options={{
                        search: false,
                        emptyRowsWhenPaging: false,
                        filtering: false,
                        sorting: false, // Would be nice but has to wait on indexes to properly query the DB.
                        padding: 'dense',
                        draggable: false, // No need to be able to drag and drop headers.
                        selection:
                            this.props.user.roles.includes('curator') ||
                            this.props.user.roles.includes('admin'),
                        pageSize: this.state.pageSize,
                        pageSizeOptions: [5, 10, 20, 50, 100],
                        paginationPosition: 'top',
                        toolbar: this.state.numSelectedRows > 0,
                        maxBodyHeight: 'calc(100vh - 20em)',
                        headerStyle: {
                            zIndex: 1,
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap',
                        },
                        // TODO: style highlighted rows to spec
                        rowStyle: (rowData) => {
                            const isHighlighted =
                                (
                                    this.props.location.state?.newCaseIds ?? []
                                ).includes(rowData.id) ||
                                (
                                    this.props.location.state?.editedCaseIds ??
                                    []
                                ).includes(rowData.id);

                            const isExcluded =
                                rowData.verificationStatus ===
                                VerificationStatus.Excluded;

                            return {
                                ...(isHighlighted
                                    ? { backgroundColor: '#F0FBF9' }
                                    : {}),
                                opacity: isExcluded ? 0.6 : 1,
                            };
                        },
                    }}
                    onRowClick={(_, rowData?: TableRow): void => {
                        if (rowData) {
                            history.push(`/cases/view/${rowData.id}`);
                        }
                    }}
                    actions={
                        this.props.user.roles.includes('curator') ||
                        this.props.user.roles.includes('admin')
                            ? [
                                  // Only allow selecting rows across pages if
                                  // there is a search query.
                                  ...(this.state.searchQuery !== ''
                                      ? [
                                            {
                                                icon: (): JSX.Element => (
                                                    <Button
                                                        classes={{
                                                            root: classes.toolbarItems,
                                                        }}
                                                    >
                                                        {this.state
                                                            .totalNumRows ===
                                                        this.state
                                                            .numSelectedRows
                                                            ? 'Unselect'
                                                            : 'Select'}{' '}
                                                        all{' '}
                                                        {
                                                            this.state
                                                                .totalNumRows
                                                        }{' '}
                                                        rows
                                                    </Button>
                                                ),
                                                tooltip: `
                                      ${
                                          this.state.totalNumRows ===
                                          this.state.numSelectedRows
                                              ? 'Unselect'
                                              : 'Select'
                                      } all rows across pages`,
                                                onClick: async (
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                    _: any,
                                                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                    rows: any,
                                                ): Promise<void> => {
                                                    const shouldSelectAll =
                                                        this.state
                                                            .totalNumRows !==
                                                        this.state
                                                            .numSelectedRows;

                                                    await this.tableRef.current.onAllSelected(
                                                        shouldSelectAll,
                                                    );
                                                    this.setState({
                                                        numSelectedRows:
                                                            shouldSelectAll
                                                                ? this.state
                                                                      .totalNumRows
                                                                : 0,
                                                    });
                                                },
                                            },
                                        ]
                                      : []),
                                  {
                                      icon: (): JSX.Element => (
                                          <VerifiedIcon data-testid="verify-action" />
                                      ),
                                      hidden: !this.props.user.roles.includes(
                                          'curator',
                                      ),
                                      tooltip: 'Verify selected rows',
                                      onClick: async (
                                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                          _: any,
                                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                          rows: any,
                                      ): Promise<void> => {
                                          this.changeVerificationStatus(
                                              rows,
                                              VerificationStatus.Verified,
                                          );
                                      },
                                  },
                                  {
                                      icon: (): JSX.Element => (
                                          <UnverifiedIcon data-testid="unverify-action" />
                                      ),
                                      hidden: !this.props.user.roles.includes(
                                          'curator',
                                      ),
                                      tooltip: 'Unverify selected rows',
                                      onClick: async (
                                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                          _: any,
                                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                          rows: any,
                                      ): Promise<void> => {
                                          this.changeVerificationStatus(
                                              rows,
                                              VerificationStatus.Unverified,
                                          );
                                      },
                                  },
                                  {
                                      icon: (): JSX.Element => (
                                          <ExcludedIcon data-testid="exclude-action" />
                                      ),
                                      hidden: !this.props.user.roles.includes(
                                          'curator',
                                      ),
                                      tooltip: 'Exclude selected rows',
                                      onClick: async (): Promise<void> => {
                                          this.setState({
                                              excludeDialogOpen: true,
                                          });
                                      },
                                  },
                                  {
                                      icon: (): JSX.Element => (
                                          <span aria-label="download selected rows">
                                              <form
                                                  hidden
                                                  ref={this.formRef}
                                                  method="POST"
                                                  action="/api/cases/download"
                                              >
                                                  {this.state.selectedRowsCurrentPage.map(
                                                      (row: TableRow) => (
                                                          <input
                                                              name="caseIds[]"
                                                              key={row.id}
                                                              value={row.id}
                                                          />
                                                      ),
                                                  )}
                                              </form>
                                              <SaveAltIcon
                                                  classes={{
                                                      root: classes.toolbarItems,
                                                  }}
                                              />
                                          </span>
                                      ),
                                      tooltip: 'Download selected rows',
                                      onClick: (): void => {
                                          this.formRef.current.submit();
                                      },
                                  },
                                  // This action is for deleting selected rows.
                                  // The action for deleting single rows is in the
                                  // RowMenu function.
                                  {
                                      icon: (): JSX.Element => (
                                          <span aria-label="delete all">
                                              <DeleteIcon
                                                  classes={{
                                                      root: classes.toolbarItems,
                                                  }}
                                              />
                                          </span>
                                      ),
                                      tooltip: 'Delete selected rows',
                                      onClick: (): void => {
                                          this.setState({
                                              deleteDialogOpen: true,
                                          });
                                      },
                                  },
                              ]
                            : []
                    }
                />
            </>
        );
    }
}

export default connector(withRouter(withStyles(styles)(LinelistTable)));
