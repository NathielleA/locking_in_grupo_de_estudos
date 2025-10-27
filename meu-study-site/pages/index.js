const [backgroundUrl, setBackgroundUrl] = useState('/backgrounds/pixel-art-1.png');

return (
    <div
        style={{
            backgroundImage: `url(${backgroundUrl})`,
            backgroundSize: 'cover'
        }}
    >
        {/* ...outros componentes... */}
        <BackgroundUploader onBackgroundChange={setBackgroundUrl} />
    </div>
); import React, { useState } from 'react';
import PomodoroTimer from '../components/PomodoroTimer';
import TodoList from '../components/TodoList';
import MusicPlayer from '../components/MusicPlayer';
import BackgroundUploader from '../components/BackgroundUploader';