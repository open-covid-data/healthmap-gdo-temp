import '@testing-library/jest-dom/extend-expect';

import { render, fireEvent, screen, wait } from './util/test-utils';

import LinelistTable from './LinelistTable';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import axios from 'axios';
import range from 'lodash/range';
import userEvent from '@testing-library/user-event';
import { ChipData } from './App/App';
import store from '../store';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const curator = {
    _id: 'testUser',
    name: 'Alice Smith',
    email: 'foo@bar.com',
    roles: ['admin', 'curator'],
};

afterEach(() => {
    mockedAxios.get.mockClear();
    mockedAxios.delete.mockClear();
    mockedAxios.post.mockClear();
    mockedAxios.put.mockClear();
});

const DATA_LIMIT = 10000;

describe('<LinelistTable />', () => {
    it('loads and displays cases', async () => {
        const cases = [
            {
                _id: 'abc123',
                importedCase: {
                    outcome: 'Recovered',
                },
                caseReference: {
                    sourceId: '5ef8e943dfe6e00030892d58',
                    sourceUrl: 'www.example.com',
                    uploadId: '012345678901234567890123',
                    verificationStatus: 'VERIFIED',
                },
                demographics: {
                    ageRange: { start: 1, end: 3 },
                    gender: 'Female',
                },
                location: {
                    country: 'France',
                    administrativeAreaLevel1: 'some admin 1',
                    administrativeAreaLevel2: 'some admin 2',
                    administrativeAreaLevel3: 'some admin 3',
                    name: 'some place name',
                    geometry: {
                        latitude: 42.123421,
                        longitude: 12.376867,
                    },
                    geoResolution: 'Admin3',
                },
                events: [
                    {
                        name: 'onsetSymptoms',
                        dateRange: {
                            start: new Date(Date.UTC(2020, 10, 28)).toJSON(),
                            end: new Date(Date.UTC(2020, 10, 28)).toJSON(),
                        },
                    },
                    {
                        name: 'confirmed',
                        dateRange: {
                            start: new Date().toJSON(),
                        },
                        value: 'PCR test',
                    },
                    {
                        name: 'hospitalAdmission',
                        value: 'Yes',
                        dateRange: {
                            start: new Date(Date.UTC(2020, 11, 1)).toJSON(),
                            end: new Date(Date.UTC(2020, 11, 6)).toJSON(),
                        },
                    },
                    {
                        name: 'outcome',
                        value: 'Recovered',
                    },
                ],
                notes: 'some notes',
                revisionMetadata: {
                    revisionNumber: 0,
                    creationMetadata: {
                        curator: 'foo@bar.com',
                    },
                },
            },
        ];
        const axiosResponse = {
            data: {
                cases: cases,
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosResponse);

        const { findByText, findByTestId } = render(
            <MemoryRouter>
                <LinelistTable
                    user={curator}
                    page={0}
                    pageSize={50}
                    onChangePage={jest.fn()}
                    onChangePageSize={jest.fn()}
                    handleBreadcrumbDelete={jest.fn()}
                    setTotalDataCount={jest.fn()}
                    setFiltersModalOpen={jest.fn()}
                    setActiveFilterInput={jest.fn()}
                    sortBy={0}
                    sortByOrder={1}
                    setSortBy={jest.fn()}
                    setSortByOrder={jest.fn()}
                />
            </MemoryRouter>,
            {
                initialState: {
                    app: { filterBreadcrumbs: [], searchQuery: '' },
                },
            },
        );

        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            `/api/cases/?limit=50&page=1&count_limit=${DATA_LIMIT}&sort_by=0&order=1`,
        );
        expect(await findByText('www.example.com')).toBeInTheDocument();
        expect(await findByText('some admin 1')).toBeInTheDocument();
        expect(await findByText('some admin 2')).toBeInTheDocument();
        expect(await findByText('some admin 3')).toBeInTheDocument();
        expect(await findByText('France')).toBeInTheDocument();
        expect(await findByText('42.1234')).toBeInTheDocument();
        expect(await findByText('12.3769')).toBeInTheDocument();
        expect(await findByText('1-3')).toBeInTheDocument();
        expect(await findByText('Female')).toBeInTheDocument();
        expect(await findByText('Recovered')).toBeInTheDocument();
        expect(await findByText('2020-11-28')).toBeInTheDocument();
        expect(await findByText('2020-12-01 - 2020-12-06')).toBeInTheDocument();
        expect(await findByTestId('verified-svg')).toBeInTheDocument();
    });

    it('API errors are displayed', async () => {
        const cases = [
            {
                _id: 'abc123',
                caseReference: {
                    sourceId: 'CDC',
                    sourceUrl: 'www.example.com',
                },
                importedCase: {
                    outcome: 'Recovered',
                },
                location: {
                    country: 'France',
                    geoResolution: 'Country',
                },
                events: [
                    {
                        name: 'confirmed',
                        dateRange: {
                            start: new Date().toJSON(),
                        },
                    },
                ],
                notes: 'some notes',
            },
        ];
        const axiosResponse = {
            data: {
                cases: cases,
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosResponse);

        const { getByText, findByText, getByTestId } = render(
            <MemoryRouter>
                <LinelistTable
                    user={curator}
                    page={0}
                    pageSize={50}
                    onChangePage={jest.fn()}
                    onChangePageSize={jest.fn()}
                    handleBreadcrumbDelete={jest.fn()}
                    setTotalDataCount={jest.fn()}
                    setFiltersModalOpen={jest.fn()}
                    setActiveFilterInput={jest.fn()}
                    sortBy={0}
                    sortByOrder={1}
                    setSortBy={jest.fn()}
                    setSortByOrder={jest.fn()}
                />
            </MemoryRouter>,
            {
                initialState: {
                    app: { filterBreadcrumbs: [], searchQuery: '' },
                },
            },
        );

        const row = await findByText('www.example.com');
        expect(row).toBeInTheDocument();

        // Throw error on delete request.
        mockedAxios.delete.mockRejectedValueOnce(new Error('Request failed'));

        fireEvent.click(getByTestId(/row menu/));
        fireEvent.click(getByText(/Delete/));
        fireEvent.click(getByText(/Yes/));
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);

        const error = await findByText('Error: Request failed');
        expect(error).toBeInTheDocument();
    });

    it('can delete a row', async () => {
        const cases = [
            {
                _id: 'abc123',
                caseReference: {
                    sourceId: 'CDC',
                    sourceUrl: 'www.example.com',
                },
                importedCase: {
                    outcome: 'Recovered',
                },
                location: {
                    country: 'France',
                    geoResolution: 'Country',
                },
                events: [
                    {
                        name: 'confirmed',
                        dateRange: {
                            start: new Date().toJSON(),
                        },
                    },
                ],
                notes: 'some notes',
            },
        ];
        const axiosGetResponse = {
            data: {
                cases: cases,
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosGetResponse);

        // Load table
        const { getByText, findByText, getByTestId } = render(
            <MemoryRouter>
                <LinelistTable
                    user={curator}
                    page={0}
                    pageSize={50}
                    onChangePage={jest.fn()}
                    onChangePageSize={jest.fn()}
                    setTotalDataCount={jest.fn()}
                    handleBreadcrumbDelete={jest.fn()}
                    setFiltersModalOpen={jest.fn()}
                    setActiveFilterInput={jest.fn()}
                    sortBy={0}
                    sortByOrder={1}
                    setSortBy={jest.fn()}
                    setSortByOrder={jest.fn()}
                />
            </MemoryRouter>,
            {
                initialState: {
                    app: { filterBreadcrumbs: [], searchQuery: '' },
                },
            },
        );
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            `/api/cases/?limit=50&page=1&count_limit=${DATA_LIMIT}&sort_by=0&order=1`,
        );
        const row = await findByText('www.example.com');
        expect(row).toBeInTheDocument();

        // Delete case
        const axiosGetAfterDeleteResponse = {
            data: {
                cases: [],
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        const axiosDeleteResponse = {
            data: {
                case: cases[0],
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosGetAfterDeleteResponse);
        mockedAxios.delete.mockResolvedValueOnce(axiosDeleteResponse);

        fireEvent.click(getByTestId(/row menu/));
        fireEvent.click(getByText(/Delete/));
        fireEvent.click(getByText(/Yes/));
        expect(mockedAxios.delete).toHaveBeenCalledTimes(1);

        expect(mockedAxios.delete).toHaveBeenCalledWith(
            '/api/cases/' + cases[0]._id,
        );

        // Check table data is reloaded
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        const noRec = await findByText(/No records to display/);
    });

    it('can cancel delete action', async () => {
        const cases = [
            {
                _id: 'abc123',
                caseReference: {
                    sourceId: 'CDC',
                    sourceUrl: 'www.example.com',
                },
                importedCase: {
                    outcome: 'Recovered',
                },
                location: {
                    country: 'France',
                    geoResolution: 'Country',
                },
                events: [
                    {
                        name: 'confirmed',
                        dateRange: {
                            start: new Date().toJSON(),
                        },
                    },
                ],
                notes: 'some notes',
            },
        ];
        const axiosGetResponse = {
            data: {
                cases: cases,
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosGetResponse);

        // Load table
        const { getByText, findByText, getByTestId } = render(
            <MemoryRouter>
                <LinelistTable
                    user={curator}
                    page={0}
                    pageSize={50}
                    onChangePage={jest.fn()}
                    onChangePageSize={jest.fn()}
                    setTotalDataCount={jest.fn()}
                    handleBreadcrumbDelete={jest.fn()}
                    setFiltersModalOpen={jest.fn()}
                    setActiveFilterInput={jest.fn()}
                    sortBy={0}
                    sortByOrder={1}
                    setSortBy={jest.fn()}
                    setSortByOrder={jest.fn()}
                />
            </MemoryRouter>,
            {
                initialState: {
                    app: { filterBreadcrumbs: [], searchQuery: '' },
                },
            },
        );
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            `/api/cases/?limit=50&page=1&count_limit=${DATA_LIMIT}&sort_by=0&order=1`,
        );
        const row = await findByText('www.example.com');
        expect(row).toBeInTheDocument();

        fireEvent.click(getByTestId(/row menu/));
        fireEvent.click(getByText(/Delete/));
        fireEvent.click(getByText(/Cancel/));
        expect(mockedAxios.delete).toHaveBeenCalledTimes(0);
        expect(row).toBeInTheDocument();
    });

    it('cannot edit data if not curator', async () => {
        const cases = [
            {
                _id: 'abc123',
                caseReference: {
                    sourceId: 'CDC',
                    sourceUrl: 'www.example.com',
                },
                importedCase: {
                    outcome: 'Recovered',
                },
                location: {
                    country: 'France',
                    geoResolution: 'Country',
                    geometry: {
                        latitude: 42,
                        longitude: 12,
                    },
                    name: 'France',
                },
                events: [
                    {
                        name: 'confirmed',
                        dateRange: {
                            start: new Date().toJSON(),
                        },
                    },
                ],
                notes: 'some notes',
            },
        ];
        const axiosGetResponse = {
            data: {
                cases: cases,
                total: 15,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosGetResponse);

        // Load table
        const { findByText, queryByTestId } = render(
            <MemoryRouter>
                <LinelistTable
                    user={{
                        _id: 'testUser',
                        name: 'Alice Smith',
                        email: 'foo@bar.com',
                        roles: [],
                    }}
                    page={0}
                    pageSize={50}
                    onChangePage={jest.fn()}
                    onChangePageSize={jest.fn()}
                    setTotalDataCount={jest.fn()}
                    handleBreadcrumbDelete={jest.fn()}
                    setFiltersModalOpen={jest.fn()}
                    setActiveFilterInput={jest.fn()}
                    sortBy={0}
                    sortByOrder={1}
                    setSortBy={jest.fn()}
                    setSortByOrder={jest.fn()}
                />
            </MemoryRouter>,
            {
                initialState: {
                    app: { filterBreadcrumbs: [], searchQuery: '' },
                },
            },
        );
        expect(mockedAxios.get).toHaveBeenCalledTimes(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
            `/api/cases/?limit=50&page=1&count_limit=${DATA_LIMIT}&sort_by=0&order=1`,
        );
        const row = await findByText('www.example.com');
        expect(row).toBeInTheDocument();

        expect(queryByTestId(/row menu/)).not.toBeInTheDocument();
    });

    it('initializes with correct page and page size values', async () => {
        const sampleCase = {
            _id: 'abc123',
            caseReference: {
                sourceId: 'CDC',
                sourceUrl: 'www.example.com',
            },
            importedCase: {
                outcome: 'Recovered',
            },
            location: {
                country: 'France',
                geoResolution: 'Country',
            },
            events: [
                {
                    name: 'confirmed',
                    dateRange: {
                        start: new Date().toJSON(),
                    },
                },
            ],
            notes: 'some notes',
        };

        // generate 20 cases for pagination purposes
        const cases = range(20).map(() => sampleCase);

        const axiosResponse = {
            data: {
                cases: cases,
                total: cases.length,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosResponse);

        const { findByText, findAllByText } = render(
            <MemoryRouter>
                <LinelistTable
                    user={curator}
                    page={1}
                    pageSize={10}
                    onChangePage={jest.fn()}
                    onChangePageSize={jest.fn()}
                    setTotalDataCount={jest.fn()}
                    handleBreadcrumbDelete={jest.fn()}
                    setFiltersModalOpen={jest.fn()}
                    setActiveFilterInput={jest.fn()}
                    sortBy={0}
                    sortByOrder={1}
                    setSortBy={jest.fn()}
                    setSortByOrder={jest.fn()}
                />
            </MemoryRouter>,
            {
                initialState: {
                    app: { filterBreadcrumbs: [], searchQuery: '' },
                },
            },
        );

        const rowsCounter = await findAllByText('11-20 of 20');
        const pageSizeCounter = await findByText('10 rows');
        // there are two DOM elements showing number of elements
        expect(rowsCounter).toHaveLength(2);
        expect(pageSizeCounter).toBeInTheDocument();
    });

    it('paginates through data', async () => {
        const sampleCase = {
            _id: 'abc123',
            caseReference: {
                sourceId: 'CDC',
                sourceUrl: 'www.example.com',
            },
            importedCase: {
                outcome: 'Recovered',
            },
            location: {
                country: 'France',
                geoResolution: 'Country',
            },
            events: [
                {
                    name: 'confirmed',
                    dateRange: {
                        start: new Date().toJSON(),
                    },
                },
            ],
            notes: 'some notes',
        };

        // generate 20 cases for pagination purposes
        const cases = range(20).map(() => sampleCase);

        const axiosResponse = {
            data: {
                cases: cases,
                total: cases.length,
            },
            status: 200,
            statusText: 'OK',
            config: {},
            headers: {},
        };
        mockedAxios.get.mockResolvedValueOnce(axiosResponse);

        const changePage = jest.fn();
        const changePageSize = jest.fn();

        const { getByText, getAllByText, findAllByText } = render(
            <MemoryRouter>
                <LinelistTable
                    user={curator}
                    page={0}
                    pageSize={10}
                    onChangePage={changePage}
                    onChangePageSize={changePageSize}
                    setTotalDataCount={jest.fn()}
                    handleBreadcrumbDelete={jest.fn()}
                    setFiltersModalOpen={jest.fn()}
                    setActiveFilterInput={jest.fn()}
                    sortBy={0}
                    sortByOrder={1}
                    setSortBy={jest.fn()}
                    setSortByOrder={jest.fn()}
                />
            </MemoryRouter>,
            {
                initialState: {
                    app: { filterBreadcrumbs: [], searchQuery: '' },
                },
            },
        );

        expect(await findAllByText('1-10 of 20')).toHaveLength(2);

        fireEvent.click(getByText('chevron_right'));

        expect(changePage).toHaveBeenCalledTimes(1);
        expect(changePage).toHaveBeenCalledWith(1);

        wait(() => {
            expect(getAllByText('11-20 of 20')).toHaveLength(2);
            expect(getAllByText('France')).toHaveLength(10);
        });

        fireEvent.click(getByText('10 rows'));

        wait(() => {
            fireEvent.click(getByText('5'));
            expect(changePageSize).toHaveBeenCalledTimes(1);

            expect(getAllByText('5 rows')).toBeInTheDocument();
            expect(getAllByText('1-5 of 20')).toHaveLength(2);

            expect(getAllByText('France')).toHaveLength(5);
        });
    });

    it('displays filter breadcrumbs', () => {
        const breadcrumbs: ChipData[] = [
            { key: 'country', value: 'Peru' },
            { key: 'gender', value: 'Female' },
        ];

        render(
            <MemoryRouter>
                <LinelistTable
                    user={curator}
                    page={0}
                    pageSize={10}
                    onChangePage={jest.fn()}
                    onChangePageSize={jest.fn()}
                    setTotalDataCount={jest.fn()}
                    handleBreadcrumbDelete={jest.fn()}
                    setFiltersModalOpen={jest.fn()}
                    setActiveFilterInput={jest.fn()}
                    sortBy={0}
                    sortByOrder={1}
                    setSortBy={jest.fn()}
                    setSortByOrder={jest.fn()}
                />
            </MemoryRouter>,
            {
                initialState: {
                    app: { filterBreadcrumbs: breadcrumbs, searchQuery: '' },
                },
            },
        );

        expect(screen.getByText(/filters/i)).toBeInTheDocument();
        expect(screen.getByText(/country - Peru/i)).toBeInTheDocument();
        expect(screen.getByText(/gender - Female/i)).toBeInTheDocument();
    });

    it('opens FiltersModal when filters breadcrumb is clicked', async () => {
        const breadcrumbs: ChipData[] = [
            { key: 'country', value: 'Peru' },
            { key: 'gender', value: 'Female' },
        ];

        const setFiltersModalOpen = jest.fn();

        render(
            <MemoryRouter>
                <LinelistTable
                    user={curator}
                    page={0}
                    pageSize={10}
                    onChangePage={jest.fn()}
                    onChangePageSize={jest.fn()}
                    setTotalDataCount={jest.fn()}
                    handleBreadcrumbDelete={jest.fn()}
                    setFiltersModalOpen={setFiltersModalOpen}
                    setActiveFilterInput={jest.fn()}
                    sortBy={0}
                    sortByOrder={1}
                    setSortBy={jest.fn()}
                    setSortByOrder={jest.fn()}
                />
            </MemoryRouter>,
            {
                initialState: {
                    app: { filterBreadcrumbs: breadcrumbs, searchQuery: '' },
                },
            },
        );

        const filtersBreadcrumb = screen.getByText(/filters/i);
        userEvent.click(filtersBreadcrumb);

        expect(setFiltersModalOpen).toBeCalledTimes(1);
    });
});
