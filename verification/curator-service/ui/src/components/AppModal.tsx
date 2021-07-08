import {
    AppBar,
    IconButton,
    Modal,
    Toolbar,
    Typography,
} from '@material-ui/core';
import React, { ReactNode } from 'react';
import { Theme, createStyles } from '@material-ui/core/styles';

import CloseIcon from '@material-ui/icons/Close';
import { WithStyles } from '@material-ui/core/styles/withStyles';
import { withStyles } from '@material-ui/core';

const styles = (theme: Theme) =>
    createStyles({
        modalContents: {
            backgroundColor: theme.palette.background.default,
            left: '15%',
            height: '100%',
            position: 'absolute',
            outline: 'none',
            // Remainder of the screen width accounting for left shift
            width: 'calc(100vw - 15%)',
        },
        container: {
            height: 'calc(100% - 64px)',
            overflow: 'auto',
            padding: '1em',
        },
        appBarContents: {
            color: 'black',
        },
    });

interface Props extends WithStyles<typeof styles> {
    children: ReactNode;
    title: string;
    onModalClose?: () => void;
}

class AppModal extends React.Component<Props, unknown> {
    render(): JSX.Element {
        const { classes } = this.props;
        return (
            <>
                <Modal open={true}>
                    <div className={classes.modalContents}>
                        <AppBar elevation={0} position="relative">
                            <Toolbar>
                                <IconButton
                                    classes={{ root: classes.appBarContents }}
                                    aria-label="close overlay"
                                    onClick={this.props.onModalClose}
                                    edge="start"
                                >
                                    <CloseIcon />
                                </IconButton>
                                <Typography
                                    classes={{ root: classes.appBarContents }}
                                    variant="h6"
                                    noWrap
                                >
                                    {this.props.title}
                                </Typography>
                            </Toolbar>
                        </AppBar>
                        {/* scroll-container id needed for scrolling in CaseForm */}
                        <div
                            className={classes.container}
                            id="scroll-container"
                        >
                            {this.props.children}
                        </div>
                    </div>
                </Modal>
            </>
        );
    }
}

export default withStyles(styles)(AppModal);
