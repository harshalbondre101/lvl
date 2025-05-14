import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

const App = () => {
  // State Management
  const [level, setLevel] = useState(0);
  const [exp, setExp] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [pomodoro, setPomodoro] = useState({ isRunning: false, time: 25 * 60, sessionType: 'work' });
  const [analytics, setAnalytics] = useState({ daily: [], weekly: [], monthly: [] });
  const [streaks, setStreaks] = useState({});

  // Level and EXP Logic
  const expForNextLevel = 40 + (level * 10);
  const addExp = (amount) => {
    let newExp = exp + amount;
    while (newExp >= expForNextLevel) {
      newExp -= expForNextLevel;
      setLevel(level + 1);
    }
    setExp(newExp);
  };

  // Task Management
  const addTask = (title, description, priority, category, deadline) => {
    setTasks([...tasks, {
      id: Date.now(),
      title,
      description,
      priority,
      category,
      deadline,
      subtasks: [],
      completed: false,
    }]);
  };

  const addSubtask = (taskId, subtaskTitle) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, subtasks: [...task.subtasks, { id: Date.now(), title: subtaskTitle, completed: false }] }
        : task
    ));
  };

  const completeTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: task.subtasks.every(sub => sub.completed) }
        : task
    ));
    if (tasks.find(task => task.id === taskId).subtasks.every(sub => sub.completed)) {
      addExp(10);
    }
  };

  // Pomodoro Timer
  useEffect(() => {
    let timer;
    if (pomodoro.isRunning && pomodoro.time > 0) {
      timer = setInterval(() => {
        setPomodoro(prev => ({ ...prev, time: prev.time - 1 }));
      }, 1000);
    } else if (pomodoro.time === 0) {
      if (pomodoro.sessionType === 'work') {
        addExp(5);
        setPomodoro({ isRunning: false, time: 5 * 60, sessionType: 'break' });
      } else {
        setPomodoro({ isRunning: false, time: 25 * 60, sessionType: 'work' });
      }
    }
    return () => clearInterval(timer);
  }, [pomodoro.isRunning, pomodoro.time]);

  const startPomodoro = () => setPomodoro({ ...pomodoro, isRunning: true });
  const stopPomodoro = () => {
    setPomodoro({ ...pomodoro, isRunning: false });
    addExp(-1); // Penalty for stopping
  };

  // Daily Penalty Check
  useEffect(() => {
    const checkDailyPenalty = () => {
      const today = new Date().toDateString();
      if (!tasks.some(task => task.completed && new Date(task.deadline).toDateString() === today)) {
        addExp(-5);
      }
    };
    const interval = setInterval(checkDailyPenalty, 24 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [tasks]);

  // Streak Logic
  const updateStreak = (category) => {
    setStreaks(prev => ({
      ...prev,
      [category]: prev[category] ? { ...prev[category], count: prev[category].count + 1 } : { count: 1, lastUpdated: new Date() }
    }));
  };

  // Components
  const LevelDisplay = () => (
    <div className="bg-blue-500 text-white p-4 text-center">
      <h1 className="text-2xl">Level {level}</h1>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(exp / expForNextLevel) * 100}%` }}></div>
      </div>
      <p>{exp}/{expForNextLevel} EXP</p>
    </div>
  );

  const TaskForm = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [category, setCategory] = useState('Mind');
    const [deadline, setDeadline] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      addTask(title, description, priority, category, deadline);
      setTitle('');
      setDescription('');
      setDeadline('');
    };

    return (
      <form onSubmit={handleSubmit} className="p-4 bg-gray-100">
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Task Title" 
          className="w-full p-2 mb-2 border rounded"
          required 
        />
        <textarea 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Description" 
          className="w-full p-2 mb-2 border rounded"
        />
        <select 
          value={priority} 
          onChange={(e) => setPriority(e.target.value)} 
          className="w-full p-2 mb-2 border rounded"
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>
        <select 
          value={category} 
          onChange={(e) => setCategory(e.target.value)} 
          className="w-full p-2 mb-2 border rounded"
        >
          <option>Mind</option>
          <option>Brain</option>
          <option>Health</option>
          <option>Social</option>
          <option>Relationships</option>
        </select>
        <input 
          type="date" 
          value={deadline} 
          onChange={(e) => setDeadline(e.target.value)} 
          className="w-full p-2 mb-2 border rounded"
          required 
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Add Task</button>
      </form>
    );
  };

  const TaskList = () => (
    <div className="p-4">
      {tasks.map(task => (
        <div key={task.id} className="mb-4 p-4 bg-white rounded shadow">
          <h2 className="text-lg font-bold">{task.title}</h2>
          <p>{task.description}</p>
          <p>Priority: {task.priority}</p>
          <p>Category: {task.category}</p>
          <p>Deadline: {task.deadline}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-500 h-2.5 rounded-full" 
              style={{ width: `${(task.subtasks.filter(sub => sub.completed).length / task.subtasks.length) * 100}%` }}
            ></div>
          </div>
          <button 
            onClick={() => completeTask(task.id)} 
            className="mt-2 bg-green-500 text-white p-2 rounded"
            disabled={!task.subtasks.every(sub => sub.completed)}
          >
            Complete Task
          </button>
          <SubtaskForm taskId={task.id} />
          <SubtaskList task={task} />
        </div>
      ))}
    </div>
  );

  const SubtaskForm = ({ taskId }) => {
    const [subtaskTitle, setSubtaskTitle] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      addSubtask(taskId, subtaskTitle);
      setSubtaskTitle('');
    };

    return (
      <form onSubmit={handleSubmit} className="mt-2">
        <input 
          type="text" 
          value={subtaskTitle} 
          onChange={(e) => setSubtaskTitle(e.target.value)} 
          placeholder="Subtask Title" 
          className="w-full p-2 mb-2 border rounded"
          required 
        />
        <button type="submit" className="w-full bg-blue-300 text-white p-2 rounded">Add Subtask</button>
      </form>
    );
  };

  const SubtaskList = ({ task }) => (
    <div className="mt-2">
      {task.subtasks.map(subtask => (
        <div key={subtask.id} className="flex items-center mb-2">
          <input 
            type="checkbox" 
            checked={subtask.completed} 
            onChange={() => {
              setTasks(tasks.map(t => 
                t.id === task.id 
                  ? { ...t, subtasks: t.subtasks.map(s => 
                      s.id === subtask.id ? { ...s, completed: !s.completed } : s
                    )} 
                  : t
              ));
            }} 
            className="mr-2"
          />
          <span>{subtask.title}</span>
        </div>
      ))}
    </div>
  );

  const PomodoroTimer = () => (
    <div className="fixed bottom-0 w-full bg-gray-800 text-white p-4">
      <p>{Math.floor(pomodoro.time / 60)}:{(pomodoro.time % 60).toString().padStart(2, '0')} ({pomodoro.sessionType})</p>
      <button 
        onClick={startPomodoro} 
        className="bg-green-500 text-white p-2 rounded mr-2"
        disabled={pomodoro.isRunning}
      >
        Start
      </button>
      <button 
        onClick={stopPomodoro} 
        className="bg-red-500 text-white p-2 rounded"
        disabled={!pomodoro.isRunning}
      >
        Stop
      </button>
    </div>
  );

  const AnalyticsPanel = () => (
    <div className="p-4 bg-gray-100">
      <h2 className="text-xl font-bold">Analytics</h2>
      <p>Daily Tasks Completed: {analytics.daily.length}</p>
      <p>Weekly EXP: {analytics.weekly.reduce((sum, day) => sum + day.exp, 0)}</p>
      <p>Monthly Streaks: {Object.keys(streaks).length}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <LevelDisplay />
      <TaskForm />
      <TaskList />
      <PomodoroTimer />
      <AnalyticsPanel />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));