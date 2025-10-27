"use client";
import { useState, useEffect } from "react";

const timers = {
    "25/5": { study: 25 * 60, break: 5 * 60 },
    "30/5": { study: 30 * 60, break: 5 * 60 },
    "30/10": { study: 30 * 60, break: 10 * 60 },
    "50/10": { study: 50 * 60, break: 10 * 60 },
};

export default function PomodoroTimer({ onBreakChange }) {
    const [mode, setMode] = useState("study");
    const [timerType, setTimerType] = useState("25/5");
    const [timeLeft, setTimeLeft] = useState(timers["25/5"].study);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        onBreakChange(mode === "break");
    }, [mode, onBreakChange]);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((t) => t - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            const newMode = mode === "study" ? "break" : "study";
            setMode(newMode);
            setTimeLeft(timers[timerType][newMode]);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, mode, timerType]);

    const toggleTimer = () => setIsActive(!isActive);
    const resetTimer = () => {
        setIsActive(false);
        setMode("study");
        setTimeLeft(timers[timerType].study);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const total = timers[timerType][mode];
    const progress = ((total - timeLeft) / total) * 100;

    return (
        <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white/10 backdrop-blur-md shadow-lg max-w-xs mx-auto text-center">
            <h2 className="text-lg font-semibold text-gray-200 tracking-wide">
                {mode === "study" ? "⏳ Foco" : "☕ Pausa"}
            </h2>

            <h1 className="text-6xl font-bold text-white drop-shadow-md">
                {formatTime(timeLeft)}
            </h1>

            {/* Barra de progresso */}
            <div className="w-full h-2 bg-gray-300/20 rounded-full overflow-hidden">
                <div
                    className={`h-full ${mode === "study" ? "bg-green-400" : "bg-blue-400"
                        } transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {/* Controles */}
            <div className="flex flex-col gap-3 w-full mt-2">
                <select
                    value={timerType}
                    onChange={(e) => setTimerType(e.target.value)}
                    disabled={isActive}
                    className="bg-white/20 text-white px-3 py-2 rounded-lg text-center backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                >
                    <option value="25/5">25/5</option>
                    <option value="30/5">30/5</option>
                    <option value="30/10">30/10</option>
                    <option value="50/10">50/10</option>
                </select>

                <div className="flex justify-center gap-3">
                    <button
                        onClick={toggleTimer}
                        className={`px-4 py-2 rounded-lg font-medium text-white transition ${isActive
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-green-500 hover:bg-green-600"
                            }`}
                    >
                        {isActive ? "Pausar" : "Começar"}
                    </button>

                    <button
                        onClick={resetTimer}
                        className="px-4 py-2 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 transition"
                    >
                        Resetar
                    </button>
                </div>
            </div>
        </div>
    );
}
