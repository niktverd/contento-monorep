import React from 'react';

import {Navigation} from '../../src/navigation';

import styles from '../../styles/DefaultCrop.module.css';

const Demo = () => {
    const [creators, setCreators] = React.useState([]);

    const loadCreators = React.useCallback(() => {
        const load = async () => {
            const response = await fetch('/api/admin/moderate');
            const json = await response.json();
            setCreators(json.data);
        };

        load();
    }, []);

    return (
        <Navigation>
            <div className={styles.container}>
                <div>
                    <button onClick={loadCreators}>load</button>
                </div>
                <div>
                    <pre>{JSON.stringify(creators, null, 5)}</pre>
                </div>
            </div>
        </Navigation>
    );
};

export default Demo;
