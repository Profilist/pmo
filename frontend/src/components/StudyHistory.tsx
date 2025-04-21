import { useEffect, useState } from 'react';
import { GetSessions } from '../../wailsjs/go/main/App';
import { main } from '../../wailsjs/go/models';

export function StudyHistory() {
    const [sessions, setSessions] = useState<main.StudySession[]>([]);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const data = await GetSessions();
            setSessions(data);
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    };

    return (
        <div className="study-history">
            <h2 className="text-xl font-bold mb-4">Study History</h2>
            <div className="space-y-2">
                {sessions.map((session) => (
                    <div
                        key={session.id}
                        className="p-4 bg-white rounded-lg shadow"
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold">{session.taskName || 'Unnamed Task'}</h3>
                                <p className="text-sm text-gray-600">
                                    {new Date(session.startTime).toLocaleString()}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-medium">
                                    {Math.floor(session.duration / 60)} minutes
                                </p>
                                <p className="text-sm text-gray-600">
                                    {session.completed ? 'Completed' : 'Interrupted'}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
