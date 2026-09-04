import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  CheckSquare,
  Bookmark,
  Download,
  Plus,
  Trash2,
  Share2,
  Lock,
  Check,
} from 'lucide-react';
import { useWebRTC } from '../../context/WebRTCContext';

export const NotesDrawer: React.FC = () => {
  const {
    roomId,
    userName,
    sharedNotes,
    updateSharedNotes,
    tasks,
    addTask,
    toggleTask,
    deleteTask,
    participants,
  } = useWebRTC();

  const [activeTab, setActiveTab] = useState<'notes' | 'todos' | 'templates'>('notes');
  const [notesMode, setNotesMode] = useState<'shared' | 'personal'>('shared');
  const [personalNotes, setPersonalNotes] = useState<string>(() => {
    return localStorage.getItem(`meet_personal_notes_${roomId}`) || '# My Private Notes\n- Key takeaways:\n';
  });

  // Local state for debounced shared notes (350ms)
  const [localSharedNotes, setLocalSharedNotes] = useState(sharedNotes);
  const isTypingSharedRef = useRef(false);

  // Sync external remote shared notes updates when not actively typing
  useEffect(() => {
    if (!isTypingSharedRef.current) {
      setLocalSharedNotes(sharedNotes);
    }
  }, [sharedNotes]);

  // Debounce shared notes broadcasting by 350ms
  useEffect(() => {
    if (localSharedNotes === sharedNotes) {
      isTypingSharedRef.current = false;
      return;
    }
    isTypingSharedRef.current = true;
    const timer = setTimeout(() => {
      updateSharedNotes(localSharedNotes);
      isTypingSharedRef.current = false;
    }, 350);
    return () => clearTimeout(timer);
  }, [localSharedNotes, sharedNotes, updateSharedNotes]);

  // To-Do form state
  const [taskText, setTaskText] = useState('');
  const [taskPriority, setTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [taskAssignee, setTaskAssignee] = useState(userName);
  const [todoFilter, setTodoFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Save personal notes to localStorage
  useEffect(() => {
    if (roomId) {
      localStorage.setItem(`meet_personal_notes_${roomId}`, personalNotes);
    }
  }, [personalNotes, roomId]);

  // Export Notes as Markdown file
  const handleExportMarkdown = () => {
    const textToExport = notesMode === 'shared' ? localSharedNotes : personalNotes;
    const blob = new Blob([textToExport], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `meeting-notes-${roomId || 'session'}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskText.trim()) return;
    addTask(taskText.trim(), taskPriority, taskAssignee);
    setTaskText('');
  };

  // Pre-configured structured meeting templates
  const applyTemplate = (templateContent: string) => {
    if (notesMode === 'shared') {
      const updated = localSharedNotes + '\n\n' + templateContent;
      setLocalSharedNotes(updated);
      updateSharedNotes(updated);
    } else {
      setPersonalNotes(personalNotes + '\n\n' + templateContent);
    }
    setActiveTab('notes');
  };

  const TEMPLATES = [
    {
      title: '🏃 Sprint Standup',
      desc: 'Yesterday, Today, and Blockers',
      content: `### 🏃 Sprint Standup\n- **What did you accomplish yesterday?**\n  - \n- **What will you do today?**\n  - \n- **Any blockers?**\n  - None\n`,
    },
    {
      title: '🤝 1-on-1 Catchup',
      desc: 'Wins, feedback, goals & priorities',
      content: `### 🤝 1-on-1 Sync\n- **Recent Wins & Highlights:**\n  - \n- **Current Challenges / Discussion Topics:**\n  - \n- **Action Items & Next Steps:**\n  - \n`,
    },
    {
      title: '💡 Brainstorming Session',
      desc: 'Problem statement, ideas & next steps',
      content: `### 💡 Brainstorming\n- **Problem to Solve:**\n  - \n- **Raw Ideas & Exploration:**\n  - Idea 1:\n  - Idea 2:\n- **Top Selected Solutions:**\n  - \n`,
    },
    {
      title: '⚖️ Decision & Architecture Log',
      desc: 'Context, decision, and consequences',
      content: `### ⚖️ Decision Log (ADR)\n- **Context / Problem:**\n  - \n- **Decision Made:**\n  - \n- **Expected Impact:**\n  - \n`,
    },
  ];

  const priorityWeight: Record<'high' | 'medium' | 'low', number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const filteredTasks = tasks.filter((t) => {
    if (todoFilter === 'active') return !t.completed;
    if (todoFilter === 'completed') return t.completed;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pA = priorityWeight[a.priority] || 1;
    const pB = priorityWeight[b.priority] || 1;
    if (pB !== pA) return pB - pA;
    return b.createdAt - a.createdAt;
  });

  return (
    <div className="w-full h-full flex flex-col" style={{ color: 'var(--text-main)' }}>
      {/* Sub-Header Tabs */}
      <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-1 bg-black/20 dark:bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'notes' ? 'bg-[var(--accent-color)] text-[var(--badge-text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Notes</span>
          </button>

          <button
            onClick={() => setActiveTab('todos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
              activeTab === 'todos' ? 'bg-[var(--accent-color)] text-[var(--badge-text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>To-Do</span>
            {tasks.filter((t) => !t.completed).length > 0 && (
              <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {tasks.filter((t) => !t.completed).length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'templates' ? 'bg-[var(--accent-color)] text-[var(--badge-text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Templates</span>
          </button>
        </div>

        {/* Export Button */}
        {activeTab === 'notes' && (
          <button
            onClick={handleExportMarkdown}
            className="p-1.5 rounded-lg border hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border-color)', color: 'var(--accent-color)' }}
            title="Download Notes as Markdown"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tab 1: Meeting Notes */}
      {activeTab === 'notes' && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Shared vs Personal Mode Switcher */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setNotesMode('shared')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  notesMode === 'shared'
                    ? 'border-[var(--accent-color)] text-[var(--accent-color)] font-bold'
                    : 'border-transparent text-[var(--text-muted)]'
                }`}
              >
                <Share2 className="w-3 h-3" />
                Shared with Room
              </button>
              <button
                onClick={() => setNotesMode('personal')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  notesMode === 'personal'
                    ? 'border-[var(--accent-color)] text-[var(--accent-color)] font-bold'
                    : 'border-transparent text-[var(--text-muted)]'
                }`}
              >
                <Lock className="w-3 h-3" />
                Personal Only
              </button>
            </div>

            <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
              Auto-saved
            </span>
          </div>

          {/* Text Editor Area */}
          <textarea
            value={notesMode === 'shared' ? localSharedNotes : personalNotes}
            onChange={(e) => {
              if (notesMode === 'shared') {
                setLocalSharedNotes(e.target.value);
              } else {
                setPersonalNotes(e.target.value);
              }
            }}
            placeholder={
              notesMode === 'shared'
                ? 'Type shared meeting notes here... Anyone in this call can view and edit!'
                : 'Type your private notes here... Only you can see this!'
            }
            className="flex-1 w-full p-3 rounded-2xl border text-sm font-sans resize-none outline-none leading-relaxed transition-all focus:ring-1 focus:ring-[var(--accent-color)]"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-main)',
            }}
          />
        </div>
      )}

      {/* Tab 2: To-Do & Action Items */}
      {activeTab === 'todos' && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* New Task Form */}
          <form onSubmit={handleAddTask} className="flex flex-col gap-2.5 mb-4 p-3 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <input
              type="text"
              placeholder="Add an action item or task..."
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              className="w-full text-xs p-2 rounded-xl border outline-none font-medium"
              style={{
                backgroundColor: 'var(--bg-input)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-main)',
              }}
            />

            <div className="flex items-center justify-between gap-2">
              {/* Priority Selector */}
              <div className="flex items-center gap-1 text-[11px]">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setTaskPriority(p)}
                    className={`px-2 py-0.5 rounded-full capitalize font-semibold cursor-pointer border ${
                      taskPriority === p
                        ? p === 'high'
                          ? 'bg-red-500/20 border-red-500 text-red-500'
                          : p === 'medium'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                          : 'bg-green-500/20 border-green-500 text-green-500'
                        : 'border-transparent text-[var(--text-muted)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Assignee Picker */}
              <select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                className="text-[11px] px-2 py-1 rounded-lg border outline-none"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-main)',
                }}
              >
                <option value={userName}>{userName} (You)</option>
                {participants.map((p) => (
                  <option key={p.socketId} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!taskText.trim()}
                className="px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--accent-color)',
                  color: 'var(--badge-text)',
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
          </form>

          {/* Filter tabs */}
          <div className="flex items-center gap-2 mb-3 text-xs">
            {(['all', 'active', 'completed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTodoFilter(f)}
                className={`capitalize font-semibold cursor-pointer pb-1 border-b-2 transition-colors ${
                  todoFilter === f
                    ? 'border-[var(--accent-color)] text-[var(--accent-color)]'
                    : 'border-transparent text-[var(--text-muted)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Task List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {sortedTasks.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center">
                <CheckSquare className="w-8 h-8 mb-2 opacity-30" style={{ color: 'var(--accent-color)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  No tasks found in this view.
                </span>
              </div>
            ) : (
              sortedTasks.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start justify-between p-3 rounded-xl border transition-all group"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  <div className="flex items-start gap-2.5 flex-1 mr-2">
                    <button
                      onClick={() => toggleTask(t.id)}
                      className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-all cursor-pointer flex-shrink-0 ${
                        t.completed ? 'bg-green-500 border-green-500 text-white' : 'border-[var(--border-color)]'
                      }`}
                    >
                      {t.completed && <Check className="w-3 h-3" />}
                    </button>

                    <div>
                      <p
                        className={`text-xs font-medium leading-tight ${
                          t.completed ? 'line-through opacity-50' : ''
                        }`}
                        style={{ color: 'var(--text-main)' }}
                      >
                        {t.text}
                      </p>

                      <div className="flex items-center gap-2 mt-1.5 text-[10px]">
                        <span
                          className={`font-semibold uppercase tracking-wider ${
                            t.priority === 'high'
                              ? 'text-red-500'
                              : t.priority === 'medium'
                              ? 'text-amber-500'
                              : 'text-green-500'
                          }`}
                        >
                          ● {t.priority}
                        </span>
                        {t.assignee && (
                          <span style={{ color: 'var(--text-muted)' }}>
                            👤 {t.assignee}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTask(t.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-500 transition-opacity cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Meeting Templates */}
      {activeTab === 'templates' && (
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          <div className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
            Insert a ready-made structure directly into your meeting notes:
          </div>

          {TEMPLATES.map((tmpl, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl border transition-all hover:border-[var(--accent-color)] card-theme"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-color)',
              }}
            >
              <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--text-main)' }}>
                {tmpl.title}
              </h4>
              <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                {tmpl.desc}
              </p>
              <button
                onClick={() => applyTemplate(tmpl.content)}
                className="w-full py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border"
                style={{
                  borderColor: 'var(--accent-color)',
                  color: 'var(--accent-color)',
                  backgroundColor: 'transparent',
                }}
              >
                Insert into Notes
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
