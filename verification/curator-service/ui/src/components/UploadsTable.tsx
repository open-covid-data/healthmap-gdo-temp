import MaterialTable, { QueryResult } from 'material-table';
import { Paper, TablePagination, Typography } from '@material-ui/core';
import React, { RefObject } from 'react';
import {
    Theme,
    WithStyles,
    createStyles,
    withStyles,
} from '@material-ui/core/styles';

import { Link } from 'react-router-dom';
import MuiAlert from '@material-ui/lab/Alert';
import axios from 'axios';
import renderDate from './util/date';

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const styles = (theme: Theme) =>
    createStyles({
        alert: {
            borderRadius: theme.spacing(1),
            marginTop: theme.spacing(2),
        },
        spacer: { flex: 1 },
        tablePaginationBar: {
            alignItems: 'center',
            backgroundColor: theme.palette.background.default,
            display: 'flex',
            height: '64px',
        },
    });

type Props = WithStyles<typeof styles>;

interface UploadsTableState {
    url: string;
    error: string;
    pageSize: number;
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

interface UploadData {
    sourceName: string;
    sourceUrl: string;
    upload: Upload;
}

interface ListUploadsResponse {
    uploads: UploadData[];
    nextPage: number;
    total: number;
}

interface TableRow {
    id: string;
    status: string;
    created: Date;
    sourceUrl: string;
    sourceName: string;
    numCreated: number;
    numUpdated: number;
}

class UploadsTable extends React.Component<Props, UploadsTableState> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tableRef: RefObject<any> = React.createRef();

    constructor(props: Props) {
        super(props);
        this.state = {
            url: '/api/sources/uploads',
            error: '',
            pageSize: 10,
        };
    }

    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <div>
                <Paper>
                    {this.state.error && (
                        <MuiAlert
                            classes={{ root: classes.alert }}
                            variant="filled"
                            severity="error"
                        >
                            {this.state.error}
                        </MuiAlert>
                    )}
                    <MaterialTable
                        tableRef={this.tableRef}
                        columns={[
                            {
                                title: 'ID',
                                field: 'id',
                            },
                            {
                                title: 'Status',
                                field: 'status',
                            },
                            {
                                title: 'Created',
                                field: 'created',
                                render: (rowData): string =>
                                    renderDate(rowData.created),
                            },
                            {
                                title: '# created cases',
                                field: 'numCreated',
                                render: (rowData): JSX.Element => (
                                    <Link
                                        to={{
                                            pathname: '/cases',
                                            search: `?uploadid=${rowData.id}`,
                                        }}
                                    >
                                        {rowData.numCreated}
                                    </Link>
                                ),
                            },
                            {
                                title: '# updated cases',
                                field: 'numUpdated',
                                render: (rowData): JSX.Element => (
                                    <Link
                                        to={{
                                            pathname: '/cases',
                                            search: `?uploadid=${rowData.id}`,
                                        }}
                                    >
                                        {rowData.numUpdated}
                                    </Link>
                                ),
                            },
                            {
                                title: 'Source name',
                                field: 'sourceName',
                            },
                            {
                                title: 'Source URL',
                                field: 'sourceUrl',
                            },
                        ]}
                        data={(query): Promise<QueryResult<TableRow>> =>
                            new Promise((resolve, reject) => {
                                let listUrl = this.state.url;
                                listUrl += '?limit=' + this.state.pageSize;
                                listUrl += '&page=' + (query.page + 1);
                                listUrl += '&changes_only=false';
                                this.setState({ error: '' });
                                const response =
                                    axios.get<ListUploadsResponse>(listUrl);
                                response
                                    .then((result) => {
                                        const flattenedSources =
                                            result.data.uploads.map((u) => {
                                                return {
                                                    id: u.upload._id,
                                                    created: u.upload.created,
                                                    status: u.upload.status,
                                                    sourceUrl: u.sourceUrl,
                                                    sourceName: u.sourceName,
                                                    numCreated:
                                                        u.upload.summary
                                                            .numCreated ?? 0,
                                                    numUpdated:
                                                        u.upload.summary
                                                            .numUpdated ?? 0,
                                                };
                                            });
                                        resolve({
                                            data: flattenedSources,
                                            page: query.page,
                                            totalCount: result.data.total ?? 0,
                                        });
                                    })
                                    .catch((e) => {
                                        this.setState({
                                            error:
                                                e.response?.data?.message ||
                                                e.toString(),
                                        });
                                        reject(e);
                                    });
                            })
                        }
                        components={{
                            Container: (props): JSX.Element => (
                                <Paper elevation={0} {...props}></Paper>
                            ),
                            Pagination: (props): JSX.Element => {
                                return (
                                    <div className={classes.tablePaginationBar}>
                                        <Typography>Uploads</Typography>
                                        <span className={classes.spacer}></span>
                                        <TablePagination
                                            {...props}
                                        ></TablePagination>
                                    </div>
                                );
                            },
                        }}
                        style={{ fontFamily: 'Inter' }}
                        options={{
                            // TODO: Create text indexes and support search queries.
                            // https://docs.mongodb.com/manual/text-search/
                            search: false,
                            filtering: false,
                            sorting: false,
                            emptyRowsWhenPaging: false,
                            padding: 'dense',
                            draggable: false, // No need to be able to drag and drop headers.
                            pageSize: this.state.pageSize,
                            pageSizeOptions: [5, 10, 20, 50, 100],
                            paginationPosition: 'top',
                            toolbar: false,
                            maxBodyHeight: 'calc(100vh - 15em)',
                            headerStyle: {
                                zIndex: 1,
                            },
                        }}
                        onChangeRowsPerPage={(newPageSize: number): void => {
                            this.setState({ pageSize: newPageSize });
                            this.tableRef.current.onQueryChange();
                        }}
                    />
                </Paper>
            </div>
        );
    }
}

export default withStyles(styles, { withTheme: true })(UploadsTable);
