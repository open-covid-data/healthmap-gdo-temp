import React from 'react';
import {
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
} from '@material-ui/core';

interface Props {
    isOpen: boolean;
    setIsOpen: (value: boolean) => void;
}

export default function ErrorDialog({ isOpen, setIsOpen }: Props): JSX.Element {
    return (
        <Dialog open={isOpen}>
            <DialogTitle>Error</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    There was an error, please try again later.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => setIsOpen(false)}
                    color="primary"
                    autoFocus
                >
                    Ok
                </Button>
            </DialogActions>
        </Dialog>
    );
}
