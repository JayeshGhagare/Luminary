import React, { useState } from 'react';
import { Copy, Check, Info, Phone, ShieldCheck } from 'lucide-react';
import { useWebRTC } from '../../context/WebRTCContext';

export const InfoDrawer: React.FC = () => {
  const { roomId } = useWebRTC();
  const [copied, setCopied] = useState(false);

  const meetingLink = `${window.location.origin}/?room=${roomId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full flex flex-col p-4" style={{ color: 'var(--text-main)' }}>
      <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
        <Info className="w-4 h-4" style={{ color: 'var(--accent-color)' }} />
        Meeting details
      </h3>

      <div className="space-y-4">
        {/* Joining info */}
        <div
          className="p-4 rounded-2xl border card-theme"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
          }}
        >
          <span className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
            Joining info
          </span>
          <div className="text-xs font-mono break-all mb-3 select-all" style={{ color: 'var(--text-main)' }}>
            {meetingLink}
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer hover:shadow-sm"
            style={{
              borderColor: 'var(--accent-color)',
              color: 'var(--accent-color)',
              backgroundColor: 'transparent',
            }}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-500" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy joining info</span>
              </>
            )}
          </button>
        </div>

        {/* Dial-in info */}
        <div
          className="p-4 rounded-2xl border"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2 mb-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            <Phone className="w-3.5 h-3.5 text-green-500" />
            Dial-in Number
          </div>
          <div className="text-xs font-mono" style={{ color: 'var(--text-main)' }}>
            +1 555-019-MEET
          </div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>
            PIN: 849 203 194#
          </div>
        </div>

        {/* Security / Encryption */}
        <div
          className="p-4 rounded-2xl border flex items-center gap-3"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div className="text-xs">
            <div className="font-semibold" style={{ color: 'var(--text-main)' }}>
              WebRTC Encrypted
            </div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Audio, video & presentations are encrypted via DTLS/SRTP.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
