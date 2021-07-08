import { Theme, makeStyles } from '@material-ui/core/styles';

import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';
import CompletenessCharts from './CompletenessCharts';
import CumulativeCharts from './CumulativeCharts';
import FreshnessCharts from './FreshnessCharts';
import React from 'react';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && <Box>{children}</Box>}
        </div>
    );
}

function a11yProps(index: number) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const useStyles = makeStyles((theme: Theme) => ({
    appBar: {
        backgroundColor: theme.custom.palette.appBar.backgroundColor,
    },
}));

export default function Charts(): JSX.Element {
    const classes = useStyles();
    const [value, setValue] = React.useState(0);

    const handleChange = (
        event: React.ChangeEvent<unknown>,
        newValue: number,
    ) => {
        setValue(newValue);
    };

    return (
        <>
            <AppBar
                position="static"
                elevation={0}
                classes={{ colorPrimary: classes.appBar }}
            >
                <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="simple tabs example"
                >
                    <Tab label="Cumulative" {...a11yProps(0)} />
                    <Tab label="Completeness" {...a11yProps(1)} />
                    <Tab label="Freshness" {...a11yProps(2)} />
                </Tabs>
            </AppBar>
            <TabPanel value={value} index={0}>
                <CumulativeCharts />
            </TabPanel>
            <TabPanel value={value} index={1}>
                <CompletenessCharts />
            </TabPanel>
            <TabPanel value={value} index={2}>
                <FreshnessCharts />
            </TabPanel>
        </>
    );
}
