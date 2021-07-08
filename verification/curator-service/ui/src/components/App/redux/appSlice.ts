import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChipData } from '../App';

interface AppState {
    searchQuery: string;
    filterBreadcrumbs: ChipData[];
}

const initialState: AppState = {
    searchQuery: '',
    filterBreadcrumbs: [],
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        setFilterBreadcrumbs: (state, action: PayloadAction<ChipData[]>) => {
            state.filterBreadcrumbs = action.payload;
        },
        deleteFilterBreadcrumbs: (state, action: PayloadAction<ChipData>) => {
            state.filterBreadcrumbs = state.filterBreadcrumbs.filter(
                (breadcrumb) => breadcrumb.key !== action.payload.key,
            );
        },
    },
});

// actions
export const { setSearchQuery, setFilterBreadcrumbs, deleteFilterBreadcrumbs } =
    appSlice.actions;

// reducer
export default appSlice.reducer;
