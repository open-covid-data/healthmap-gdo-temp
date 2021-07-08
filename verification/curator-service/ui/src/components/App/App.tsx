import {
    AppBar,
    Avatar,
    CssBaseline,
    Divider,
    Fab,
    IconButton,
    Menu,
    MenuItem,
    Toolbar,
    Typography,
    useMediaQuery,
} from '@material-ui/core';
import LinelistTable, { DownloadButton } from '../LinelistTable';
import {
    Link,
    Redirect,
    Route,
    Switch,
    useHistory,
    useLocation,
} from 'react-router-dom';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Theme, makeStyles } from '@material-ui/core/styles';

import AddIcon from '@material-ui/icons/Add';
import AutomatedBackfill from '../AutomatedBackfill';
import AutomatedSourceForm from '../AutomatedSourceForm';
import BulkCaseForm from '../BulkCaseForm';
import CaseForm from '../CaseForm';
import Charts from '../Charts';
import Drawer from '@material-ui/core/Drawer';
import EditCase from '../EditCase';
import GHListLogo from '../GHListLogo';
import HomeIcon from '@material-ui/icons/Home';
import LandingPage from '../landing-page/LandingPage';
import LinkIcon from '@material-ui/icons/Link';
import List from '@material-ui/core/List';
import ListIcon from '@material-ui/icons/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import MenuIcon from '@material-ui/icons/Menu';
import PeopleIcon from '@material-ui/icons/People';
import Profile from '../Profile';
import PublishIcon from '@material-ui/icons/Publish';
import SearchBar from '../SearchBar';
import SourceTable from '../SourceTable';
import TermsOfUse from '../TermsOfUse';
import { ThemeProvider } from '@material-ui/core/styles';
import UploadsTable from '../UploadsTable';
import User from '../User';
import Users from '../Users';
import ViewCase from '../ViewCase';
import axios from 'axios';
import clsx from 'clsx';
import { createMuiTheme } from '@material-ui/core/styles';
import { useLastLocation } from 'react-router-last-location';
import PolicyLink from '../PolicyLink';
import { Auth } from 'aws-amplify';
import { useCookieBanner } from '../../hooks/useCookieBanner';
import { SortBy, SortByOrder } from '../../constants/types';
import { URLToSearchQuery } from '../util/searchQuery';
import { useAppDispatch } from '../../hooks/redux';
import {
    setSearchQuery,
    setFilterBreadcrumbs,
    deleteFilterBreadcrumbs,
} from './redux/appSlice';
// import { selectFilterBreadcrumbs} from './redux/selectors';
// import { useSelector } from 'react-redux';

const theme = createMuiTheme({
    palette: {
        background: {
            default: '#ecf3f0',
            paper: '#fff',
        },
        primary: {
            main: '#0E7569',
            contrastText: '#fff',
        },
        secondary: {
            main: '#00C6AF',
            contrastText: '#fff',
        },
        error: {
            main: '#FD685B',
            contrastText: '#454545',
        },
    },
    typography: {
        fontFamily: 'Mabry Pro, sans-serif',
    },
    shape: {
        borderRadius: 4,
    },
    overrides: {
        MuiListItem: {
            root: {
                color: '#5D5D5D',
                borderRadius: '4px',
                '&$selected': {
                    backgroundColor: '#0E75691A',
                    color: '#0E7569',
                },
            },
        },
        MuiAppBar: {
            colorPrimary: {
                backgroundColor: '#ECF3F0',
            },
        },
        MuiCheckbox: {
            colorSecondary: {
                '&$checked': {
                    color: '#31A497',
                },
            },
        },
        MuiTablePagination: {
            root: {
                border: 'unset',
                fontFamily: 'Inter',
                '& .MuiTablePagination-input': {
                    fontFamily: 'Inter',
                },
                '&&& .MuiTypography-root': {
                    fontFamily: 'Inter',
                    fontSize: '14px',
                },
            },
        },
    },
    custom: {
        palette: {
            button: {
                buttonCaption: '#ECF3F0',
                customizeButtonColor: '#ECF3F0',
            },
            tooltip: {
                backgroundColor: '#FEEFC3',
                textColor: 'rgba(0, 0, 0, 0.87)',
            },
            appBar: {
                backgroundColor: '#31A497',
            },
            landingPage: {
                descriptionTextColor: '#838D89',
            },
        },
    },
});

