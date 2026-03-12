import React, {useCallback, useContext, useEffect, useState} from 'react';

import {Pin} from '@gravity-ui/icons';
import {Button, Modal, TextInput, useToaster} from '@gravity-ui/uikit';
import {useNavigate, useParams} from 'react-router-dom';

import {CardConfig, CardTemplate} from '../../components/CardTemplate/CardTemplate';
import {AppEnvContext} from '../../contexts/AppEnv';
import {IScenario} from '../../sharedTypes';
import {fetchRoutes} from '../../sharedTypes/schemas/fetchRoutes';
import {fetchDelete, fetchGet} from '../../utils/fetchHelpers';

import cn from './Scenarios.module.css';

export const Overview: React.FC = () => {
    const {id} = useParams<{id: string}>();
    const [scenario, setScenario] = useState<IScenario | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showJson, setShowJson] = useState(false);
    const {add} = useToaster();
    const {isProd} = useContext(AppEnvContext);
    const navigate = useNavigate();

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteSlug, setDeleteSlug] = useState('');
    const [deleteError, setDeleteError] = useState('');

    const loadScenario = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const json = await fetchGet({
                route: fetchRoutes.scenarios.get,
                query: {id},
                isProd,
            });
            setScenario(json as IScenario);
        } catch {
            setError('Failed to load scenario');
        } finally {
            setLoading(false);
        }
    }, [id, isProd]);

    useEffect(() => {
        if (id) loadScenario();
    }, [id, loadScenario]);

    const handleDelete = useCallback(async () => {
        if (!id) return;
        await fetchDelete({
            route: fetchRoutes.scenarios.delete,
            query: {id},
            isProd,
        });
        add({
            name: Math.random() + '-delete-scenario',
            title: 'Scenario deleted successfully',
            theme: 'success',
        });
        navigate('/scenario');
    }, [id, isProd, add, navigate]);

    const handleOpenDeleteModal = useCallback(() => {
        setDeleteModalOpen(true);
        setDeleteSlug('');
        setDeleteError('');
    }, []);

    const handleConfirmDelete = async () => {
        if (deleteSlug !== scenario?.slug) {
            setDeleteError('Slug does not match. Please enter the correct slug to confirm.');
            return;
        }
        setDeleteError('');
        setDeleteModalOpen(false);
        await handleDelete();
    };

    if (loading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>{error}</div>;
    }
    if (!scenario) {
        return <div>Not found</div>;
    }

    const {slug, instagramLocations = []} = scenario;

    const config: CardConfig[] = [
        {
            title: 'Scenario Info',
            description: 'Below are the scenario details',
            actions: [],
            colSpan: 1 as const,
            children: (
                <div>
                    <p>{id}</p>
                    <p>{slug}</p>
                </div>
            ),
        },
        {
            title: 'Edit',
            description: 'Edit this scenario',
            colSpan: 1 as const,
            actions: [
                {
                    text: 'Edit',
                    link: `/scenario/${id}/edit`,
                },
            ],
        },
        {
            title: 'Prepared Videos',
            description: 'Click button to see prepared videos',
            colSpan: 1 as const,
            actions: [
                {
                    text: 'See Prepared Videos',
                    link: `/prepared-videos?scenarioIds=${id}`,
                },
            ],
        },
        {
            title: 'Instagram Locations',
            description: 'Locations linked to this scenario',
            icon: <Pin />,
            actions:
                instagramLocations?.map((location) => ({
                    text: `${location.name || location.externalId || location.id}`,
                    link: `/instagram-locations/${location.id}`,
                })) || [],
            colSpan: 1 as const,
        },
        {
            title: 'Delete',
            description: 'Delete this scenario',
            colSpan: 1 as const,
            actions: [
                {
                    text: 'Delete',
                    onClick: handleOpenDeleteModal,
                    view: 'outlined-danger' as const,
                },
            ],
        },
        {
            title: 'Texts',
            description: 'Below are the texts for this scenario',
            actions: [
                {
                    text: 'Edit',
                    link: `/scenario/${id}/edit`,
                },
            ],
            colSpan: 3 as const,
            children: (
                <div className={cn.texts}>
                    <div>
                        <h3>link_to_another_account</h3>
                        <div className={cn.text}>
                            {scenario.texts?.link_to_another_account?.map((text) => (
                                <div className={cn.textItem} key={text}>
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3>intro</h3>
                        <div className={cn.text}>
                            {scenario.texts?.intro?.map((text) => (
                                <div className={cn.textItem} key={text}>
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3>main</h3>
                        <div className={cn.text}>
                            {scenario.texts?.main?.map((text) => (
                                <div className={cn.textItem} key={text}>
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3>outro</h3>
                        <div className={cn.text}>
                            {scenario.texts?.outro?.map((text) => (
                                <div className={cn.textItem} key={text}>
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'JSON',
            description: 'Show entire scenario data in JSON format',
            colSpan: 3 as const,
            actions: [
                {
                    text: showJson ? 'Hide JSON' : 'Show JSON',
                    onClick: () => setShowJson(!showJson),
                    view: 'outlined' as const,
                },
            ],
            children: showJson ? <pre>{JSON.stringify(scenario, null, 2)}</pre> : null,
        },
    ];

    return (
        <div className={cn.container}>
            <div className={cn.headerRow}>
                <h1>{slug}</h1>
            </div>
            <div className={cn.cardsContainer}>
                {config.map((cfg) => (
                    <CardTemplate key={cfg.title} {...cfg} />
                ))}
            </div>
            <Modal
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                contentClassName={cn.modal}
                aria-labelledby="delete-scenario-title"
            >
                <div style={{maxWidth: 400, padding: 10}}>
                    <h3 id="delete-scenario-title">Delete Scenario</h3>
                    <p>
                        To confirm deletion, enter the scenario slug:
                        <span style={{fontWeight: 'bold', color: '#d71'}}> {scenario.slug}</span>
                    </p>
                    <TextInput
                        value={deleteSlug}
                        onChange={(e) => setDeleteSlug(e.target.value)}
                        placeholder="Enter scenario slug to confirm"
                        error={Boolean(deleteError)}
                        style={{width: '100%', marginBottom: 12}}
                        autoFocus
                    />
                    {deleteError && (
                        <div style={{color: '#d71', marginBottom: 12}}>{deleteError}</div>
                    )}
                    <div style={{display: 'flex', justifyContent: 'flex-end', gap: 12}}>
                        <Button view="flat" onClick={() => setDeleteModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            view="outlined-danger"
                            onClick={handleConfirmDelete}
                            disabled={deleteSlug !== scenario.slug}
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
