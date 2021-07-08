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
        wideColumn: {
            width: '67%',
        },
        narrowColumn: {
            width: '33%',
        },
    });

// Cf. https://material-ui.com/guides/typescript/#augmenting-your-props-using-withstyles
type Props = WithStyles<typeof styles>;

class FreshnessCharts extends React.Component<Props, unknown> {
    async renderCharts() {
        const sdk = new ChartsEmbedSDK({
            baseUrl: 'https://charts.mongodb.com/charts-covid19map-prod-dznzw',
        });

        const geospatialChart = sdk.createChart({
            chartId: 'f614a4a3-06c1-4036-855b-22d63584c0e2',
            height: '600px',
        });
        const tabularChart = sdk.createChart({
            chartId: 'f488d2f2-244a-46e1-9eb7-47126786e8fe',
            height: '600px',
        });

        geospatialChart.render(
            document.getElementById('geospatialChart') as HTMLElement,
        );
        tabularChart.render(
            document.getElementById('tabularChart') as HTMLElement,
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
                    </div>
                    <div className={classes.narrowColumn}>
                        <div id="tabularChart" className={classes.chart}></div>
                    </div>
                </div>
            </div>
        );
    }
}
export default withStyles(styles, { withTheme: true })(FreshnessCharts);
