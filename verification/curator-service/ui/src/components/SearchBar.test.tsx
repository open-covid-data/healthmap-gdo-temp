import React from 'react';
import { render, screen, wait } from './util/test-utils';

import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

const AppTestComponent = () => {
    const rootRef = React.useRef<HTMLDivElement>(null);
    const [filtersModalOpen, setFiltersModalOpen] =
        React.useState<boolean>(false);

    return (
        <div ref={rootRef}>
            <SearchBar
                rootComponentRef={rootRef}
                filtersModalOpen={filtersModalOpen}
                setFiltersModalOpen={setFiltersModalOpen}
                activeFilterInput={''}
                setActiveFilterInput={jest.fn()}
            />
        </div>
    );
};

jest.mock('react-router-dom', () => ({
    useLocation: jest.fn().mockReturnValue({
        pathname: '/case',
        search: '',
        hash: '',
        state: null,
    }),
    useHistory: jest.fn(),
}));

describe('<SearchBar />', () => {
    it('Should open filters modal', async () => {
        render(<AppTestComponent />, {
            initialState: { app: { filterBreadcrumbs: [], searchQuery: '' } },
        });

        userEvent.click(screen.getByRole('button', { name: /Filter/i }));

        await wait(() => {
            expect(screen.getByText(/Apply filters/i)).toBeInTheDocument();
        });
    });
});
