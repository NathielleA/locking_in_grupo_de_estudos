import React, { useState } from 'react';

export default function TodoList() {
    const [tasks, setTasks] = useState([]);
    const [newTask, setNewTask] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (newTask.trim() === '') return;
        setTasks([...tasks, { id: Date.now(), text: newTask, done: false }]);
        setNewTask('');
    };

    const toggleDone = (id) => {
        setTasks(
            tasks.map((task) =>
                task.id === id ? { ...task, done: !task.done } : task
            )
        );
    };

    return (
        <div>
            <h3>Minhas Tarefas da Sessão</h3>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Adicionar tarefa..."
                />
                <button type="submit">Add</button>
            </form>
            <ul>
                {tasks.map((task) => (
                    <li
                        key={task.id}
                        onClick={() => toggleDone(task.id)}
                        style={{ textDecoration: task.done ? 'line-through' : 'none' }}
                    >
                        {task.text}
                    </li>
                ))}
            </ul>
        </div>
    );
}