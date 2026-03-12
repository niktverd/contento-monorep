export interface MediaItem {
    id: string;
    media_url?: string;
    thumbnail_url?: string;
    caption?: string;
    media_type?: string;
    likes?: number;
    like_count?: number;
    comments_count?: number;
    reach?: number;
    favorite?: boolean;
    timestamp?: string;
    // Insights fields
    impressions?: number;
    engagement_rate?: number;
    video_views?: number;
    average_watch_time?: number;
    // Stories-specific
    exits?: number;
    replies?: number;
    link_clicks?: number;
    // Insights object for more detailed analytics
    insights?: MediaInsights;
}

export interface InstagramProfile {
    id?: string;
    username?: string;
    profile_picture?: string;
    full_name?: string;
}

export interface InstagramUser {
    username: string;
    biography: string;
    followers_count: number;
    follows_count: number;
    media_count: number;
    profile_picture_url: string;
    website: string;
}

export interface Paging {
    cursors?: {
        before?: string;
        after?: string;
    };
    next?: string;
    previous?: string;
}

export interface InsightsPeriod {
    start: string; // ISO date
    end: string; // ISO date
}

export interface InsightsData {
    metric: string;
    value: number;
    period?: InsightsPeriod;
}

export interface MediaInsights {
    mediaId: string;
    metrics: InsightsData[];
}

export interface AccountInsights {
    accountId: string;
    metrics: InsightsData[];
}

export interface CommentReply {
    id: string;
    text: string;
    created_time: string;
    user: string;
}

// [{"media_id":"18049814108356569","comments":[{"id":"18404540827104626","text":"test comment"}]},{"media_id":"18064647518290526","comments":[{"id":"18063556040015598","text":"👏👏👏"}]},{"media_id":"18011291534727428","comments":[]},{"media_id":"18321775345207165","comments":[]},{"media_id":"18124292521428073","comments":[]},{"media_id":"17883049527251786","comments":[]},{"media_id":"18058683844891427","comments":[]},{"media_id":"18058089401027341","comments":[]},{"media_id":"18069764911858282","comments":[]},{"media_id":"18060059764844066","comments":[]},{"media_id":"18041954429384396","comments":[]},{"media_id":"18067312522907713","comments":[]},{"media_id":"18051745511185985","comments":[]},{"media_id":"18061898774066502","comments":[]},{"media_id":"18042148058596127","comments":[]},{"media_id":"18012368807513027","comments":[]},{"media_id":"17991955412789075","comments":[]},{"media_id":"18064873729760459","comments":[]},{"media_id":"17924610002934713","comments":[]},{"media_id":"18036161399627590","comments":[]},{"media_id":"17962712081894754","comments":[]},{"media_id":"18052088251977580","comments":[]},{"media_id":"18100737361504694","comments":[]},{"media_id":"18061015844500485","comments":[]},{"media_id":"17970453788833237","comments":[]}]
export interface Comment {
    media_id: string;
    comments: {
        id: string;
        text: string;
    }[];
}

export interface CommentsPaging {
    cursors?: {
        before?: string;
        after?: string;
    };
    next?: string;
    previous?: string;
}

export interface DirectMessage {
    id: string;
    thread_id: string;
    sender: string;
    recipient: string;
    text: string;
    created_time: string;
    read?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attachments?: any[];
}

export interface InstagramContent {
    account: string;
    ig_user_id: string;
    user_info: InstagramUser;
    media: MediaItem[];
    paging: Paging;
    // Новое:
    insights?: AccountInsights;
    comments?: Comment[];
    commentsPaging?: CommentsPaging;
}
