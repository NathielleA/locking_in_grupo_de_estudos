"use client";
import TodoList from '@/components/TodoList'; // O '@' é um atalho para a raiz do projeto
import PomodoroTimer from '@/components/PomodoroTimer';

// Esta é a sua página principal
export default function Home() {

  // Função "placeholder" que o Pomodoro precisa
  // Vamos implementar a lógica real dela depois
  interface BreakChangeHandler {
    (isBreak: boolean): void;
  }

  const handleBreakChange: BreakChangeHandler = (isBreak: boolean): void => {
    console.log("Agora é pausa?", isBreak);
  };

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Minha Sala de Estudos em Grupo</h1>
      <p>Bem-vindo ao seu espaço de foco!</p>

      <hr style={{ margin: '2rem 0' }} />

      {/* Carregando o componente do Pomodoro */}
      <PomodoroTimer onBreakChange={handleBreakChange} />

      <hr style={{ margin: '2rem 0' }} />

      {/* Carregando o componente da To-Do List */}
      <TodoList />

    </main>
  );
}