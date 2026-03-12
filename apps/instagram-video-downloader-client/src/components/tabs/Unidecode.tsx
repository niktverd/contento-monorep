/* eslint-disable import/no-extraneous-dependencies */
import React, {useEffect, useState} from 'react';

import unidecode from 'unidecode';

export const UniDecode = () => {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [outputText2, setOutputText2] = useState('');

    useEffect(() => {
        const translit = unidecode(inputText);
        setOutputText(translit);
        const rows = translit.split('\n');
        const instagramable = rows.map((row) => row.toLowerCase().replace(/[^a-z0-9\\n]/g, '_'));
        setOutputText2(unidecode(instagramable.join('\n')));
    }, [inputText]);

    return (
        <div>
            <textarea value={inputText} onChange={(event) => setInputText(event.target.value)} />
            <textarea value={outputText} />
            <textarea value={outputText2} />
        </div>
    );
};
