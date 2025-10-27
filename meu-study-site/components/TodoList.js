"use client";

import React, { useState } from "react";
import { CheckCircle2, Circle, X } from "lucide-react"; // ícones bonitos e leves

export default function TodoList() {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newTask.trim() === "") return;
        setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]);
        setNewTask("");
    };

    const toggleDone = (id) => {
        setTasks(
            tasks.map((task) =>
                task.id === id ? { ...task, done: !task.done } : task
            )
        );
    };

    const removeTask = (id) => {
        setTasks(tasks.filter((task) => task.id !== id));
    };

    return (
        <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-2xl p-6 shadow-lg text-white">
            <h3 className="text-xl font-semibold mb-4 text-center tracking-wide">
                📝 Minhas Tarefas da Sessão
            </h3>

            {/* Formulário de adicionar tarefa */}
            <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 mb-5"
            >
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Adicionar tarefa..."
                    className="flex-grow px-3 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-green-400 backdrop-blur-sm"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition"
                >
                    Adicionar
                </button>
            </form>

            {/* Lista de tarefas */}
            <ul className="space-y-2">
                {tasks.length === 0 && (
                    <p className="text-gray-300 text-sm text-center">
                        Nenhuma tarefa adicionada ainda.
                    </p>
                )}

                {tasks.map((task) => (
                    <li
                        key={task.id}
                        className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2 hover:bg-white/20 transition"
                    >
                        <button
                            onClick={() => toggleDone(task.id)}
                            className="mr-3 text-green-400 hover:text-green-300 transition"
                        >
                            {task.done ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                <Circle className="w-5 h-5" />
                            )}
                        </button>

                        <span
                            onClick={() => toggleDone(task.id)}
                            className={`flex-grow cursor-pointer ${task.done
                                ? "line-through text-gray-400"
                                : "text-white"
                                }`}
                        >
                            {task.text}
                        </span>

                        <button
                            onClick={() => removeTask(task.id)}
                            className="text-red-400 hover:text-red-300 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
