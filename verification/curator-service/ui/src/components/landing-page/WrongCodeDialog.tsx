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
    onClose: () => void;
}

export default function WrongCodeDialog({
    isOpen,
    setIsOpen,
    onClose,
}: Props): JSX.Element {
    return (
        <Dialog open={isOpen}>
            <DialogTitle>
                You entered wrong verification code too many times.
            </DialogTitle>
            <DialogContent>
                <DialogContentText>Please try again.</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => {
                        setIsOpen(false);
                        onClose();
                    }}
                    color="primary"
                    autoFocus
                >
                    Ok
                </Button>
            </DialogActions>
        </Dialog>
    );
}
