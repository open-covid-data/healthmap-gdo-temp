import { RootState } from '../../../store';
import { ChipData } from '../App';

export const selectSearchQuery: (state: RootState) => string = (state) =>
    state.app.searchQuery;
export const selectFilterBreadcrumbs: (state: RootState) => ChipData[] = (
    state,
) => state.app.filterBreadcrumbs;