const drawerWidth = 240;

const menuStyles = makeStyles((theme) => ({
    link: {
        color: theme.palette.text.primary,
        fontWeight: 300,
    },
    divider: {
        marginTop: '1em',
        marginBottom: '1em',
    },
}));

const useStyles = makeStyles((theme: Theme) => ({
    root: {
        display: 'flex',
    },
    buttonLabel: {
        display: 'block',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
    },
    spacer: {
        flexGrow: 1,
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    mapLink: {
        margin: '0 8px 0 16px',
        whiteSpace: 'nowrap',
    },
    hide: {
        display: 'none',
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        backgroundColor: '#ECF3F0',
        border: 'none',
        width: drawerWidth,
    },
    drawerContents: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        marginLeft: '24px',
        marginRight: '32px',
    },
    drawerHeader: {
        // necessary for content to be below app bar
        ...theme.mixins.toolbar,
    },
    divider: {
        backgroundColor: '#0A7369',
        height: '1px',
        opacity: '0.2',
        margin: '24px 0',
        marginTop: '12px',
        width: '100%',
    },
    link: {
        marginTop: 12,
    },
    lastLink: {
        marginBottom: 24,
    },
    content: {
        flexGrow: 1,
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
        }),
        marginLeft: -drawerWidth,
        paddingLeft: '24px',
        width: '100%',
    },
    contentShift: {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
        paddingLeft: 0,
        width: `calc(100% - ${drawerWidth}px)`,
    },
    createNewButton: {
        margin: '12px 0',
        width: '100%',
    },
    createNewIcon: {
        marginRight: '12px',
    },
    covidTitle: {
        fontSize: '28px',
        marginLeft: '14px',
        marginTop: '8px',
    },
    searchBar: {
        flex: 1,
        marginLeft: theme.spacing(4),
        marginRight: theme.spacing(2),
    },
    avatar: {
        width: theme.spacing(3),
        height: theme.spacing(3),
    },
}));

function ProfileMenu(props: { user: User }): JSX.Element {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const classes = menuStyles();

    return (
        <div>
            <IconButton
                aria-controls="profile-menu"
                data-testid="profile-menu"
                aria-haspopup="true"
                onClick={handleClick}
            >
                <Avatar alt={props.user.email} src={props.user.picture} />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleClose}
                data-testid="profile-menu-dropdown"
            >
                <Link to="/profile" onClick={handleClose}>
                    <MenuItem>Profile</MenuItem>
                </Link>

                <MenuItem
                    onClick={() => {
                        try {
                            Auth.signOut();
                        } catch (err) {
                            console.error(err);
                        }
                        window.location.href = '/auth/logout';
                    }}
                >
                    Logout
                </MenuItem>
                <Divider className={classes.divider} />
                <a
                    href="https://global.health/about/"
                    onClick={handleClose}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <MenuItem>About Global.health</MenuItem>
                </a>
                <a
                    className={classes.link}
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://github.com/globaldothealth/list/blob/main/data-serving/scripts/export-data/functions/01-split/fields.txt"
                    onClick={handleClose}
                >
                    <MenuItem>Data dictionary</MenuItem>
                </a>
                <a
                    className={classes.link}
                    rel="noopener noreferrer"
                    target="_blank"
                    href="https://global.health/acknowledgement/"
                    onClick={handleClose}
                >
                    <MenuItem>Data acknowledgments</MenuItem>
                </a>
                <a
                    href="https://github.com/globaldothealth/list#globalhealth-list"
                    rel="noopener noreferrer"
                    target="_blank"
                    onClick={handleClose}
                >
                    <MenuItem>View source on Github</MenuItem>
                </a>
            </Menu>
        </div>
    );
}

