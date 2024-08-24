export default function Terminal({ terminalVisible, toggleTerminal, logs }: any) {
    return (
        <div className="mt-6">
            <button
                className="w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
                onClick={toggleTerminal}
            >
                {terminalVisible ? 'Hide Terminal' : 'Show Terminal'}
            </button>
            {terminalVisible && (
                <div className="mt-2 bg-black text-green-400 p-4 rounded-lg h-32 overflow-y-auto font-mono">
                    {logs.length === 0 ? (
                        <p>No logs yet...</p>
                    ) : (
                        logs.map((log: string, index: number) => (
                            <p key={index}>{log}</p>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

