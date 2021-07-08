import MaterialTable, { QueryResult } from 'material-table';
import { Avatar, Paper, TablePagination, Typography } from '@material-ui/core';
import React, { RefObject } from 'react';
import {
    Theme,
    WithStyles,
    createStyles,
    withStyles,
} from '@material-ui/core/styles';

import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';
import MuiAlert from '@material-ui/lab/Alert';
import Select from '@material-ui/core/Select';
import User from './User';
import axios from 'axios';

interface ListResponse {
    users: User[];
    nextPage: number;
    total: number;
}

interface UsersState {
    availableRoles: string[];
    url: string;
    error: string;
    pageSize: number;
}

interface TableRow {
    id: string;
    picture: string;
    name: string;
    email: string;
    roles: string[];
}

interface Props extends WithStyles<typeof styles> {
    user: User;
    onUserChange: () => void;
}

interface UsersSelectDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
    'data-testid'?: string;
}

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

class Users extends React.Component<Props, UsersState> {
    // We could use a proper type here but then we wouldn't be able to call
    // onQueryChange() to refresh the table as we want.
    // https://github.com/mbrn/material-table/issues/1752
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tableRef: RefObject<any> = React.createRef();
    constructor(props: Props) {
        super(props);
        this.state = {
            availableRoles: [],
            url: '/api/users/',
            error: '',
            pageSize: 10,
        };
    }

    componentDidMount(): void {
        axios
            .get(this.state.url + 'roles')
            .then((resp) => {
                this.setState({ availableRoles: resp.data.roles });
            })
            .catch((e) => {
                this.setState({ availableRoles: [] });
                console.error(e);
            });
    }

    render(): JSX.Element {
        const { classes } = this.props;
        return (
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
                            title: 'id',
                            field: 'id',
                            hidden: true,
                        },
                        {
                            title: 'Picture',
                            field: 'picture',
                            editable: 'never',
                            render: (rowData): JSX.Element => (
                                <Avatar src={rowData.picture} alt="avatar" />
                            ),
                            width: '3em',
                        },
                        {
                            title: 'Name',
                            field: 'name',
                            type: 'string',
                        },
                        {
                            title: 'Email',
                            field: 'email',
                            type: 'string',
                        },
                        {
                            title: 'Roles',
                            field: 'roles',
                            type: 'string',
                            render: (rowData): JSX.Element =>
                                this.rolesFormControl(rowData),
                        },
                    ]}
                    data={(query): Promise<QueryResult<TableRow>> =>
                        new Promise((resolve, reject) => {
                            let listUrl = this.state.url;
                            listUrl += '?limit=' + this.state.pageSize;
                            listUrl += '&page=' + (query.page + 1);
                            this.setState({ error: '' });
                            const response = axios.get<ListResponse>(listUrl);
                            response
                                .then((result) => {
                                    const flattenedUsers: TableRow[] = [];
                                    for (const c of result.data.users) {
                                        flattenedUsers.push({
                                            id: c._id,
                                            name: c.name || 'Name not provided',
                                            email: c.email,
                                            roles: c.roles,
                                            picture: c.picture || '',
                                        });
                                    }
                                    resolve({
                                        data: flattenedUsers,
                                        page: query.page,
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
                                    <Typography>Users</Typography>
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
                        search: false,
                        filtering: false,
                        sorting: false,
                        padding: 'dense',
                        draggable: false, // No need to be able to drag and drop headers.
                        pageSize: this.state.pageSize,
                        pageSizeOptions: [5, 10, 20, 50, 100],
                        paginationPosition: 'top',
                        toolbar: false,
                        headerStyle: {
                            zIndex: 1,
                        },
                    }}
                    onChangeRowsPerPage={(newPageSize: number) => {
                        this.setState({ pageSize: newPageSize });
                        this.tableRef.current.onQueryChange();
                    }}
                />
            </Paper>
        );
    }

    updateRoles(
        event: React.ChangeEvent<{ value: string[] }>,
        userId: string,
    ): void {
        axios
            .put(this.state.url + userId, {
                roles: event.target.value,
            })
            .then(() => {
                if (userId === this.props.user._id) {
                    this.props.onUserChange();
                }
                if (this.tableRef?.current) {
                    this.tableRef.current.onQueryChange();
                }
            })
            .catch((e) => {
                this.setState({
                    error: e.response?.data?.message || e.toString(),
                });
                console.error(e);
            });
    }

    rolesFormControl(rowData: TableRow): JSX.Element {
        return (
            <FormControl>
                <Select
                    data-testid={`${rowData.name}-select-roles`}
                    SelectDisplayProps={
                        {
                            'data-testid': `${rowData.name}-select-roles-button`,
                        } as UsersSelectDisplayProps
                    }
                    multiple
                    value={rowData.roles}
                    onChange={(event) =>
                        this.updateRoles(
                            event as React.ChangeEvent<{
                                value: string[];
                            }>,
                            rowData.id,
                        )
                    }
                    renderValue={(selected) =>
                        (selected as string[]).sort().join(', ')
                    }
                >
                    {this.state.availableRoles.map((role) => (
                        <MenuItem key={role} value={role}>
                            {role}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        );
    }
}

export default withStyles(styles, { withTheme: true })(Users);
