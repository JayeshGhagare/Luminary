import React from 'react';
import { ParticipantTile } from './ParticipantTile';
import { useWebRTC } from '../../context/WebRTCContext';

export const VideoGrid: React.FC = () => {
  const {
    localStream,
    screenStream,
    isAudioMuted,
    isVideoMuted,
    isScreenSharing,
    userName,
    isHandRaised,
    participants,
    pinnedSocketId,
    setPinnedSocketId,
    layoutMode,
    isHost,
  } = useWebRTC();

  // Check if ANY participant in the room is sharing their screen (local or remote)
  const remoteScreenPresenter = participants.find((p) => p.isScreenSharing);
  const isAnyonePresenting = isScreenSharing || !!remoteScreenPresenter;
  const isSpotlightActive = !!pinnedSocketId || isAnyonePresenting || layoutMode === 'spotlight' || layoutMode === 'sidebar';

  const totalTiles = 1 + (isScreenSharing ? 1 : 0) + participants.length;

  // Render Spotlight + Strip layout whenever screen sharing or pin is active
  if (isSpotlightActive) {
    const pinnedParticipant = participants.find((p) => p.socketId === pinnedSocketId);

    return (
      <div className="w-full h-full flex flex-col lg:flex-row gap-3 p-2 md:p-4 overflow-hidden">
        {/* Main Stage Spotlight */}
        <div className="flex-1 h-[60vh] lg:h-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl relative">
          {isScreenSharing ? (
            /* Local user is presenting screen */
            <ParticipantTile
              isSelf={true}
              userName={userName}
              isScreenShareTile={true}
              screenStream={screenStream}
              isPinned={true}
              onTogglePin={() => setPinnedSocketId(null)}
            />
          ) : remoteScreenPresenter ? (
            /* Remote peer is presenting screen */
            <ParticipantTile
              participant={remoteScreenPresenter}
              isScreenShareTile={true}
              isPinned={true}
              onTogglePin={() => setPinnedSocketId(null)}
            />
          ) : pinnedParticipant ? (
            /* Manually pinned participant */
            <ParticipantTile
              participant={pinnedParticipant}
              isPinned={true}
              onTogglePin={() => setPinnedSocketId(null)}
            />
          ) : (
            /* Spotlight self */
            <ParticipantTile
              isSelf={true}
              isHost={isHost}
              localStream={localStream}
              isAudioMuted={isAudioMuted}
              isVideoMuted={isVideoMuted}
              userName={userName}
              isHandRaised={isHandRaised}
              isPinned={true}
              onTogglePin={() => setPinnedSocketId(null)}
            />
          )}
        </div>

        {/* Side / Bottom Strip of other attendees */}
        <div className="w-full lg:w-72 xl:w-80 h-36 lg:h-full flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto pb-2 lg:pb-0 flex-shrink-0">
          {/* Always show self camera in sidebar strip when in spotlight */}
          {pinnedSocketId !== 'self' && (
            <div className="w-48 lg:w-full h-full lg:h-44 flex-shrink-0">
              <ParticipantTile
                isSelf={true}
                isHost={isHost}
                localStream={localStream}
                isAudioMuted={isAudioMuted}
                isVideoMuted={isVideoMuted}
                userName={userName}
                isHandRaised={isHandRaised}
                isPinned={pinnedSocketId === 'self'}
                onTogglePin={() => setPinnedSocketId(pinnedSocketId === 'self' ? null : 'self')}
              />
            </div>
          )}

          {/* Remote participants list */}
          {participants.map((p) => {
            // If this participant is already on the main stage as pinned without screen sharing, skip from strip
            if (p.socketId === pinnedSocketId && !isAnyonePresenting) return null;
            return (
              <div key={p.socketId} className="w-48 lg:w-full h-full lg:h-44 flex-shrink-0">
                <ParticipantTile
                  participant={p}
                  isPinned={pinnedSocketId === p.socketId}
                  onTogglePin={() => setPinnedSocketId(p.socketId)}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Responsive Tiled Grid Calculation
  const getGridColsClass = (count: number) => {
    if (count === 1) return 'grid-cols-1 max-w-4xl max-h-[80vh]';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    if (count <= 4) return 'grid-cols-1 sm:grid-cols-2';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-2 md:p-4 overflow-y-auto">
      <div
        className={`w-full h-full grid gap-3 md:gap-4 items-center justify-center ${getGridColsClass(
          totalTiles
        )}`}
      >
        {/* Local Self Tile */}
        <div className="w-full h-full min-h-[180px] max-h-[85vh]">
          <ParticipantTile
            isSelf={true}
            isHost={isHost}
            localStream={localStream}
            isAudioMuted={isAudioMuted}
            isVideoMuted={isVideoMuted}
            userName={userName}
            isHandRaised={isHandRaised}
            isPinned={pinnedSocketId === 'self'}
            onTogglePin={() => setPinnedSocketId(pinnedSocketId === 'self' ? null : 'self')}
          />
        </div>

        {/* Remote Participant Tiles */}
        {participants.map((p) => (
          <div key={p.socketId} className="w-full h-full min-h-[180px] max-h-[85vh]">
            <ParticipantTile
              participant={p}
              isPinned={pinnedSocketId === p.socketId}
              onTogglePin={() => setPinnedSocketId(p.socketId)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
