'use client';

import React, {useContext, useState} from 'react';

import {
    ArrowShapeTurnUpRight,
    ClockFill,
    Comment,
    Eye,
    FloppyDisk,
    LogoAcrobat,
    Magnifier,
    Person,
    SquareDashedCircle,
    ThumbsUp,
} from '@gravity-ui/icons';
import {
    Button,
    ButtonIcon,
    Table,
    TableActionConfig,
    TableDataItem,
    TextInput,
    useToaster,
    withTableActions,
    withTableCopy,
    withTableSelection,
    withTableSettings,
    withTableSorting,
} from '@gravity-ui/uikit';

import {AppEnvContext} from '../../contexts/AppEnv';
import {FetchRoutes2} from '../../utils/constants';
import {fetchGet, fetchPost} from '../../utils/fetchHelpers';

import styles from './InstagramContentFetcher.module.css';

interface InstagramPost {
    id: string;
    imageUrl: string;
    caption: string;
    views: number;
    comments: number;
    likes: number;
    date: string;
    shares?: number;
    saved?: number;
    reach?: number;
    total_interactions?: number;
}

interface InstagramUser {
    username: string;
    profileImage: string;
    fullName: string;
    bio: string;
    followers: number;
    following: number;
    posts: InstagramPost[];
}

// API response interfaces
interface ApiMediaItem {
    id: string;
    caption: string;
    media_type: string;
    media_url: string;
    permalink: string;
    thumbnail_url: string;
    timestamp: string;
    username: string;
    like_count: number;
    comments_count: number;
    shares?: number;
    comments?: number;
    likes?: number;
    saved?: number;
    total_interactions?: number;
    reach?: number;
    views?: number;
}

interface ApiUserInfo {
    username: string;
    biography: string;
    followers_count: number;
    follows_count: number;
    media_count: number;
    profile_picture_url: string;
    website?: string;
}

interface ApiResponse {
    account: string;
    ig_user_id: string;
    user_info: ApiUserInfo;
    media: ApiMediaItem[];
    paging?: {
        cursors: {
            before: string;
            after: string;
        };
        next: string;
    };
    error?: string;
}

// Create enhanced table with all HOCs
const EnhancedTable = withTableCopy(
    withTableActions(
        withTableSelection(
            withTableSorting(
                withTableSettings({
                    sortable: true,
                    filterable: true,
                })(Table),
            ),
        ),
    ),
);

const mockInstagramUser: InstagramUser = {
    username: 'carcar.kz',
    profileImage:
        'https://res.cloudinary.com/dlzlfasou/image/upload/v1736358073/avatar-40-01_ij9v7j.jpg',
    fullName: 'Travel Photography',
    bio: 'Capturing beautiful moments around the world ✈️ 📸',
    followers: 15400,
    following: 843,
    posts: [
        {
            id: '1',
            imageUrl:
                'https://res.cloudinary.com/dlzlfasou/image/upload/v1736358071/avatar-40-02_upqrxi.jpg',
            caption: 'Beautiful sunset in Bali #travel #photography',
            views: 12500,
            comments: 243,
            likes: 1843,
            date: '2023-06-15',
        },
        {
            id: '2',
            imageUrl:
                'https://res.cloudinary.com/dlzlfasou/image/upload/v1736358072/avatar-40-03_dkeufx.jpg',
            caption: 'Exploring the streets of Tokyo #japan #travel',
            views: 9800,
            comments: 156,
            likes: 1245,
            date: '2023-06-10',
        },
        {
            id: '3',
            imageUrl:
                'https://res.cloudinary.com/dlzlfasou/image/upload/v1736358070/avatar-40-05_cmz0mg.jpg',
            caption: 'Mountain views in Switzerland #alps #nature',
            views: 15600,
            comments: 312,
            likes: 2156,
            date: '2023-06-05',
        },
    ],
};

