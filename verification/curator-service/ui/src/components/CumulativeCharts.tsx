import { Theme, WithStyles, createStyles, withStyles } from '@material-ui/core';

import ChartsEmbedSDK from '@mongodb-js/charts-embed-dom';
import React from 'react';

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const styles = (theme: Theme) =>
    createStyles({
        container: {
            display: 'flex',
            width: '100%',
        },
        chart: {
            boxShadow:
                '0 2px 2px 0 rgba(0,0,0,0.14), 0 3px 1px -2px rgba(0,0,0,0.12), 0 1px 5px 0 rgba(0,0,0,0.20)',
            margin: theme.spacing(1),
        },
        wideColumn: {
            width: '67%',
        },
        narrowColumn: {
            width: '33%',
        },
    });

// Cf. https://material-ui.com/guides/typescript/#augmenting-your-props-using-withstyles
type Props = WithStyles<typeof styles>;

class CumulativeCharts extends React.Component<Props, unknown> {
    async renderCharts() {
        const sdk = new ChartsEmbedSDK({
            baseUrl: 'https://charts.mongodb.com/charts-covid19map-prod-dznzw',
        });

        const geospatialChart = sdk.createChart({
            chartId: '1249bb62-9e8c-45d7-a95f-99c665c78987',
            height: '400px',
        });
        const ageSexChart = sdk.createChart({
            chartId: '950710da-aae7-4461-a0eb-402b7c1cea7e',
            height: '400px',
        });
        const totalNumberCasesChart = sdk.createChart({
            chartId: 'd4bda56b-2baf-4602-89ee-845e4881b8b6',
            height: '200px',
        });
        const tabularCasesChart = sdk.createChart({
            chartId: 'f7aae225-f9f0-4cdd-8181-6c6fc11a090c',
            height: '400px',
        });
        const countBySexChart = sdk.createChart({
            chartId: 'ef5b9e34-e6f4-4f44-bf5f-5fea92971a0a',
            height: '200px',
        });
        const geospatialTravelHistoryChart = sdk.createChart({
            chartId: 'bc8fa65e-ff70-46ff-b607-8781de4c0b2d',
            height: '400px',
        });

        totalNumberCasesChart.render(
            document.getElementById('totalNumberCasesChart') as HTMLElement,
        );
        tabularCasesChart.render(
            document.getElementById('tabularCasesChart') as HTMLElement,
        );
        countBySexChart.render(
            document.getElementById('countBySexChart') as HTMLElement,
        );
        geospatialChart.render(
            document.getElementById('geospatialChart') as HTMLElement,
        );
        ageSexChart.render(
            document.getElementById('ageSexChart') as HTMLElement,
        );
        geospatialTravelHistoryChart.render(
            document.getElementById(
                'geospatialTravelHistoryChart',
            ) as HTMLElement,
        );
    }
    componentDidMount() {
        this.renderCharts();
    }
    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <div>
                <div className={classes.container}>
                    <div className={classes.wideColumn}>
                        <div
                            id="geospatialChart"
                            className={classes.chart}
                        ></div>
                        <div id="ageSexChart" className={classes.chart}></div>
                    </div>
                    <div className={classes.narrowColumn}>
                        <div
                            id="totalNumberCasesChart"
                            className={classes.chart}
                        ></div>
                        <div
                            id="tabularCasesChart"
                            className={classes.chart}
                        ></div>
                        <div
                            id="countBySexChart"
                            className={classes.chart}
                        ></div>
                    </div>
                </div>
                <div
                    id="geospatialTravelHistoryChart"
                    className={classes.chart}
                ></div>
            </div>
        );
    }
}
export default withStyles(styles, { withTheme: true })(CumulativeCharts);