interface LocationState {
    search: string;
}

export interface ChipData {
    key: string;
    value: string;
}

export default function App(): JSX.Element {
    const dispatch = useAppDispatch();

    const CookieBanner = () => {
        const { initCookieBanner } = useCookieBanner();

        useEffect(() => {
            initCookieBanner();
        }, [initCookieBanner]);

        return null;
    };

    const [totalDataCount, setTotalDataCount] = useState<number>(0);
    const showMenu = useMediaQuery(theme.breakpoints.up('sm'));
    const [user, setUser] = useState<User | undefined>();
    const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
    const [createNewButtonAnchorEl, setCreateNewButtonAnchorEl] =
        useState<Element | null>();
    const [selectedMenuIndex, setSelectedMenuIndex] = React.useState<number>();
    const [listPage, setListPage] = React.useState<number>(0);
    const [listPageSize, setListPageSize] = React.useState<number>(50);
    const rootRef = React.useRef<HTMLDivElement>(null);
    const lastLocation = useLastLocation();
    const history = useHistory();
    const location = useLocation<LocationState>();
    const [filtersModalOpen, setFiltersModalOpen] =
        React.useState<boolean>(false);
    const [activeFilterInput, setActiveFilterInput] =
        React.useState<string>('');
    const [sortBy, setSortBy] = useState<SortBy>(SortBy.Default);
    const [sortByOrder, setSortByOrder] = useState<SortByOrder>(
        SortByOrder.Descending,
    );
    const classes = useStyles();

    const savedSearchQuery = localStorage.getItem('searchQuery');

    const hasAnyRole = useCallback(
        (requiredRoles: string[]): boolean => {
            if (!user) {
                return false;
            }
            return user?.roles?.some((r: string) => requiredRoles.includes(r));
        },
        [user],
    );

    const menuList = useMemo(
        () =>
            user
                ? [
                      {
                          text: 'Charts',
                          icon: <HomeIcon />,
                          to: '/',
                          displayCheck: (): boolean =>
                              hasAnyRole(['curator', 'admin']),
                      },
                      {
                          text: 'Line list',
                          icon: <ListIcon />,
                          to: { pathname: '/cases', search: '' },
                          displayCheck: (): boolean => true,
                      },
                      {
                          text: 'Sources',
                          icon: <LinkIcon />,
                          to: '/sources',
                          displayCheck: (): boolean => hasAnyRole(['curator']),
                      },
                      {
                          text: 'Uploads',
                          icon: <PublishIcon />,
                          to: '/uploads',
                          displayCheck: (): boolean => hasAnyRole(['curator']),
                      },
                      {
                          text: 'Manage users',
                          icon: <PeopleIcon />,
                          to: '/users',
                          displayCheck: (): boolean => hasAnyRole(['admin']),
                      },
                  ]
                : [],
        [user, hasAnyRole],
    );

    // Update filter breadcrumbs
    useEffect(() => {
        if (!location.pathname.includes('/cases')) {
            dispatch(setFilterBreadcrumbs([]));
            return;
        }
        if (location.pathname === '/cases') {
            const searchParams = new URLSearchParams(location.search);
            const tempFilterBreadcrumbs: ChipData[] = [];
            searchParams.forEach((value, key) => {
                tempFilterBreadcrumbs.push({ key, value });
            });
            dispatch(setFilterBreadcrumbs(tempFilterBreadcrumbs));
        }
        //eslint-disable-next-line
    }, [location.search]);

    useEffect(() => {
        const menuIndex = menuList.findIndex((menuItem) => {
            const pathname =
                typeof menuItem.to === 'string'
                    ? menuItem.to
                    : menuItem.to.pathname;
            return pathname === location.pathname;
        });
        setSelectedMenuIndex(menuIndex);
    }, [location.pathname, menuList]);

    const getUser = (): void => {
        setIsLoadingUser(true);
        axios
            .get<User>('/auth/profile')
            .then((resp) => {
                setUser({
                    _id: resp.data._id,
                    name: resp.data.name,
                    email: resp.data.email,
                    roles: resp.data.roles,
                    picture: resp.data.picture,
                });
            })
            .catch((e) => {
                setUser(undefined);
            })
            .finally(() => setIsLoadingUser(false));
    };

    const toggleDrawer = (): void => {
        setDrawerOpen(!drawerOpen);
    };

    const openCreateNewPopup = (event: {
        currentTarget: Element | null | undefined;
    }): void => {
        setCreateNewButtonAnchorEl(event.currentTarget);
    };

    const closeCreateNewPopup = (): void => {
        setCreateNewButtonAnchorEl(undefined);
    };

    const onModalClose = (): void => {
        if (lastLocation) {
            history.goBack();
        } else {
            history.push('/cases');
        }
    };

    useEffect(() => {
        getUser();
    }, []);

    useEffect(() => {
        if (!user) return;

        setDrawerOpen(hasAnyRole(['curator', 'admin']) && showMenu);
        //eslint-disable-next-line
    }, [user]);

    // Update search query based on stored search from landing page
    useEffect(() => {
        if (savedSearchQuery === null || savedSearchQuery === '') return;

        history.push({ pathname: '/cases', search: savedSearchQuery });

        // eslint-disable-next-line
    }, [savedSearchQuery]);

    // Function for deleting filter breadcrumbs
    const handleFilterBreadcrumbDelete = (breadcrumbToDelete: ChipData) => {
        const searchParams = new URLSearchParams(location.search);
        dispatch(deleteFilterBreadcrumbs(breadcrumbToDelete));
        searchParams.delete(breadcrumbToDelete.key);
        history.push({
            pathname: '/cases',
            search: searchParams.toString(),
        });
    };

    useEffect(() => {
        if (location.pathname.includes('/cases/view')) return;
        dispatch(setSearchQuery(URLToSearchQuery(location.search)));

        //eslint-disable-next-line
    }, [location.search]);

    return (
        <div className={classes.root} ref={rootRef}>
            <ThemeProvider theme={theme}>
                <CookieBanner />
                <CssBaseline />
                <AppBar
                    position="fixed"
                    elevation={0}
                    className={classes.appBar}
                >
                    <Toolbar>
                        {user && (
                            <IconButton
                                color="primary"
                                aria-label="toggle drawer"
                                onClick={toggleDrawer}
                                edge="start"
                                className={classes.menuButton}
                            >
                                <MenuIcon />
                            </IconButton>
                        )}
                        <GHListLogo />
                        {location.pathname === '/cases' && user ? (
                            <>
                                <div className={classes.searchBar}>
                                    <SearchBar
                                        rootComponentRef={rootRef}
                                        filtersModalOpen={filtersModalOpen}
                                        setFiltersModalOpen={
                                            setFiltersModalOpen
                                        }
                                        activeFilterInput={activeFilterInput}
                                        setActiveFilterInput={
                                            setActiveFilterInput
                                        }
                                    />
                                </div>
                                <DownloadButton
                                    totalCasesCount={totalDataCount}
                                />
                            </>
                        ) : (
                            <span className={classes.spacer}></span>
                        )}
                        {user && (
                            <>
                                <Typography>
                                    <a
                                        className={classes.mapLink}
                                        data-testid="mapLink"
                                        href="https://map.covid-19.global.health/"
                                        rel="noopener noreferrer"
                                        target="_blank"
                                    >
                                        G.h Map
                                    </a>
                                </Typography>
                                <ProfileMenu user={user} />{' '}
                            </>
                        )}
                    </Toolbar>
                </AppBar>
                {user && (
                    <Drawer
                        className={classes.drawer}
                        variant="persistent"
                        anchor="left"
                        open={drawerOpen}
                        classes={{
                            paper: classes.drawerPaper,
                        }}
                    >
                        <div className={classes.drawerContents}>
                            <div className={classes.drawerHeader}></div>
                            <Typography className={classes.covidTitle}>
                                COVID-19
                            </Typography>
                            {hasAnyRole(['curator']) && (
                                <>
                                    <Fab
                                        variant="extended"
                                        data-testid="create-new-button"
                                        className={classes.createNewButton}
                                        color="secondary"
                                        onClick={openCreateNewPopup}
                                    >
                                        <AddIcon
                                            className={classes.createNewIcon}
                                        />
                                        Create new
                                    </Fab>
                                    <Menu
                                        anchorEl={createNewButtonAnchorEl}
                                        getContentAnchorEl={null}
                                        keepMounted
                                        open={Boolean(createNewButtonAnchorEl)}
                                        onClose={closeCreateNewPopup}
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'left',
                                        }}
                                    >
                                        <Link
                                            to="/cases/new"
                                            onClick={closeCreateNewPopup}
                                        >
                                            <MenuItem>
                                                New line list case
                                            </MenuItem>
                                        </Link>
                                        <Link
                                            to="/cases/bulk"
                                            onClick={closeCreateNewPopup}
                                        >
                                            <MenuItem>New bulk upload</MenuItem>
                                        </Link>
                                        <Link
                                            to="/sources/automated"
                                            onClick={closeCreateNewPopup}
                                        >
                                            <MenuItem>
                                                New automated source
                                            </MenuItem>
                                        </Link>
                                        <Link
                                            to="/sources/backfill"
                                            onClick={closeCreateNewPopup}
                                        >
                                            <MenuItem>
                                                New automated source backfill
                                            </MenuItem>
                                        </Link>
                                    </Menu>
                                </>
                            )}
                            <List>
                                {menuList.map(
                                    (item, index) =>
                                        item.displayCheck() && (
                                            <Link key={item.text} to={item.to}>
                                                <ListItem
                                                    button
                                                    key={item.text}
                                                    selected={
                                                        selectedMenuIndex ===
                                                        index
                                                    }
                                                >
                                                    <ListItemIcon>
                                                        {item.icon}
                                                    </ListItemIcon>

                                                    <ListItemText
                                                        primary={item.text}
                                                    />
                                                </ListItem>
                                            </Link>
                                        ),
                                )}
                            </List>
                            <div className={classes.spacer}></div>
                            <div className={classes.divider}></div>
                            <a
                                href="https://github.com/globaldothealth/list/blob/main/data-serving/scripts/export-data/functions/01-split/fields.txt"
                                rel="noopener noreferrer"
                                target="_blank"
                                data-testid="dictionaryButton"
                            >
                                Data dictionary
                            </a>
                            <a
                                href="https://global.health/acknowledgement/"
                                rel="noopener noreferrer"
                                target="_blank"
                                className={classes.link}
                                data-testid="acknowledgmentsButton"
                            >
                                Data acknowledgments
                            </a>
                            <a
                                href="https://global.health/terms-of-use"
                                rel="noopener noreferrer"
                                target="_blank"
                                className={classes.link}
                                data-testid="termsButton"
                            >
                                Terms of use
                            </a>
                            <a
                                href="https://global.health/privacy/"
                                rel="noopener noreferrer"
                                target="_blank"
                                className={classes.link}
                                data-testid="privacypolicybutton"
                            >
                                Privacy policy
                            </a>
                            <PolicyLink
                                type="cookie-policy"
                                classes={{
                                    root: clsx([
                                        classes.link,
                                        classes.lastLink,
                                    ]),
                                }}
                            >
                                Cookie policy
                            </PolicyLink>
                        </div>
                    </Drawer>
                )}
                <main
                    className={clsx(classes.content, {
                        [classes.contentShift]: drawerOpen,
                    })}
                >
                    <div className={classes.drawerHeader} />
                    <Switch>
                        <Redirect from="/:url*(/+)" to={location.pathname.slice(0, -1)} />
                        {user && (
                            <Route exact path="/cases">
                                <LinelistTable
                                    user={user}
                                    page={listPage}
                                    pageSize={listPageSize}
                                    onChangePage={setListPage}
                                    onChangePageSize={setListPageSize}
                                    handleBreadcrumbDelete={
                                        handleFilterBreadcrumbDelete
                                    }
                                    setTotalDataCount={setTotalDataCount}
                                    setFiltersModalOpen={setFiltersModalOpen}
                                    setActiveFilterInput={setActiveFilterInput}
                                    sortBy={sortBy}
                                    sortByOrder={sortByOrder}
                                    setSortBy={setSortBy}
                                    setSortByOrder={setSortByOrder}
                                />
                            </Route>
                        )}
                        {hasAnyRole(['curator']) && (
                            <Route exact path="/sources">
                                <SourceTable />
                            </Route>
                        )}
                        {hasAnyRole(['curator']) && (
                            <Route exact path="/uploads">
                                <UploadsTable />
                            </Route>
                        )}
                        {user && (
                            <Route path="/profile">
                                <Profile user={user} />
                            </Route>
                        )}
                        {user && hasAnyRole(['admin']) && (
                            <Route path="/users">
                                <Users user={user} onUserChange={getUser} />
                            </Route>
                        )}{' '}
                        {user && hasAnyRole(['curator']) && (
                            <Route path="/sources/automated">
                                <AutomatedSourceForm
                                    user={user}
                                    onModalClose={onModalClose}
                                />
                            </Route>
                        )}
                        {user && hasAnyRole(['curator']) && (
                            <Route path="/cases/bulk">
                                <BulkCaseForm
                                    user={user}
                                    onModalClose={onModalClose}
                                />
                            </Route>
                        )}
                        {user && hasAnyRole(['curator']) && (
                            <Route path="/sources/backfill">
                                <AutomatedBackfill
                                    user={user}
                                    onModalClose={onModalClose}
                                />
                            </Route>
                        )}
                        {user && hasAnyRole(['curator']) && (
                            <Route path="/cases/new">
                                <CaseForm
                                    user={user}
                                    onModalClose={onModalClose}
                                />
                            </Route>
                        )}
                        {user && hasAnyRole(['curator']) && (
                            <Route
                                path="/cases/edit/:id"
                                render={({ match }) => {
                                    return (
                                        <EditCase
                                            id={match.params.id}
                                            user={user}
                                            onModalClose={onModalClose}
                                        />
                                    );
                                }}
                            />
                        )}
                        {user && (
                            <Route
                                path="/cases/view/:id"
                                render={({ match }): JSX.Element => {
                                    return (
                                        <ViewCase
                                            id={match.params.id}
                                            enableEdit={hasAnyRole(['curator'])}
                                            onModalClose={onModalClose}
                                        />
                                    );
                                }}
                            />
                        )}
                        <Route exact path="/terms">
                            <TermsOfUse />
                        </Route>
                        <Route exact path="/">
                            {hasAnyRole(['curator', 'admin']) &&
                            location.search === '' ? (
                                <Charts />
                            ) : user ? (
                                <Redirect
                                    to={{
                                        pathname: '/cases',
                                        search: savedSearchQuery || '',
                                    }}
                                />
                            ) : isLoadingUser ? (
                                <></>
                            ) : (
                                <LandingPage setUser={setUser} />
                            )}
                        </Route>
                        {/* Redirect any unavailable URLs to / after the user has loaded. */}
                        {!isLoadingUser && (
                            <Route path="/">
                                <Redirect to="/" />
                            </Route>
                        )}
                    </Switch>
                </main>
            </ThemeProvider>
        </div>
    );
}
