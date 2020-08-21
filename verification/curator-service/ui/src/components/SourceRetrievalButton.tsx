import React, { useState } from 'react';
import { Button, CircularProgress } from '@material-ui/core';
import CloudDownloadIcon from '@material-ui/icons/CloudDownloadOutlined';
import MuiAlert from '@material-ui/lab/Alert';

import axios from 'axios';

interface RetrievalResult {
    bucket: string;
    key: string;
}

export default function SourceRetrievalButton(props: {
    sourceId: string;
}): JSX.Element {
    const [retrieving, setRetrieving] = useState(false);
    const [result, setResult] = useState<RetrievalResult | undefined>();
    const [error, setError] = useState('');
    return (
        <>
            <Button
                variant="outlined"
                data-testid="trigger-retrieval-btn"
                startIcon={
                    retrieving ? (
                        <CircularProgress size="1em" />
                    ) : (
                        <CloudDownloadIcon />
                    )
                }
                onClick={() => {
                    setRetrieving(true);
                    axios
                        .post<RetrievalResult>(
                            `/api/sources/${props.sourceId}/retrieve`,
                        )
                        .then((resp) => {
                            setResult(resp.data);
                        })
                        .catch((e) => {
                            setResult(undefined);
                            setError(e.message);
                        })
                        .finally(() => {
                            setRetrieving(false);
                        });
                }}
                disabled={retrieving}
            >
                {retrieving ? 'Retrieving...' : 'Trigger retrieval'}
            </Button>
            {result && (
                <div>
                    Key: {result?.key}
                    <br />
                    Bucket: {result?.bucket}
                </div>
            )}
            {error && <MuiAlert severity="error">{error}</MuiAlert>}
        </>
    );
}
