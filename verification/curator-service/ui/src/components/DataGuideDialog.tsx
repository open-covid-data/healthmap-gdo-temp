import React, { useEffect } from 'react';
import {
    Box,
    createStyles,
    Portal,
    Theme,
    Typography,
    withStyles,
    WithStyles,
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import Draggable, { ControlPosition } from 'react-draggable';

type Props = WithStyles<typeof styles> & {
    rootComponentRef: React.RefObject<HTMLDivElement>;
    triggerComponentRef: React.RefObject<HTMLButtonElement>;
    isOpen: boolean;
    onToggle: () => void;
};

// Return type isn't meaningful.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const styles = (theme: Theme) =>
    createStyles({
        root: {
            maxWidth: 520,
            backgroundColor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            cursor: 'move',
            position: 'absolute',
            zIndex: 1500,
            borderRadius: 5,
            padding: theme.spacing(4),
        },
        closeIcon: {
            width: 30,
            height: 30,
            cursor: 'pointer',
        },
        title: {
            fontSize: 22,
            fontWeight: 'bold',
        },
        subtitle: {
            fontSize: 18,
            fontWeight: 'bold',
        },
        list: {
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            padding: 0,
            fontSize: 16,

            '& > li': {
                flex: '0 0 33.3333%',
                listStyleType: 'none',
            },
        },
        textSection: {
            marginBottom: '1rem',
        },
    });

// additional offsets to keep the position ideally below the data guide button
const LEFT_OFFSET = -16;
const TOP_OFFSET = 6;

const SearchGuideDialog = ({
    rootComponentRef,
    triggerComponentRef,
    isOpen,
    onToggle,
    classes,
}: Props): JSX.Element | null => {
    const [positionOffset, setPositionOffset] =
        React.useState<ControlPosition | null>(null);
    const nodeRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = triggerComponentRef.current;

        if (container) {
            const { left, bottom } = container.getBoundingClientRect();
            setPositionOffset({
                x: left + LEFT_OFFSET,
                y: bottom + TOP_OFFSET,
            });
        }
    }, [triggerComponentRef]);

    if (!isOpen || !positionOffset) {
        return null;
    }

    return (
        <Portal container={rootComponentRef.current}>
            <Draggable
                handle="#draggable-search-guide"
                bounds="body"
                defaultPosition={positionOffset}
                nodeRef={nodeRef}
            >
                <div
                    ref={nodeRef}
                    className={classes.root}
                    id="draggable-search-guide"
                >
                    <Box position="relative">
                        <Box position="absolute" top={0} right={0}>
                            <CloseIcon
                                className={classes.closeIcon}
                                onClick={onToggle}
                                data-testid="close-search-guide-button"
                            />
                        </Box>
                        <Box mb={1}>
                            <Typography className={classes.title}>
                                Welcome to Global.health Data!
                            </Typography>
                        </Box>
                        <Typography className={classes.textSection}>
                            You can explore our line-list dataset by{' '}
                            <strong>filtering</strong>, <strong>sorting</strong>
                            , or <strong>searching</strong>.
                        </Typography>
                        <Typography className={classes.textSection}>
                            <strong>To filter</strong>, click the "Filter"
                            button or a column header and enter parameters for
                            any of the available fields.
                        </Typography>
                        <Typography className={classes.textSection}>
                            <strong>To sort</strong>, use the dropdown menu on
                            the left and choose ascending or descending.
                        </Typography>
                        <Typography className={classes.textSection}>
                            <strong>For full-text search</strong>, enter any
                            combination of search terms.
                        </Typography>
                        <Typography>
                            You can use the icons on the right to navigate
                            results and click on any individual record to see
                            more detailed case information.
                        </Typography>
                    </Box>
                </div>
            </Draggable>
        </Portal>
    );
};

export default withStyles(styles, { withTheme: true })(SearchGuideDialog);
