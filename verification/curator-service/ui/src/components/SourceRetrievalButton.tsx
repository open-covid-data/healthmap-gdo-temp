import React, { useState } from 'react';
import { Button, CircularProgress } from '@material-ui/core';
import CloudDownloadIcon from '@material-ui/icons/CloudDownloadOutlined';
import MuiAlert from '@material-ui/lab/Alert';

import axios from 'axios';

interface RetrievalResult {
    jobName: string;
}

/**
 * SourceRetrievalButton is a button that when clicked triggers a fetch of the
 * content of a given source identified by its ID.
 * When successful, the Batch job name displays alongside it.
 * Retrieval happens after Batch service responds with a job name.
 */
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
                data-testid={`trigger-retrieval-btn-${props.sourceId}`}
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
                            setError(e.response?.data?.message || e.toString());
                        })
                        .finally(() => {
                            setRetrieving(false);
                        });
                }}
                disabled={retrieving}
            >
                {retrieving ? 'Retrieving...' : 'Trigger retrieval'}
            </Button>
            {result && <div>JobName: {result?.jobName}</div>}
            {error && <MuiAlert severity="error">{error}</MuiAlert>}
        </>
    );
}
