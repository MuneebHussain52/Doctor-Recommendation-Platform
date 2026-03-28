import { useMemo } from 'react';
import Messages from './Messages';

type Appointment = any;

interface Props {
  appointments: Appointment[];
}

export default function MessagesWrapper({ appointments }: Props) {
  // derive unique doctors
  const doctors = useMemo(() => {
    const map = new Map<number, any>();
    (appointments || []).forEach((a: any) => {
      const d = a?.doctor;
      if (d && !map.has(d.id)) map.set(d.id, d);
    });
    return Array.from(map.values());
  }, [appointments]);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-3">Messages</h3>
      <div className="flex gap-4">
        <div className="w-48 border-r pr-3">
          <div className="space-y-3">
            {doctors.length === 0 && <div className="text-sm text-gray-500">No conversations</div>}
            {doctors.map((doc: any) => (
              <div key={doc.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex-shrink-0">
                    {doc?.avatar ? (
                      <img className="h-10 w-10 rounded-full object-cover" src={doc.avatar} alt="" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-medium">{(doc?.name || 'D').charAt(0)}</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{doc?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500 truncate">{doc?.specialty || ''}</div>
                  </div>
                </div>
                <div>
                  <button
                    className="text-cyan-600 hover:text-cyan-800 text-sm font-medium"
                    onClick={() => {
                      // postMessage to child to open convo via DOM event
                      const ev = new CustomEvent('openConversation', { detail: { doctorId: doc.id } });
                      window.dispatchEvent(ev as Event);
                    }}
                  >
                    Open
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <Messages appointments={appointments} />
        </div>
      </div>
    </div>
  );
}