function InstagramContentFetcher() {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [userData, setUserData] = useState<InstagramUser | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [sortState, setSortState] = useState([{column: 'date', order: 'desc' as 'asc' | 'desc'}]);
    const [settings, setSettings] = useState<{id: string; isSelected: boolean}[]>([
        {id: 'image', isSelected: true},
        {id: 'caption', isSelected: true},
        {id: 'engagement', isSelected: true},
        {id: 'date', isSelected: true},
    ]);
    const {isProd} = useContext(AppEnvContext);
    const {add} = useToaster();

    const handleFetchContent = async () => {
        if (!username) {
            setError('Please enter an Instagram username');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = (await fetchGet({
                route: FetchRoutes2.getUserContent,
                query: {accountName: username.replace('@', '')},
                isProd,
            })) as ApiResponse;

            if (data.error) {
                setError(data.error as string);
            } else if (data && data.user_info) {
                // Transform API response to match our component's expected data structure
                setUserData({
                    username: data.user_info.username,
                    profileImage: data.user_info.profile_picture_url || '',
                    fullName: data.account || '',
                    bio: data.user_info.biography || '',
                    followers: data.user_info.followers_count || 0,
                    following: data.user_info.follows_count || 0,
                    posts:
                        data.media?.map((post) => ({
                            id: post.id,
                            imageUrl: post.thumbnail_url || post.media_url || '',
                            caption: post.caption || '',
                            views: post.views || 0,
                            comments: post.comments_count || 0,
                            likes: post.like_count || 0,
                            date: new Date(post.timestamp).toISOString().split('T')[0],
                            shares: post.shares,
                            saved: post.saved,
                            reach: post.reach,
                            total_interactions: post.total_interactions,
                        })) || [],
                });
            } else {
                setError('No data returned from the server');
            }
        } catch (err) {
            setError(`Error fetching data: ${err.message || 'Unknown error'}`);
            // Fallback to mock data for demo purposes if using the demo account
            if (username.toLowerCase() === 'carcar.kz' || username.toLowerCase() === '@carcar.kz') {
                setUserData(mockInstagramUser);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    };

    // Table configuration
    const columns = [
        {
            id: 'image',
            name: 'Image',
            template: (post: InstagramPost) => (
                <img
                    src={post.imageUrl}
                    alt={post.caption}
                    className={styles.postImage}
                    style={{width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px'}}
                />
            ),
            meta: {
                copy: false,
                sort: false,
                selectedByDefault: true,
            },
        },
        {
            id: 'caption',
            name: 'Caption',
            template: (post: InstagramPost) => <div className={styles.caption}>{post.caption}</div>,
            meta: {
                copy: true,
                sort: true,
                selectedByDefault: true,
            },
        },
        {
            id: 'engagement',
            name: 'Engagement',
            template: (post: InstagramPost) => (
                <div className={styles.statsContainer}>
                    <div className={styles.statsGroup}>
                        <div className={styles.statsRow}>
                            <div className={styles.statItem} title="Views">
                                <Eye /> {formatNumber(post.views)}
                            </div>
                            <div className={styles.statItem} title="Comments">
                                <Comment /> {formatNumber(post.comments)}
                            </div>
                            <div className={styles.statItem} title="Likes">
                                <ThumbsUp /> {formatNumber(post.likes)}
                            </div>
                        </div>

                        <div className={styles.statsRow}>
                            {post.shares !== undefined && (
                                <div className={styles.statItem} title="Shares">
                                    <ArrowShapeTurnUpRight /> {formatNumber(post.shares)}
                                </div>
                            )}
                            {post.saved !== undefined && (
                                <div className={styles.statItem} title="Saved">
                                    <FloppyDisk /> {formatNumber(post.saved)}
                                </div>
                            )}
                            {post.reach !== undefined && (
                                <div className={styles.statItem} title="Reach">
                                    <Person /> {formatNumber(post.reach)}
                                </div>
                            )}
                            {post.total_interactions !== undefined && (
                                <div className={styles.statItem} title="Total Interactions">
                                    <LogoAcrobat /> {formatNumber(post.total_interactions)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ),
            meta: {
                copy: (post: InstagramPost) => {
                    const metrics = [
                        `Views: ${post.views}`,
                        `Comments: ${post.comments}`,
                        `Likes: ${post.likes}`,
                    ];

                    if (post.shares !== undefined) metrics.push(`Shares: ${post.shares}`);
                    if (post.saved !== undefined) metrics.push(`Saved: ${post.saved}`);
                    if (post.reach !== undefined) metrics.push(`Reach: ${post.reach}`);
                    if (post.total_interactions !== undefined)
                        metrics.push(`Total: ${post.total_interactions}`);

                    return metrics.join(', ');
                },
                sort: false,
                selectedByDefault: true,
            },
        },
        {
            id: 'date',
            name: 'Date',
            template: (post: InstagramPost) => post.date,
            meta: {
                copy: true,
                sort: true,
                defaultSortOrder: 'desc',
                selectedByDefault: true,
            },
        },
    ];

    // Row action handlers
    const getRowActions = (
        item: TableDataItem,
        _index: number,
    ): TableActionConfig<TableDataItem>[] => {
        const post = item as InstagramPost;
        return [
            {
                text: 'Send to Telegram for further analysis',
                handler: async () => {
                    try {
                        const response = await fetchPost({
                            route: FetchRoutes2.savePostForAnalysis,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            body: {post} as any,
                            isProd,
                        });

                        add({
                            title: response.message,
                            name: 'success',
                            theme: response.status === 'success' ? 'success' : 'danger',
                        });
                    } catch (errorCatch: unknown) {
                        // eslint-disable-next-line no-console
                        console.error('Error sending post to Telegram:', errorCatch);

                        add({
                            title: `Failed to send post to Telegram: ${errorCatch}`,
                            name: 'success',
                            theme: 'danger',
                        });
                    }
                },
            },
        ];
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <SquareDashedCircle style={{color: '#e91e63'}} width={32} height={32} />
                <h1 className={styles.headerTitle}>Instagram Content Fetcher</h1>
            </div>

            <div className={styles.searchContainer}>
                <div className={styles.inputWrapper}>
                    <TextInput
                        type="text"
                        placeholder="Enter Instagram username (e.g. carcar.kz)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className={styles.input}
                        size="xl"
                    />
                    <SquareDashedCircle className={styles.inputIcon} width={24} height={24} />
                </div>
                <Button
                    view="action"
                    onClick={handleFetchContent}
                    disabled={isLoading}
                    className={styles.button}
                    size="xl"
                >
                    <ButtonIcon>
                        {isLoading ? <ClockFill className="animate-spin" /> : <Magnifier />}
                    </ButtonIcon>
                    {isLoading ? <>Loading</> : <>Fetch</>}
                </Button>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {userData && (
                <EnhancedTable
                    data={userData.posts}
                    columns={columns}
                    getRowId={(post) => post.id}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    getRowActions={getRowActions}
                    sortState={sortState}
                    onSortStateChange={setSortState}
                    settings={settings}
                    updateSettings={(newSettings) => {
                        setSettings(newSettings as {id: string; isSelected: boolean}[]);
                        return Promise.resolve();
                    }}
                    verticalAlign="middle"
                    edgePadding
                    emptyMessage="No posts available"
                />
            )}

            <div className={styles.demoHint}>Try username: &quot;carcar.kz&quot; for demo</div>
        </div>
    );
}

export default InstagramContentFetcher;
