"use client";
import { useState, useEffect } from 'react';

// Tipos de timer (em segundos)
const timers = {
    '25/5': { study: 25 * 60, break: 5 * 60 },
    '30/5': { study: 30 * 60, break: 5 * 60 },
    '30/10': { study: 30 * 60, break: 10 * 60 },
    '50/10': { study: 50 * 60, break: 10 * 60 },
};

export default function PomodoroTimer({ onBreakChange }) {
    const [mode, setMode] = useState('study'); // 'study' ou 'break'
    const [timerType, setTimerType] = useState('25/5');
    const [timeLeft, setTimeLeft] = useState(timers[timerType].study);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        // Notifica o componente pai se estamos em pausa ou não
        onBreakChange(mode === 'break');
    }, [mode, onBreakChange]);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            // Troca o modo
            const newMode = mode === 'study' ? 'break' : 'study';
            setMode(newMode);
            setTimeLeft(timers[timerType][newMode]);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, timerType]);

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setMode('study');
        setTimeLeft(timers[timerType].study);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div>
            <h2>{mode === 'study' ? 'Foco' : 'Pausa'}</h2>
            <h1>{formatTime(timeLeft)}</h1>

            <select value={timerType} onChange={(e) => setTimerType(e.target.value)} disabled={isActive}>
                <option value="25/5">25/5</option>
                <option value="30/5">30/5</option>
                <option value="30/10">30/10</option>
                <option value="50/10">50/10</option>
            </select>

            <button onClick={toggleTimer}>{isActive ? 'Pausar' : 'Começar'}</button>
            <button onClick={resetTimer}>Resetar</button>
        </div>
    );
}