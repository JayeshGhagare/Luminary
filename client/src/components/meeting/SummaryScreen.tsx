import React from 'react';
import {
  Clock,
  Users,
  ListTodo,
  FileText,
  MessageSquare,
  RotateCcw,
  Home,
  Download,
  ShieldCheck,
} from 'lucide-react';
import { useWebRTC } from '../../context/WebRTCContext';

interface SummaryScreenProps {
  onRejoin: (roomId: string) => void;
  onReturnHome: () => void;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({ onRejoin, onReturnHome }) => {
  const { summaryStats, sharedNotes, messages, clearSummaryStats } = useWebRTC();

  if (!summaryStats) return null;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins < 60) return `${mins}m ${secs}s`;
    const hrs = Math.floor(mins / 60);
    const remainMins = mins % 60;
    return `${hrs}h ${remainMins}m`;
  };

  const handleDownloadNotes = () => {
    const blob = new Blob([sharedNotes], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `luminary-notes-${summaryStats.roomId}-${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadChat = () => {
    if (messages.length === 0) return;
    const header = [
      `========================================`,
      ` Luminary Meeting Chat Transcript`,
      ` Room: ${summaryStats.roomId}`,
      ` Exported: ${new Date().toLocaleString()}`,
      ` Total Messages: ${messages.length}`,
      `========================================\n`,
    ].join('\n');

    const body = messages
      .map((m) => `[${m.time || new Date(m.timestamp).toLocaleTimeString()}] ${m.senderName}: ${m.text}`)
      .join('\n');

    const blob = new Blob([header + body], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `luminary-chat-${summaryStats.roomId}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRejoin = () => {
    const room = summaryStats.roomId;
    clearSummaryStats();
    onRejoin(room);
  };

  const handleHome = () => {
    clearSummaryStats();
    onReturnHome();
  };

  return (
    <div
      className="w-screen min-h-screen flex items-center justify-center p-4 md:p-8 select-none transition-colors duration-300"
      style={{ backgroundColor: 'var(--bg-app)' }}
    >
      <div
        className="max-w-xl w-full rounded-3xl border shadow-2xl p-6 md:p-8 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300 card-theme"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-color)',
          color: 'var(--text-main)',
        }}
      >
        {/* Header Badge & Title */}
        <div className="flex flex-col items-center text-center gap-2">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mb-1"
            style={{ backgroundColor: 'var(--accent-color)', color: 'var(--badge-text)' }}
          >
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>
            Meeting Ended
          </h2>

          <p className="text-xs md:text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            You have left room{' '}
            <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-[var(--bg-input)] border border-[var(--border-subtle)]">
              {summaryStats.roomId}
            </span>
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Duration */}
          <div
            className="p-3.5 rounded-2xl border flex flex-col items-center text-center gap-1.5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              Duration
            </span>
            <span className="text-base font-extrabold" style={{ color: 'var(--text-main)' }}>
              {formatDuration(summaryStats.durationSeconds)}
            </span>
          </div>

          {/* Attendees */}
          <div
            className="p-3.5 rounded-2xl border flex flex-col items-center text-center gap-1.5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              Attendees
            </span>
            <span className="text-base font-extrabold" style={{ color: 'var(--text-main)' }}>
              {summaryStats.totalParticipants}
            </span>
          </div>

          {/* Tasks */}
          <div
            className="p-3.5 rounded-2xl border flex flex-col items-center text-center gap-1.5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="w-8 h-8 rounded-xl bg-green-500/15 text-green-500 flex items-center justify-center">
              <ListTodo className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              Tasks Done
            </span>
            <span className="text-base font-extrabold" style={{ color: 'var(--text-main)' }}>
              {summaryStats.tasksCompleted}/{summaryStats.tasksCreated}
            </span>
          </div>

          {/* Chat Messages */}
          <div
            className="p-3.5 rounded-2xl border flex flex-col items-center text-center gap-1.5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              Messages
            </span>
            <span className="text-base font-extrabold" style={{ color: 'var(--text-main)' }}>
              {summaryStats.messagesCount}
            </span>
          </div>
        </div>

        {/* Meeting Artifacts Download Section */}
        <div
          className="p-4 rounded-2xl border flex flex-col gap-2.5"
          style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-subtle)' }}
        >
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Meeting Deliverables
          </span>

          <div className="flex flex-col sm:flex-row items-center gap-2">
            <button
              onClick={handleDownloadNotes}
              className="w-full sm:flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-colors cursor-pointer hover:bg-black/10 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              aria-label="Download meeting notes as Markdown"
            >
              <FileText className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
              <span>Download Notes ({summaryStats.notesWordCount} words)</span>
            </button>

            <button
              onClick={handleDownloadChat}
              disabled={summaryStats.messagesCount === 0}
              className="w-full sm:flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/10 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              aria-label="Download chat transcript as text"
            >
              <Download className="w-4 h-4 text-amber-500" />
              <span>Download Chat ({summaryStats.messagesCount})</span>
            </button>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleRejoin}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer transition-transform active:scale-98 hover:bg-black/10 dark:hover:bg-white/5"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
            aria-label="Rejoin meeting room"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Rejoin Meeting</span>
          </button>

          <button
            onClick={handleHome}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 btn-primary cursor-pointer transition-transform active:scale-98 shadow-md"
            aria-label="Return to home page"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    </div>
  );
};
