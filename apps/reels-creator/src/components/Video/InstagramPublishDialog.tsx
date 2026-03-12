import React from 'react';

import type {VideoType} from '../../types/video';

import styles from './InstagramPublishDialog.module.css';

type InstagramPublishDialogProps = {
    video: VideoType;
    onPublish: (caption: string) => void;
    onCancel: () => void;
    isPublishing: boolean;
};

export const InstagramPublishDialog = ({
    video,
    onPublish,
    onCancel,
    isPublishing,
}: InstagramPublishDialogProps) => {
    const [caption, setCaption] = React.useState(video.name || 'Check out my new video!');
    const [isApproved, setIsApproved] = React.useState(false);

    const handlePublish = () => {
        if (!isApproved) return;
        onPublish(caption);
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.dialog}>
                <h2 className={styles.title}>Publish to Instagram</h2>

                <div className={styles.content}>
                    <div className={styles.videoPreview}>
                        <video
                            width="100%"
                            height="100%"
                            controls={true}
                            src={video.url}
                            loop={true}
                        >
                            <track kind="captions" label={video.name} src={video.url} />
                        </video>
                    </div>

                    <div className={styles.formSection}>
                        <label className={styles.label}>
                            Caption
                            <textarea
                                className={styles.captionInput}
                                value={caption}
                                onChange={(e) => setCaption(e.target.value)}
                                placeholder="Add a caption to your post"
                                rows={4}
                            />
                        </label>

                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                checked={isApproved}
                                onChange={(e) => setIsApproved(e.target.checked)}
                            />
                            I approve the publishing of this content to Instagram and confirm I have
                            the rights to share this video.
                        </label>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button
                        className={styles.cancelButton}
                        onClick={onCancel}
                        disabled={isPublishing}
                    >
                        Cancel
                    </button>
                    <button
                        className={styles.publishButton}
                        onClick={handlePublish}
                        disabled={isPublishing || !isApproved}
                    >
                        {isPublishing ? 'Publishing...' : 'Publish'}
                    </button>
                </div>
            </div>
        </div>
    );
};
