import React, {useContext, useState} from 'react';

import {Button, TextInput} from '@gravity-ui/uikit';

import {AppEnvContext} from '../../contexts/AppEnv';
import {FetchRoutes2} from '../../utils/constants';
import {fetchGet} from '../../utils/fetchHelpers';

export const PushToPubSub: React.FC = () => {
    const [accountId, setAccountId] = useState('');
    const [scenarioId, setScenarioId] = useState('');
    const [sourceId, setSourceId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const {isProd} = useContext(AppEnvContext);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const response = await fetchGet({
                route: FetchRoutes2.pubsubPushTest,
                query: {
                    accountId,
                    scenarioId,
                    sourceId,
                },
                isProd,
            });

            setResult(JSON.stringify(response, null, 2));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h3>Push Message to PubSub</h3>
            <form onSubmit={handleSubmit}>
                <div style={{marginBottom: '16px'}}>
                    <TextInput
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        placeholder="Account ID"
                        label="Account ID"
                    />
                </div>
                <div style={{marginBottom: '16px'}}>
                    <TextInput
                        value={scenarioId}
                        onChange={(e) => setScenarioId(e.target.value)}
                        placeholder="Scenario ID"
                        label="Scenario ID"
                    />
                </div>
                <div style={{marginBottom: '16px'}}>
                    <TextInput
                        value={sourceId}
                        onChange={(e) => setSourceId(e.target.value)}
                        placeholder="Source ID"
                        label="Source ID"
                    />
                </div>
                <Button view="action" type="submit" loading={loading} disabled={loading}>
                    Push Message
                </Button>
            </form>

            {result && (
                <div style={{marginTop: '20px'}}>
                    <h4>Response:</h4>
                    <pre
                        style={{
                            backgroundColor: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '4px',
                            overflow: 'auto',
                        }}
                    >
                        {result}
                    </pre>
                </div>
            )}

            {error && (
                <div
                    style={{
                        marginTop: '20px',
                        color: 'red',
                        backgroundColor: '#fff0f0',
                        padding: '10px',
                        borderRadius: '4px',
                    }}
                >
                    <h4>Error:</h4>
                    <p>{error}</p>
                </div>
            )}
        </div>
    );
};
