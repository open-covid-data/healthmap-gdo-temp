import React from 'react';
import ChartsEmbedSDK from '@mongodb-js/charts-embed-dom';
import { Theme, WithStyles, createStyles, withStyles } from '@material-ui/core';

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
        column: {
            width: '50%',
        },
    });

// Cf. https://material-ui.com/guides/typescript/#augmenting-your-props-using-withstyles
type Props = WithStyles<typeof styles>;

class CompletenessCharts extends React.Component<Props, unknown> {
    async renderCharts() {
        const sdk = new ChartsEmbedSDK({
            baseUrl: 'https://charts.mongodb.com/charts-covid19map-prod-dznzw',
        });

        const tabularChart = sdk.createChart({
            chartId: '603c81d1-ee09-4d11-aaae-d9670f886447',
            height: '500px',
        });
        const geospatialChart = sdk.createChart({
            chartId: '5e2476f3-e263-4a69-9892-8357ff5bbe7a',
            height: '500px',
        });
        const fieldCompletenessByCountryChart = sdk.createChart({
            chartId: 'c3004868-a432-438d-9dd4-79130c8e61ba',
            height: '500px',
        });
        const fieldCompletenessByConfirmationChart = sdk.createChart({
            chartId: '23d59dcf-5c84-426d-a5af-99c79f473364',
            height: '500px',
        });

        tabularChart.render(
            document.getElementById('tabularChart') as HTMLElement,
        );
        geospatialChart.render(
            document.getElementById('geospatialChart') as HTMLElement,
        );
        fieldCompletenessByCountryChart.render(
            document.getElementById(
                'fieldCompletenessByCountryChart',
            ) as HTMLElement,
        );
        fieldCompletenessByConfirmationChart.render(
            document.getElementById(
                'fieldCompletenessByConfirmationChart',
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
                    <div className={classes.column}>
                        <div id="tabularChart" className={classes.chart}></div>
                        <div
                            id="geospatialChart"
                            className={classes.chart}
                        ></div>
                    </div>
                    <div className={classes.column}>
                        <div
                            id="fieldCompletenessByCountryChart"
                            className={classes.chart}
                        ></div>
                        <div
                            id="fieldCompletenessByConfirmationChart"
                            className={classes.chart}
                        ></div>
                    </div>
                </div>
            </div>
        );
    }
}
export default withStyles(styles, { withTheme: true })(CompletenessCharts);
