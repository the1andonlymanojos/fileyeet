import QRCode from 'qrcode.react';

export default function QRCodeDisplay({ callId }: any) {
    return (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg p-10 relative overflow-hidden
        bg-white dark:bg-gray-800 hover:bg-gray-100 hover:dark:bg-gray-600 ease-in-out transition-colors duration-500
        aspect-square max-w-72 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="text-gray-600 dark:text-gray-300 flex-col flex items-center justify-center space-y-2 relative z-10">
                <p className="font-bold">Share this code with the receiver in any way you prefer:</p>
                <QRCode value={callId} size={128}/>
                <p className="text-xl font-mono">{callId}</p>
            </div>
        </div>
    );
}
