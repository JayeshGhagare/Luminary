import React, { useState } from 'react';
import { Search, Mic, MicOff, Hand, UserX, VolumeX, Crown, Lock, Unlock, Check, X, Clock } from 'lucide-react';
import { useWebRTC } from '../../context/WebRTCContext';

export const PeopleDrawer: React.FC = () => {
  const {
    userName,
    isAudioMuted,
    isVideoMuted,
    isHandRaised,
    isHost,
    participants,
    muteAllParticipants,
    lowerAllHands,
    kickParticipant,
    isRoomLocked,
    toggleRoomLock,
    waitingGuests,
    admitGuest,
    denyGuest,
  } = useWebRTC();

  const [searchQuery, setSearchQuery] = useState('');

  const allPeople = [
    {
      socketId: 'self',
      id: 'self',
      name: `${userName} (You)`,
      isAudioMuted,
      isVideoMuted,
      isHandRaised,
      isHost,
    },
    ...participants,
  ];

  const filtered = allPeople.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full flex flex-col p-4" style={{ color: 'var(--text-main)' }}>
      {/* Host Controls Action Bar */}
      {isHost && (
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={muteAllParticipants}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer hover:bg-black/10 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              aria-label="Mute all participants"
            >
              <VolumeX className="w-3.5 h-3.5 text-red-500" />
              Mute All
            </button>
            <button
              onClick={lowerAllHands}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer hover:bg-black/10 dark:hover:bg-white/5"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-main)' }}
              aria-label="Lower all raised hands"
            >
              <Hand className="w-3.5 h-3.5 text-amber-500" />
              Lower Hands
            </button>
          </div>

          {/* Room Lock Toggle Button */}
          <button
            onClick={toggleRoomLock}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isRoomLocked
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 hover:bg-amber-500/20'
                : 'hover:bg-black/10 dark:hover:bg-white/5'
            }`}
            style={{ borderColor: isRoomLocked ? undefined : 'var(--border-color)', color: isRoomLocked ? undefined : 'var(--text-main)' }}
            aria-label={isRoomLocked ? 'Unlock meeting room' : 'Lock meeting room'}
          >
            {isRoomLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Room Locked (Knock required)</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-green-500" />
                <span>Room Open (Anyone can join)</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Waiting Room / Knocking Queue (Host Only) */}
      {isHost && waitingGuests.length > 0 && (
        <div className="mb-4 p-3 rounded-xl border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 animate-spin-slow" />
              Waiting to Join ({waitingGuests.length})
            </span>
          </div>

          <div className="space-y-2">
            {waitingGuests.map((guest) => (
              <div
                key={guest.socketId}
                className="flex items-center justify-between p-2 rounded-lg border bg-[var(--bg-card)] border-[var(--border-subtle)]"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-500 text-[11px] font-bold flex items-center justify-center shrink-0">
                    {guest.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium truncate" style={{ color: 'var(--text-main)' }}>
                    {guest.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => admitGuest(guest.socketId)}
                    className="p-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-500 cursor-pointer transition-colors"
                    title={`Admit ${guest.name}`}
                    aria-label={`Admit ${guest.name}`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => denyGuest(guest.socketId)}
                    className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-500 cursor-pointer transition-colors"
                    title={`Decline ${guest.name}`}
                    aria-label={`Decline ${guest.name}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Box */}
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl border mb-4"
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-color)',
        }}
      >
        <Search className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search for people"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent text-xs outline-none"
          style={{ color: 'var(--text-main)' }}
        />
      </div>

      <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
        In Call ({allPeople.length})
      </div>

      {/* People List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {filtered.map((p) => (
          <div
            key={p.socketId}
            className="flex items-center justify-between p-2.5 rounded-xl border transition-colors"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                style={{ backgroundColor: p.socketId === 'self' ? 'var(--accent-color)' : '#444' }}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-main)' }}>
                    {p.name}
                  </span>
                  {p.isHost && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1"
                      style={{ backgroundColor: 'var(--accent-color)', color: 'var(--badge-text)' }}
                    >
                      <Crown className="w-2.5 h-2.5 fill-current" />
                      HOST
                    </span>
                  )}
                </div>
                {p.isHandRaised && (
                  <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                    <Hand className="w-3 h-3" /> Hand Raised
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div
                className={`p-1.5 rounded-full ${
                  p.isAudioMuted ? 'bg-red-500/20 text-red-500' : 'text-green-500'
                }`}
              >
                {p.isAudioMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </div>

              {isHost && p.socketId !== 'self' && (
                <button
                  onClick={() => kickParticipant(p.socketId)}
                  className="p-1.5 rounded-full text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Remove from meeting"
                >
                  <UserX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
